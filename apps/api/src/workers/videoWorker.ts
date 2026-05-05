import { Worker, Job } from 'bullmq';
import { queueConnection } from '../config/queue';
import { supabaseAdmin } from '../config/supabase';
import { generateVideoScript } from '../services/scriptService';
import { generateVoiceover } from '../services/voiceService';
import { getMarketSnapshot } from '../services/marketService';
import { VideoJobData, VideoJobResult, VideoStatus } from '../types/video';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';

const execAsync = promisify(exec);

const updateJobStatus = async (
  jobId: string,
  status: VideoStatus,
  progress: number,
  extra: Record<string, any> = {}
) => {
  await supabaseAdmin
    .from('video_jobs')
    .update({ status, progress, updated_at: new Date().toISOString(), ...extra })
    .eq('id', jobId);
};

const processVideoJob = async (job: Job<VideoJobData>): Promise<VideoJobResult> => {
  const { userId, jobId, ticker, context, tone, style, voiceId } = job.data;

  console.log(`Processing video job ${jobId} for user ${userId}`);

  const tempFiles: string[] = [];

  try {
    // Step 1: Generate script
    await updateJobStatus(jobId, 'scripting', 10);
    const marketData = ticker ? await getMarketSnapshot(ticker) : undefined;
    const script = await generateVideoScript(context, style, tone as any, marketData ?? undefined, ticker);
    await updateJobStatus(jobId, 'scripting', 25, { script: script.fullScript });

    // Step 2: Generate voiceover
    await updateJobStatus(jobId, 'voicing', 30);
    const voice = await generateVoiceover(script.fullScript, voiceId);
    tempFiles.push(voice.audioPath);
    await updateJobStatus(jobId, 'voicing', 50);

    // Step 3: Render video via Remotion (audio embedded directly in the composition)
    await updateJobStatus(jobId, 'rendering', 55);

    // Base64-encode the audio so Remotion can embed it via <Audio src="data:…" />
    // This is the most reliable way to get audio into the final video without
    // needing a separate FFmpeg stitch step that can fail on Windows paths.
    const audioBuffer = fs.readFileSync(voice.audioPath);
    const audioSrc = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    const renderData = {
      script,
      ticker,
      marketData,
      style,
      duration: voice.duration,
      wordTimings: voice.wordTimings,
      audioSrc, // embedded in the Remotion <Audio> component
    };

    const renderDataPath = path.join(os.tmpdir(), `postmint-renderdata-${jobId}.json`);
    fs.writeFileSync(renderDataPath, JSON.stringify(renderData));
    tempFiles.push(renderDataPath);

    const videoPath = path.join(os.tmpdir(), `postmint-video-${jobId}.mp4`);
    tempFiles.push(videoPath);

    // Remotion v4 CLI: <entry-file> <composition-id> [options]
    // The renderer package must be in apps/renderer relative to the API working dir.
    const rendererDir = path.join(process.cwd(), '..', 'renderer');
    const remotionCmd = [
      'npx remotion render',
      'src/index.ts',
      'FinanceVideo',
      `--props="${renderDataPath}"`,
      `--output="${videoPath}"`,
      '--log=verbose',
    ].join(' ');

    console.log(`Running Remotion: ${remotionCmd}`);

    try {
      const { stdout, stderr } = await execAsync(remotionCmd, {
        cwd: rendererDir,
        timeout: 180000, // 3 minutes
      });
      if (stderr) console.warn('Remotion stderr:', stderr.slice(-2000));
      console.log('Remotion stdout:', stdout.slice(-1000));
    } catch (renderErr: any) {
      console.error('Remotion render failed:', renderErr?.message ?? renderErr);
      // Fallback: silent black video (audio was embedded via <Audio>, so we still
      // attempt a basic render so the upload step has something to work with)
      if (ffmpegPath) {
        try {
          await execAsync(
            `"${ffmpegPath}" -f lavfi -i color=c=black:s=1080x1920:r=30:d=${Math.ceil(voice.duration + 3)} -i "${voice.audioPath}" -c:v libx264 -c:a aac -shortest "${videoPath}" -y`,
            { timeout: 60000 }
          );
          console.log('Created FFmpeg fallback video with audio');
        } catch (ffmpegErr) {
          console.error('FFmpeg fallback also failed:', ffmpegErr);
          throw renderErr; // re-throw the original Remotion error
        }
      } else {
        throw renderErr;
      }
    }

    await updateJobStatus(jobId, 'stitching', 80);

    // Step 4: Upload to Supabase Storage
    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file not found after render');
    }

    const videoBuffer = fs.readFileSync(videoPath);
    const storagePath = `videos/${userId}/${jobId}.mp4`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('postmint-videos')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('postmint-videos')
      .getPublicUrl(storagePath);

    // Cleanup
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch {}
    }

    await updateJobStatus(jobId, 'done', 100, {
      video_url: publicUrl,
      duration: Math.round(voice.duration),
    });

    return {
      videoUrl: publicUrl,
      thumbnailUrl: '',
      duration: Math.round(voice.duration),
      script: script.fullScript,
    };

  } catch (err: any) {
    console.error(`Video job ${jobId} failed:`, err);
    // Attempt cleanup even on failure
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    await updateJobStatus(jobId, 'failed', 0, {
      error_message: err.message ?? 'Unknown error',
    });
    throw err;
  }
};

export const startVideoWorker = () => {
  const worker = new Worker<VideoJobData, VideoJobResult>(
    'video-generation',
    processVideoJob,
    {
      connection: queueConnection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Video job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Video job ${job?.id} failed:`, err.message);
  });

  console.log('Video worker started');
  return worker;
};
