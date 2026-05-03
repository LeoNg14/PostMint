import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import generateRouter from './generate';
import marketRouter from './market';
import billingRouter from './billing';
import videoRouter from './video';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/generate', generateRouter);
router.use('/market', marketRouter);
router.use('/billing', billingRouter);
router.use('/video', videoRouter);

export default router;
