import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { redis } from './config/redis';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { startVideoWorker } from './workers/videoWorker';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://postmint.app', 'https://www.postmint.app']
    : ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true,
}));

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
app.use(globalRateLimiter);
app.use(`/api/${env.API_VERSION}`, routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const start = async () => {
  try {
    await redis.connect();

    // Start BullMQ video worker
    startVideoWorker();

    app.listen(env.PORT, () => {
      console.log(`🌿 PostMint API running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`   http://localhost:${env.PORT}/api/${env.API_VERSION}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
