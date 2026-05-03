import { env } from '../config/env';
import { ELEVENLABS_VOICES } from '../types/video';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VoiceResult {
  audioPath: string;
  duration: number;
  wordTimings?: WordTiming[];
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export const generateVoiceover = async (
  script: string,
  voiceId: string = 'adam',
): Promise<VoiceResult> => {
  const elevenLabsVoiceId = ELEVENLABS_VOICES[voiceId] ?? ELEVENLABS_VOICES['adam'];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error: ${err}`);
  }

  const data = await response.json();

  // Decode base64 audio
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const tmpDir = os.tmpdir();
  const audioPath = path.join(tmpDir, `postmint-voice-${Date.now()}.mp3`);
  fs.writeFileSync(audioPath, audioBuffer);

  // Extract word timings from alignment data
  const wordTimings: WordTiming[] = [];
  if (data.alignment?.words) {
    for (const word of data.alignment.words) {
      wordTimings.push({
        word: word.word,
        startTime: word.start,
        endTime: word.end,
      });
    }
  }

  // Estimate duration from timings or file size
  const duration = wordTimings.length > 0
    ? wordTimings[wordTimings.length - 1].endTime
    : (audioBuffer.length / 16000); // rough estimate

  return { audioPath, duration, wordTimings };
};
