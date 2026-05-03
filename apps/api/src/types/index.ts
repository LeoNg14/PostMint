export type Platform = 'twitter' | 'linkedin' | 'tiktok' | 'newsletter';
export type Tone = 'professional' | 'casual' | 'hype' | 'educational';
export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface User {
  id: string;
  email: string;
  tier: SubscriptionTier;
  postsUsedThisMonth: number;
  createdAt: string;
}

export interface GeneratePostRequest {
  ticker?: string;
  context: string;
  platforms: Platform[];
  tone: Tone;
  includeMarketData?: boolean;
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  characterCount: number;
  hashtags: string[];
}

export interface GeneratePostResponse {
  posts: GeneratedPost[];
  marketData?: MarketSnapshot;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface MarketSnapshot {
  ticker: string;
  price: number;
  changePercent: number;
  volume: number;
  fetchedAt: string;
}
