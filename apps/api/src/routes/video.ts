import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateRateLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendError } from '../utils/response';
import { videoQueue } from '../config/queue';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const VideoSchema = z.object({
  ticker: z.string().max(10).optional(),
  context: z.string().min(10).max(1000),
  style: z.enum(['breaking', 'analysis', 'educational', 'hype']),
  tone: z.enum(['professional', 'casual', 'hype', 'educational']),
  voiceId: z.enum(['adam', 'rachel', 'charlie', 'domi']).default('adam'),
  includeMarketData: z.boolean().optional().default(false),
});

// POST /video — queue a new video generation job
router.post('/', requireAuth, generateRateLimiter, async (req: AuthRequest, res: Response) => {
  const parsed = VideoSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid request body', 'VALIDATION_ERROR', 422);
    return;
  }

  const jobId = uuidv4();
  const userId = req.user!.id;

  // Create job record in DB
  const { error } = await supabaseAdmin.from('video_jobs').insert({
    id: jobId,
    user_id: userId,
    status: 'queued',
    progress: 0,
    ticker: parsed.data.ticker ?? null,
    context: parsed.data.context,
    style: parsed.data.style,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('video_jobs insert error:', { message: error.message, code: error.code, details: error.details });
    sendError(res, `Failed to create job: ${error.message}`, 'DB_ERROR', 500);
    return;
  }

  // Add to BullMQ queue
  await videoQueue.add('generate-video', {
    userId,
    jobId,
    ticker: parsed.data.ticker,
    context: parsed.data.context,
    tone: parsed.data.tone,
    style: parsed.data.style,
    voiceId: parsed.data.voiceId,
  }, {
    jobId,
    priority: req.user!.tier === 'business' ? 1 : req.user!.tier === 'pro' ? 2 : 3,
  });

  sendSuccess(res, {
    jobId,
    status: 'queued',
    message: 'Video generation started. Check status at GET /video/:jobId',
  }, 202);
});

// GET /video/:jobId — poll job status
router.get('/:jobId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const { data, error } = await supabaseAdmin
    .from('video_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    sendError(res, 'Job not found', 'NOT_FOUND', 404);
    return;
  }

  sendSuccess(res, { job: data });
});

// GET /video — list user's video jobs
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('video_jobs')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    sendError(res, 'Failed to fetch jobs', 'DB_ERROR', 500);
    return;
  }

  sendSuccess(res, { jobs: data });
});

export default router;
