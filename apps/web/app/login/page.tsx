"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,252,138,0.06) 0%, transparent 60%), var(--bg)',
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), #4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>🌿</div>
            <span className="font-display" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>PostMint</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Turn financial insights into viral content
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '2rem',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            padding: '4px', marginBottom: '1.5rem',
          }}>
            {(['login', 'signup'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                background: mode === m ? 'var(--bg-elevated)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-muted)',
              }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                EMAIL
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                PASSWORD
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'rgba(255,60,60,0.1)',
                border: '1px solid rgba(255,60,60,0.2)', borderRadius: 'var(--radius-sm)',
                color: '#ff6b6b', fontSize: '13px',
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '11px', background: 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius-sm)', color: '#0A0A0F', fontSize: '14px',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              marginTop: '0.5rem',
            }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
