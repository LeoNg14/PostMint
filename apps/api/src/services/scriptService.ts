import { groq, GROQ_MODEL } from '../config/groq';
import { VideoStyle } from '../types/video';
import { MarketSnapshot } from '../types';

export interface VideoScript {
  hook: string;
  body: string;
  callToAction: string;
  fullScript: string;
  estimatedDuration: number;
  keyStats: Array<{ label: string; value: string; highlight: boolean }>;
  title: string;
}

const STYLE_INSTRUCTIONS: Record<VideoStyle, string> = {
  breaking: `This is BREAKING NEWS style. Urgent, fast-paced. Hook must create immediate tension.
Start with "BREAKING:" or a dramatic opener. Keep sentences short and punchy.`,

  analysis: `This is MARKET ANALYSIS style. Confident, data-driven. Reference the numbers.
Structure: context → what happened → why it matters → what to watch next.`,

  educational: `This is EDUCATIONAL style. Clear, patient, accessible to beginners.
Explain what the ticker is, what the event means in simple terms, why it matters to everyday investors.`,

  hype: `This is HYPE style. High energy, bullish (or bearish), emotionally charged.
Use power words. Short sentences. Build excitement. Like a finance influencer at their peak.`,
};

export const generateVideoScript = async (
  context: string,
  style: VideoStyle,
  tone: string,
  marketData?: MarketSnapshot,
  ticker?: string,
): Promise<VideoScript> => {

  const marketContext = marketData
    ? `Live market data: ${ticker} at $${marketData.price.toFixed(2)}, ${marketData.changePercent >= 0 ? '+' : ''}${marketData.changePercent.toFixed(2)}% today, volume ${marketData.volume.toLocaleString()}.`
    : ticker ? `Ticker: ${ticker}` : '';

  const prompt = `You are PostMint, an AI that generates scripts for short-form finance videos (30-45 seconds).

${STYLE_INSTRUCTIONS[style]}

Context: ${context}
${marketContext}

Generate a video script. Respond with ONLY valid JSON matching this exact structure:
{
  "hook": "Opening 1-2 sentences (5-8 seconds, grabs attention immediately)",
  "body": "Main content 3-5 sentences (15-25 seconds, the core insight)",
  "callToAction": "Closing 1 sentence (3-5 seconds, what to do or follow for more)",
  "title": "Short punchy video title (max 8 words)",
  "keyStats": [
    { "label": "Stat name", "value": "The number or fact", "highlight": true },
    { "label": "Context stat", "value": "Supporting number", "highlight": false }
  ]
}

Rules:
- keyStats: 2-4 items, highlight=true for the most dramatic number
- Total spoken words should be 75-120 words (30-45 seconds at normal pace)
- Never fabricate specific numbers not in the context
- No markdown, no explanation, only the JSON object`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);

  const fullScript = [parsed.hook, parsed.body, parsed.callToAction].join(' ');
  const wordCount = fullScript.split(' ').length;
  const estimatedDuration = Math.round((wordCount / 150) * 60); // 150 WPM average

  return {
    hook: parsed.hook,
    body: parsed.body,
    callToAction: parsed.callToAction,
    fullScript,
    estimatedDuration,
    keyStats: parsed.keyStats ?? [],
    title: parsed.title ?? 'Market Update',
  };
};
