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
