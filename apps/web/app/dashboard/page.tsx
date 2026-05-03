"use client";
import { useState, useRef } from 'react';
import api from '@/lib/api';
import { Platform, Tone, GeneratedPost, VideoStyle, VideoVoice, VideoJob } from '@/lib/types';

type Mode = 'posts' | 'video';

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

const STYLES: { id: VideoStyle; label: string; desc: string; color: string }[] = [
  { id: 'breaking', label: 'Breaking', desc: 'Urgent & tense', color: '#FF3333' },
  { id: 'analysis', label: 'Analysis', desc: 'Data-driven', color: '#3B8BD4' },
  { id: 'educational', label: 'Educational', desc: 'Beginner-friendly', color: '#7CFC8A' },
  { id: 'hype', label: 'Hype', desc: 'High energy', color: '#FF8C00' },
];

const VOICES: { id: VideoVoice; label: string; desc: string }[] = [
  { id: 'adam', label: 'Adam', desc: 'Deep & authoritative' },
  { id: 'rachel', label: 'Rachel', desc: 'Clear & professional' },
  { id: 'charlie', label: 'Charlie', desc: 'Conversational' },
  { id: 'domi', label: 'Domi', desc: 'Energetic & bold' },
];

const STATUS_STEPS: { status: VideoJob['status']; label: string; progress: number }[] = [
  { status: 'queued',    label: 'Queued',     progress: 0   },
  { status: 'scripting', label: 'Writing script', progress: 25  },
  { status: 'voicing',   label: 'Generating voice', progress: 50 },
  { status: 'rendering', label: 'Rendering video',  progress: 75 },
  { status: 'stitching', label: 'Stitching audio',  progress: 90 },
  { status: 'done',      label: 'Done',       progress: 100 },
];

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode>('posts');

  // Shared inputs
  const [context, setContext] = useState('');
  const [ticker, setTicker] = useState('');
  const [tone, setTone] = useState<Tone>('professional');

  // Posts-specific
  const [platforms, setPlatforms] = useState<Platform[]>(['twitter']);
  const [includeMarketData, setIncludeMarketData] = useState(false);
  const [postResults, setPostResults] = useState<GeneratedPost[]>([]);
  const [credits, setCredits] = useState<{ used: number; remaining: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Video-specific
  const [style, setStyle] = useState<VideoStyle>('analysis');
  const [voice, setVoice] = useState<VideoVoice>('adam');
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const pollJob = (jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/video/${jobId}`);
        const job: VideoJob = data.data.job;
        setVideoJob(job);
        if (job.status === 'done' || job.status === 'failed') {
          stopPolling();
          setLoading(false);
        }
      } catch {
        stopPolling();
        setLoading(false);
      }
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!context.trim()) return;
    setLoading(true);
    setError('');

    if (mode === 'posts') {
      if (platforms.length === 0) { setLoading(false); return; }
      setPostResults([]);
      try {
        const { data } = await api.post('/generate', {
          context, ticker: ticker || undefined, platforms, tone, includeMarketData,
        });
        setPostResults(data.data.posts);
        setCredits({ used: data.data.creditsUsed, remaining: data.data.creditsRemaining });
      } catch (err: any) {
        setError(err.response?.data?.error ?? 'Generation failed');
      } finally {
        setLoading(false);
      }
    } else {
      setVideoJob(null);
      try {
        const { data } = await api.post('/video', {
          context, ticker: ticker || undefined, style, tone, voiceId: voice,
        });
        const jobId: string = data.data.jobId;
        setVideoJob({ id: jobId, status: 'queued', progress: 0, context, style, created_at: new Date().toISOString() });
        pollJob(jobId);
      } catch (err: any) {
        setError(err.response?.data?.error ?? 'Failed to start video job');
        setLoading(false);
      }
    }
  };

  const copyPost = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getPlatform = (id: Platform) => PLATFORMS.find(p => p.id === id)!;

  const currentStep = videoJob ? STATUS_STEPS.findIndex(s => s.status === videoJob.status) : -1;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '32px', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Generate Content
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Turn your financial insight into platform-ready content
        </p>
      </div>

      {/* Mode toggle */}
      <div className="fade-up" style={{
        display: 'inline-flex', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '4px', marginBottom: '2rem', gap: '4px',
      }}>
        {(['posts', 'video'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m ? 'var(--accent)' : 'transparent',
            color: mode === m ? '#0A0A0F' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
            letterSpacing: '0.02em', textTransform: 'capitalize',
          }}>
            {m === 'posts' ? '✦ Posts' : '▶ Video'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* Left — Input */}
        <div className="fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Context + ticker (shared) */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
              YOUR INSIGHT
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={mode === 'video'
                ? 'e.g. Tesla up 8% on India Gigafactory news — what does this mean for investors?'
                : 'e.g. Apple just reported a massive earnings beat, revenue up 12% YoY...'}
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
              {mode === 'posts' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeMarketData} onChange={(e) => setIncludeMarketData(e.target.checked)} />
                  Include market data
                </label>
              )}
            </div>
          </div>

          {/* Posts: platform selector */}
          {mode === 'posts' && (
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
          )}

          {/* Video: style selector */}
          {mode === 'video' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                VIDEO STYLE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => setStyle(s.id)} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: style === s.id ? `1px solid ${s.color}` : '1px solid var(--border)',
                    background: style === s.id ? `${s.color}15` : 'var(--bg)',
                    color: style === s.id ? s.color : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
                  }}>
                    <div>{s.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tone (shared) */}
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

          {/* Video: voice selector */}
          {mode === 'video' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                VOICE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {VOICES.map((v) => (
                  <button key={v.id} onClick={() => setVoice(v.id)} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: voice === v.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: voice === v.id ? 'var(--accent-dim)' : 'var(--bg)',
                    color: voice === v.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
                  }}>
                    <div>{v.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !context.trim() || (mode === 'posts' && platforms.length === 0)}
            style={{
              padding: '14px', background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius)', color: loading ? 'var(--text-muted)' : '#0A0A0F',
              fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? (mode === 'video' ? 'Generating video...' : 'Generating...')
              : mode === 'video'
                ? 'Generate video ▶'
                : `Generate ${platforms.length} post${platforms.length !== 1 ? 's' : ''} ✦`
            }
          </button>

          {error && (
            <div style={{
              padding: '12px', background: 'rgba(255,60,60,0.08)',
              border: '1px solid rgba(255,60,60,0.2)', borderRadius: 'var(--radius-sm)',
              color: '#ff6b6b', fontSize: '13px',
            }}>{error}</div>
          )}
        </div>

        {/* Right — Output */}
        <div className="fade-up-2">

          {/* ── VIDEO OUTPUT ── */}
          {mode === 'video' && (
            <>
              {videoJob && videoJob.status !== 'done' && videoJob.status !== 'failed' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '0.06em' }}>
                    GENERATING VIDEO
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: 'linear-gradient(90deg, var(--accent), #3B8BD4)',
                      width: `${videoJob.progress}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>

                  {/* Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {STATUS_STEPS.filter(s => s.status !== 'done').map((step, i) => {
                      const isActive = step.status === videoJob.status;
                      const isDone = currentStep > i;
                      return (
                        <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDone ? 'var(--accent)' : isActive ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                            border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                            fontSize: '10px', color: isDone ? '#0A0A0F' : 'var(--accent)',
                            transition: 'all 0.3s',
                          }}>
                            {isDone ? '✓' : isActive ? '●' : ''}
                          </div>
                          <span style={{
                            fontSize: '13px',
                            color: isDone ? 'var(--text)' : isActive ? 'var(--accent)' : 'var(--text-dim)',
                            fontWeight: isActive ? 600 : 400,
                            transition: 'color 0.3s',
                          }}>
                            {step.label}
                            {isActive && <span style={{ marginLeft: '6px', opacity: 0.6, fontWeight: 400, fontSize: '11px' }}>in progress...</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {videoJob.script && (
                    <div style={{ marginTop: '1.25rem', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.06em' }}>SCRIPT PREVIEW</div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        {videoJob.script.slice(0, 200)}{videoJob.script.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {videoJob?.status === 'done' && videoJob.video_url && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <video
                      src={videoJob.video_url}
                      controls
                      playsInline
                      style={{ width: '100%', display: 'block', background: '#000', maxHeight: '480px' }}
                    />
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px' }}>Video ready</div>
                        {videoJob.duration && (
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{videoJob.duration}s · 1080×1920</div>
                        )}
                      </div>
                      <a
                        href={videoJob.video_url}
                        download
                        style={{
                          padding: '8px 16px', background: 'var(--accent)', color: '#0A0A0F',
                          borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                          textDecoration: 'none', transition: 'opacity 0.15s',
                        }}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  {videoJob.script && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '8px' }}>SCRIPT</div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>{videoJob.script}</p>
                    </div>
                  )}
                </div>
              )}

              {videoJob?.status === 'failed' && (
                <div style={{
                  padding: '1.25rem', background: 'rgba(255,60,60,0.06)',
                  border: '1px solid rgba(255,60,60,0.2)', borderRadius: 'var(--radius)',
                  color: '#ff6b6b',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Video generation failed</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>{videoJob.error_message ?? 'Unknown error'}</div>
                </div>
              )}

              {!videoJob && (
                <div style={{
                  height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text-dim)', gap: '10px',
                }}>
                  <div style={{ fontSize: '36px' }}>▶</div>
                  <div style={{ fontSize: '14px' }}>Your video will appear here</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Takes ~60 seconds to render</div>
                </div>
              )}
            </>
          )}

          {/* ── POSTS OUTPUT ── */}
          {mode === 'posts' && (
            <>
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

              {postResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {credits && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {credits.remaining === -1 ? 'Unlimited' : `${credits.remaining} posts remaining`}
                    </div>
                  )}
                  {postResults.map((post) => {
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

              {!loading && postResults.length === 0 && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
