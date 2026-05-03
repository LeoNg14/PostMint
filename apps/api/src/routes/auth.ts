import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  sendSuccess(res, { user: req.user });
});

export default router;
