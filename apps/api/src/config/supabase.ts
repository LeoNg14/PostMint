import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Service role — full DB access, backend only, never expose to client
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — respects RLS, used for auth token verification
export const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
