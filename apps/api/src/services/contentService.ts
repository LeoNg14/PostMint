import { groq, GROQ_MODEL } from '../config/groq';
import { buildPrompt } from './promptBuilder';
import { formatPost } from './postFormatter';
import { getMarketSnapshot } from './marketService';
import { supabaseAdmin } from '../config/supabase';
import { GeneratePostRequest, GeneratePostResponse, Platform } from '../types';
import { AppError } from '../middleware/errorHandler';

const FREE_TIER_LIMIT = 5;

export const generatePosts = async (
  userId: string,
  userTier: string,
  request: GeneratePostRequest
): Promise<GeneratePostResponse> => {

  // 1. Check usage limits for free tier
  if (userTier === 'free') {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('posts_used_this_month')
      .eq('id', userId)
      .single();

    if (profile && profile.posts_used_this_month >= FREE_TIER_LIMIT) {
      throw new AppError(
        `Free tier limit reached (${FREE_TIER_LIMIT} posts/month). Upgrade to Pro for unlimited posts.`,
        403,
        'LIMIT_REACHED'
      );
    }
  }

  // 2. Optionally fetch market data
  let marketData: GeneratePostResponse['marketData'] | undefined;
  if (request.includeMarketData && request.ticker) {
    const snapshot = await getMarketSnapshot(request.ticker);
    if (snapshot) marketData = snapshot;
  }

  // 3. Generate posts for each platform in parallel
  const postPromises = request.platforms.map(async (platform: Platform) => {
    const prompt = buildPrompt({
      context: request.context,
      ticker: request.ticker,
      platform,
      tone: request.tone,
      marketData: marketData
        ? { price: marketData.price, changePercent: marketData.changePercent, volume: marketData.volume }
        : undefined,
    });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,        // some creativity
      max_tokens: 1024,
      top_p: 1,
    });

    const rawContent = completion.choices[0]?.message?.content ?? '';
    return formatPost(rawContent, platform);
  });

  const posts = await Promise.all(postPromises);

  // 4. Save generated posts to DB
  const insertData = posts.map(post => ({
    user_id: userId,
    ticker: request.ticker ?? null,
    context: request.context,
    platform: post.platform,
    tone: request.tone,
    content: post.content,
    character_count: post.characterCount,
    hashtags: post.hashtags,
  }));

  await supabaseAdmin.from('generated_posts').insert(insertData);

  // 5. Increment usage counter
  await supabaseAdmin.rpc('increment_posts_used', { user_id: userId, count: posts.length });

  // 6. Get updated credit count for response
  const { data: updatedProfile } = await supabaseAdmin
    .from('profiles')
    .select('posts_used_this_month')
    .eq('id', userId)
    .single();

  const postsUsed = updatedProfile?.posts_used_this_month ?? 0;
  const creditsRemaining = userTier === 'free' ? Math.max(0, FREE_TIER_LIMIT - postsUsed) : -1; // -1 = unlimited

  return {
    posts,
    marketData,
    creditsUsed: posts.length,
    creditsRemaining,
  };
};
