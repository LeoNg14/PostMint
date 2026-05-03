export interface VideoJobData {
  userId: string;
  jobId: string;
  ticker?: string;
  context: string;
  tone: string;
  style: VideoStyle;
  voiceId: string;
}

export interface VideoJobResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  script: string;
}

export type VideoStyle = 'breaking' | 'analysis' | 'educational' | 'hype';

export type VideoStatus = 'queued' | 'scripting' | 'voicing' | 'rendering' | 'stitching' | 'done' | 'failed';

export interface VideoJob {
  id: string;
  userId: string;
  status: VideoStatus;
  progress: number;
  ticker?: string;
  context: string;
  style: VideoStyle;
  videoUrl?: string;
  thumbnailUrl?: string;
  script?: string;
  duration?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const ELEVENLABS_VOICES: Record<string, string> = {
  'adam': 'pNInz6obpgDQGcFmaJgB',       // Male, deep professional
  'rachel': '21m00Tcm4TlvDq8ikWAM',      // Female, calm narrator
  'charlie': 'IKne3meq5aSn9XLyUdCD',     // Male, energetic
  'domi': 'AZnzlk1XvdvUeBnXmlld',       // Female, strong
};
