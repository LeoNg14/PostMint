import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

const router = Router();

router.post('/portal', requireAuth, async (_req: AuthRequest, res: Response) => {
  // TODO: Stripe billing session next
  sendSuccess(res, { message: 'Billing service coming next' });
});

export default router;
