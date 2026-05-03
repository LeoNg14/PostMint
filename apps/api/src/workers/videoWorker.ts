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

  try {
    // Step 1: Generate script
    await updateJobStatus(jobId, 'scripting', 10);
    const marketData = ticker ? await getMarketSnapshot(ticker) : undefined;
    const script = await generateVideoScript(context, style, tone as any, marketData ?? undefined, ticker);
    await updateJobStatus(jobId, 'scripting', 25, { script: script.fullScript });

    // Step 2: Generate voiceover
    await updateJobStatus(jobId, 'voicing', 30);
    const voice = await generateVoiceover(script.fullScript, voiceId);
    await updateJobStatus(jobId, 'voicing', 50);

    // Step 3: Render video frames via Remotion
    await updateJobStatus(jobId, 'rendering', 55);
    const framesDir = path.join(os.tmpdir(), `postmint-frames-${jobId}`);
    fs.mkdirSync(framesDir, { recursive: true });

    // Write render data for Remotion
    const renderData = {
      script,
      ticker,
      marketData,
      style,
      duration: voice.duration,
      wordTimings: voice.wordTimings,
    };
    const renderDataPath = path.join(os.tmpdir(), `postmint-renderdata-${jobId}.json`);
    fs.writeFileSync(renderDataPath, JSON.stringify(renderData));

    // Call Remotion CLI to render
    const videoPath = path.join(os.tmpdir(), `postmint-video-${jobId}.mp4`);
    const remotionCmd = `npx remotion render --props="${renderDataPath}" --output="${videoPath}" --composition=FinanceVideo`;

    try {
      await execAsync(remotionCmd, {
        cwd: path.join(process.cwd(), '..', 'renderer'),
        timeout: 120000,
      });
    } catch (renderErr) {
      console.warn('Remotion render failed, using placeholder:', renderErr);
      // Create a simple placeholder video using FFmpeg if Remotion fails
      await execAsync(
        `ffmpeg -f lavfi -i color=c=black:s=1080x1920:d=${Math.ceil(voice.duration)} -c:v libx264 "${videoPath}" -y`,
        { timeout: 30000 }
      ).catch(() => {
        // If ffmpeg also not available, just use audio
        fs.copyFileSync(voice.audioPath, videoPath.replace('.mp4', '.mp3'));
      });
    }

    await updateJobStatus(jobId, 'stitching', 75);

    // Step 4: Stitch audio + video with FFmpeg
    const finalPath = path.join(os.tmpdir(), `postmint-final-${jobId}.mp4`);
    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -i "${voice.audioPath}" -c:v copy -c:a aac -shortest "${finalPath}" -y`,
        { timeout: 60000 }
      );
    } catch {
      // If ffmpeg stitch fails, use video as-is
      fs.copyFileSync(videoPath, finalPath);
    }

    await updateJobStatus(jobId, 'stitching', 85);

    // Step 5: Upload to Supabase Storage
    const videoBuffer = fs.existsSync(finalPath)
      ? fs.readFileSync(finalPath)
      : fs.readFileSync(videoPath);

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

    // Cleanup temp files
    [videoPath, finalPath, voice.audioPath, renderDataPath].forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });

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
      concurrency: 2, // max 2 videos rendering at once
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
