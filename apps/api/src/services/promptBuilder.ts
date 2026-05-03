import { Platform, Tone } from '../types';

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  twitter: `Write a tweet (max 280 characters). Be punchy and direct. Use 1-3 relevant hashtags at the end. 
No thread format — single tweet only. Hook in the first 5 words.`,

  linkedin: `Write a LinkedIn post (max 3000 characters). Professional but human tone. 
Start with a strong hook line, then expand. Use line breaks for readability. 
End with a question or call to action. 3-5 relevant hashtags at the end.`,

  tiktok: `Write a TikTok video caption/script hook (max 300 characters for caption). 
Energetic, trend-aware language. Include a hook that makes people want to watch. 
3-5 trending hashtags. Optionally include a 3-sentence spoken hook for the video.`,

  newsletter: `Write a newsletter section (no hard limit). Informative and engaging. 
Use clear subheadings if needed. Include context, analysis, and a key takeaway. 
Professional but approachable. No hashtags.`,
};

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  professional: 'Tone: authoritative, data-driven, formal but accessible. Like a seasoned analyst.',
  casual: 'Tone: conversational, friendly, like texting a friend who happens to know finance.',
  hype: 'Tone: energetic, bullish, exciting. Like a finance creator who gets the crowd pumped.',
  educational: 'Tone: clear, patient, explain concepts simply. Like a teacher breaking down complex ideas.',
};

export interface PromptInput {
  context: string;
  ticker?: string;
  platform: Platform;
  tone: Tone;
  marketData?: {
    price: number;
    changePercent: number;
    volume: number;
  };
}

export const buildPrompt = (input: PromptInput): string => {
  const { context, ticker, platform, tone, marketData } = input;

  const marketContext = marketData && ticker
    ? `
Current market data for ${ticker.toUpperCase()}:
- Price: $${marketData.price.toFixed(2)}
- Change: ${marketData.changePercent >= 0 ? '+' : ''}${marketData.changePercent.toFixed(2)}%
- Volume: ${marketData.volume.toLocaleString()}
`
    : ticker ? `Ticker mentioned: ${ticker.toUpperCase()}` : '';

  return `You are PostMint, an AI that turns financial insights into viral social media content.

PLATFORM: ${platform.toUpperCase()}
${PLATFORM_INSTRUCTIONS[platform]}

${TONE_INSTRUCTIONS[tone]}

${marketContext}

USER INPUT:
${context}

RULES:
- Never make specific buy/sell recommendations or financial advice
- Never fabricate specific numbers not provided
- Stay strictly within platform character limits
- Return ONLY the post content — no preamble, no "Here is your post:", no explanation
- Include hashtags as instructed per platform
- Make it feel native to the platform, not like AI-generated content

Generate the ${platform} post now:`;
};
