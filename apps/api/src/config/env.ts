import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000')),
  API_VERSION: optional('API_VERSION', 'v1'),

  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),

  GROQ_API_KEY: required('GROQ_API_KEY'),
  ELEVENLABS_API_KEY: required('ELEVENLABS_API_KEY'),

  STRIPE_SECRET_KEY: required('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: required('STRIPE_WEBHOOK_SECRET'),

  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),
  POLYGON_API_KEY: required('POLYGON_API_KEY'),

  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000')),
  RATE_LIMIT_MAX: parseInt(optional('RATE_LIMIT_MAX', '100')),

  RENDERER_URL: optional('RENDERER_URL', 'http://localhost:3001'),
} as const;
