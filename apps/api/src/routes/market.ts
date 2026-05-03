import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/:ticker', requireAuth, async (req: Request, res: Response) => {
  const { ticker } = req.params;
  // TODO: MarketService + Redis cache next session
  sendSuccess(res, { ticker: (ticker as string).toUpperCase(), message: 'Market service coming next' });
});

export default router;
