import { Request, Response, NextFunction } from 'express';
import { supabaseClient, supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; tier: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    req.user = { id: user.id, email: user.email ?? '', tier: profile?.tier ?? 'free' };
    next();
  } catch {
    res.status(500).json({ error: 'Auth service error', code: 'AUTH_ERROR' });
  }
};

export const requireTier = (minTier: 'pro' | 'business') => {
  const tierRank: Record<string, number> = { free: 0, pro: 1, business: 2 };
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userTier = req.user?.tier ?? 'free';
    if (tierRank[userTier] < tierRank[minTier]) {
      res.status(403).json({ error: `This feature requires a ${minTier} plan`, code: 'UPGRADE_REQUIRED' });
      return;
    }
    next();
  };
};
