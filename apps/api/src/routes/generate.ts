import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateRateLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendError } from '../utils/response';
import { generatePosts } from '../services/contentService';
import { z } from 'zod';

const router = Router();

const GenerateSchema = z.object({
  ticker: z.string().max(10).optional(),
  context: z.string().min(10).max(1000),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'tiktok', 'newsletter'])).min(1).max(4),
  tone: z.enum(['professional', 'casual', 'hype', 'educational']),
  includeMarketData: z.boolean().optional().default(false),
});

router.post('/', requireAuth, generateRateLimiter, async (req: AuthRequest, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid request body', 'VALIDATION_ERROR', 422);
    return;
  }

  try {
    const result = await generatePosts(
      req.user!.id,
      req.user!.tier,
      parsed.data
    );
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.code === 'LIMIT_REACHED') {
      sendError(res, err.message, err.code, 403);
      return;
    }
    console.error('Generate error:', err);
    sendError(res, 'Failed to generate posts', 'GENERATE_ERROR', 500);
  }
});

// GET /generate/history — user's past generated posts
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await (await import('../config/supabase')).supabaseAdmin
    .from('generated_posts')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    sendError(res, 'Failed to fetch history', 'DB_ERROR', 500);
    return;
  }

  sendSuccess(res, { posts: data });
});

export default router;
