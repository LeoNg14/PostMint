import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await supabaseAdmin.from('profiles').select('id').limit(1);
    checks.supabase = 'ok';
  } catch {
    checks.supabase = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
