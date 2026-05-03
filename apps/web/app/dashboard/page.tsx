"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { Platform, Tone, GeneratedPost } from '@/lib/types';

const PLATFORMS: { id: Platform; label: string; color: string; limit: number }[] = [
  { id: 'twitter', label: 'Twitter / X', color: '#1DA1F2', limit: 280 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', limit: 3000 },
  { id: 'tiktok', label: 'TikTok', color: '#FF004F', limit: 2200 },
  { id: 'newsletter', label: 'Newsletter', color: '#F59E0B', limit: 99999 },
];

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'professional', label: 'Professional', desc: 'Analyst voice' },
  { id: 'casual', label: 'Casual', desc: 'Like a friend' },
  { id: 'hype', label: 'Hype', desc: 'Bullish energy' },
  { id: 'educational', label: 'Educational', desc: 'Break it down' },
];

export default function DashboardPage() {
  const [context, setContext] = useState('');
  const [ticker, setTicker] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['twitter']);
  const [tone, setTone] = useState<Tone>('professional');
  const [includeMarketData, setIncludeMarketData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedPost[]>([]);
  const [credits, setCredits] = useState<{ used: number; remaining: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    if (!context.trim() || platforms.length === 0) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const { data } = await api.post('/generate', {
        context, ticker: ticker || undefined,
        platforms, tone, includeMarketData,
      });
      setResults(data.data.posts);
      setCredits({ used: data.data.creditsUsed, remaining: data.data.creditsRemaining });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyPost = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getPlatform = (id: Platform) => PLATFORMS.find(p => p.id === id)!;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '32px', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Generate Content
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Turn your financial insight into platform-ready posts
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* Left — Input */}
        <div className="fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Context input */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
              YOUR INSIGHT
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Apple just reported a massive earnings beat, revenue up 12% YoY..."
              rows={5}
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '14px',
                padding: '12px', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', lineHeight: '1.6', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
              <input
                value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="TICKER (optional)"
                maxLength={10}
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '12px',
                  padding: '6px 10px', outline: 'none', width: '140px',
                  fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeMarketData} onChange={(e) => setIncludeMarketData(e.target.checked)} />
                Include market data
              </label>
            </div>
          </div>

          {/* Platforms */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
              PLATFORMS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: platforms.includes(p.id) ? `1px solid ${p.color}` : '1px solid var(--border)',
                  background: platforms.includes(p.id) ? `${p.color}15` : 'var(--bg)',
                  color: platforms.includes(p.id) ? p.color : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
              TONE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TONES.map((t) => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: tone === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: tone === t.id ? 'var(--accent-dim)' : 'var(--bg)',
                  color: tone === t.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
                }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !context.trim() || platforms.length === 0}
            style={{
              padding: '14px', background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius)', color: loading ? 'var(--text-muted)' : '#0A0A0F',
              fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', animation: loading ? 'none' : undefined,
            }}
          >
            {loading ? 'Generating...' : `Generate ${platforms.length} post${platforms.length !== 1 ? 's' : ''} ✦`}
          </button>

          {error && (
            <div style={{
              padding: '12px', background: 'rgba(255,60,60,0.08)',
              border: '1px solid rgba(255,60,60,0.2)', borderRadius: 'var(--radius-sm)',
              color: '#ff6b6b', fontSize: '13px',
            }}>{error}</div>
          )}
        </div>

        {/* Right — Results */}
        <div className="fade-up-2">
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {platforms.map((p) => (
                <div key={p} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                  <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '85%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {credits && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {credits.remaining === -1 ? 'Unlimited' : `${credits.remaining} posts remaining`}
                </div>
              )}
              {results.map((post) => {
                const p = getPlatform(post.platform);
                return (
                  <div key={post.platform} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '1.25rem',
                    borderTop: `3px solid ${p.color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: p.color }}>{p.label.toUpperCase()}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {post.characterCount}{p.limit < 99999 ? `/${p.limit}` : ''}
                        </span>
                        <button onClick={() => copyPost(post.content, post.platform)} style={{
                          padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                          borderRadius: '6px', color: copied === post.platform ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                          {copied === post.platform ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                      {post.content}
                    </p>
                    {post.hashtags.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {post.hashtags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '11px', padding: '3px 8px',
                            background: `${p.color}15`, color: p.color,
                            borderRadius: '4px', fontFamily: 'DM Mono, monospace',
                          }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div style={{
              height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text-dim)', gap: '8px',
            }}>
              <div style={{ fontSize: '32px' }}>✦</div>
              <div style={{ fontSize: '14px' }}>Your generated posts will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
