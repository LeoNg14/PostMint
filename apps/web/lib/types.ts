export type Platform = 'twitter' | 'linkedin' | 'tiktok' | 'newsletter';
export type Tone = 'professional' | 'casual' | 'hype' | 'educational';

export interface GeneratedPost {
  platform: Platform;
  content: string;
  characterCount: number;
  hashtags: string[];
}

export interface GenerateResponse {
  posts: GeneratedPost[];
  creditsUsed: number;
  creditsRemaining: number;
}

export interface GenerateRequest {
  ticker?: string;
  context: string;
  platforms: Platform[];
  tone: Tone;
  includeMarketData: boolean;
}

export type VideoStyle = 'breaking' | 'analysis' | 'educational' | 'hype';
export type VideoVoice = 'adam' | 'rachel' | 'charlie' | 'domi';
export type VideoStatus = 'queued' | 'scripting' | 'voicing' | 'rendering' | 'stitching' | 'done' | 'failed';

export interface VideoJob {
  id: string;
  status: VideoStatus;
  progress: number;
  ticker?: string;
  context: string;
  style: VideoStyle;
  script?: string;
  video_url?: string;
  duration?: number;
  error_message?: string;
  created_at: string;
}
