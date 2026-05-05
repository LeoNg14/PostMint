import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  Sequence,
} from 'remotion';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface KeyStat {
  label: string;
  value: string;
  highlight: boolean;
}

interface Props extends Record<string, unknown> {
  script: {
    hook: string;
    body: string;
    callToAction: string;
    fullScript: string;
    title: string;
    keyStats: KeyStat[];
  };
  ticker?: string;
  marketData?: {
    price: number;
    changePercent: number;
  };
  style: 'breaking' | 'analysis' | 'educational' | 'hype';
  duration: number;
  wordTimings?: WordTiming[];
  audioSrc?: string;
}

const STYLE_THEMES = {
  breaking: {
    bg: '#0A0A0F',
    accent: '#FF3333',
    accentDim: 'rgba(255,51,51,0.15)',
    accentGlow: 'rgba(255,51,51,0.5)',
    badge: '🔴 BREAKING',
  },
  analysis: {
    bg: '#080E1A',
    accent: '#3B8BD4',
    accentDim: 'rgba(59,139,212,0.15)',
    accentGlow: 'rgba(59,139,212,0.5)',
    badge: '📊 ANALYSIS',
  },
  educational: {
    bg: '#080F0A',
    accent: '#4ADE80',
    accentDim: 'rgba(74,222,128,0.15)',
    accentGlow: 'rgba(74,222,128,0.5)',
    badge: '📚 LEARN',
  },
  hype: {
    bg: '#120808',
    accent: '#FF8C00',
    accentDim: 'rgba(255,140,0,0.15)',
    accentGlow: 'rgba(255,140,0,0.5)',
    badge: '🚀 HYPE',
  },
};

// Floating background orbs for depth
const BackgroundOrbs: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => {
  const orb1X = 50 + Math.sin(frame / 90) * 15;
  const orb1Y = 30 + Math.cos(frame / 120) * 10;
  const orb2X = 70 + Math.cos(frame / 100) * 20;
  const orb2Y = 70 + Math.sin(frame / 80) * 15;
  return (
    <>
      <div style={{
        position: 'absolute',
        left: `${orb1X}%`, top: `${orb1Y}%`,
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: `${orb2X}%`, top: `${orb2Y}%`,
        width: 400, height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
    </>
  );
};

// Floating particles that drift upward
const Particles: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => {
  const positions = [
    { x: 120, speed: 0.4, size: 4, opacity: 0.25, offset: 0 },
    { x: 280, speed: 0.6, size: 3, opacity: 0.15, offset: 600 },
    { x: 450, speed: 0.35, size: 5, opacity: 0.2, offset: 300 },
    { x: 650, speed: 0.5, size: 3, opacity: 0.18, offset: 900 },
    { x: 820, speed: 0.45, size: 4, opacity: 0.22, offset: 150 },
    { x: 960, speed: 0.55, size: 3, opacity: 0.16, offset: 750 },
  ];

  return (
    <>
      {positions.map((p, i) => {
        const y = 1920 - ((frame * p.speed + p.offset) % 2100);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: accent,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${accent}`,
            }}
          />
        );
      })}
    </>
  );
};

// Grid scan line effect
const ScanLine: React.FC<{ accent: string; frame: number; totalFrames: number }> = ({ accent, frame, totalFrames }) => {
  const y = interpolate(frame, [0, totalFrames], [0, 1920]);
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0,
      top: y,
      height: 2,
      background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
      pointerEvents: 'none',
    }} />
  );
};

export const FinanceVideo: React.FC<Props> = ({
  script, ticker, marketData, style, duration, wordTimings, audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = STYLE_THEMES[style] ?? STYLE_THEMES.analysis;

  // ── TIMING CONSTANTS ──────────────────────────────────────────────
  const BRAND_IN = 0;
  const TITLE_IN = fps * 1.2;
  const STATS_IN = fps * 2.8;
  const HOOK_IN = fps * 6;
  const BODY_IN = fps * 14;
  const CTA_IN = fps * 22;
  const OUTRO_IN = durationInFrames - fps * 2.5;

  // ── SPRING FACTORY ────────────────────────────────────────────────
  const sp = (startFrame: number, stiffness = 100, damping = 12) =>
    spring({ frame: frame - startFrame, fps, config: { stiffness, damping, mass: 1 } });

  // ── GLOBAL ────────────────────────────────────────────────────────
  const progressPct = interpolate(frame, [0, durationInFrames], [0, 100]);

  // ── BRAND HEADER ──────────────────────────────────────────────────
  const brandScale = sp(BRAND_IN, 130, 10);
  const badgeOpacity = interpolate(frame, [BRAND_IN + 8, BRAND_IN + 25], [0, 1], { extrapolateRight: 'clamp' });

  // Top / bottom bar grow
  const barWidth = interpolate(frame, [0, 18], [0, 100], { extrapolateRight: 'clamp' });

  // ── TITLE ─────────────────────────────────────────────────────────
  const titleSp = sp(TITLE_IN, 110, 13);
  const titleOpacity = interpolate(frame, [TITLE_IN, TITLE_IN + 12], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(titleSp, [0, 1], [70, 0]);

  // Underline grows after title settles
  const underlineWidth = interpolate(
    frame,
    [TITLE_IN + 12, TITLE_IN + 45],
    [0, 100],
    { extrapolateRight: 'clamp' }
  );

  // ── STATS ─────────────────────────────────────────────────────────
  const statCount = Math.min(script.keyStats.length, 4);

  // ── HOOK TEXT word-by-word ────────────────────────────────────────
  const hookWords = script.hook.split(' ');
  const wordRevealDuration = fps * 7; // spread over 7 seconds

  const getWordState = (wordIndex: number) => {
    if (wordTimings && wordTimings.length > 0) {
      // Use ElevenLabs timing — hook words start at the beginning of the script
      const hookWordCount = hookWords.length;
      const timing = wordTimings[wordIndex]; // timings index into full script
      if (timing) {
        const wordStartFrame = timing.startTime * fps;
        const isCurrent = frame >= wordStartFrame && frame < wordStartFrame + fps * 0.6;
        const isRevealed = frame >= wordStartFrame;
        return { isRevealed, isCurrent };
      }
    }
    // Fallback: evenly distribute
    const wordStartFrame = HOOK_IN + (wordIndex / hookWords.length) * wordRevealDuration;
    const isCurrent = frame >= wordStartFrame && frame < wordStartFrame + fps * 0.7;
    const isRevealed = frame >= wordStartFrame;
    return { isRevealed, isCurrent };
  };

  const wordOpacity = (wordIndex: number) => {
    const { isRevealed } = getWordState(wordIndex);
    if (!isRevealed) return 0;
    const wordStartFrame = wordTimings?.[wordIndex]
      ? wordTimings[wordIndex].startTime * fps
      : HOOK_IN + (wordIndex / hookWords.length) * wordRevealDuration;
    return interpolate(frame, [wordStartFrame, wordStartFrame + 8], [0, 1], { extrapolateRight: 'clamp' });
  };

  // ── BODY ──────────────────────────────────────────────────────────
  const bodySp = sp(BODY_IN, 90, 14);
  const bodyOpacity = interpolate(frame, [BODY_IN, BODY_IN + fps * 0.6], [0, 1], { extrapolateRight: 'clamp' });
  const bodyY = interpolate(bodySp, [0, 1], [40, 0]);

  // Hook fades out to make room for body
  const hookFadeOut = interpolate(frame, [BODY_IN - 8, BODY_IN + 10], [1, 0.2], { extrapolateRight: 'clamp' });

  // ── CTA ───────────────────────────────────────────────────────────
  const ctaSp = sp(CTA_IN, 130, 9); // bouncy
  const ctaOpacity = interpolate(frame, [CTA_IN, CTA_IN + fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = interpolate(ctaSp, [0, 1], [0.85, 1]);

  // ── OUTRO ─────────────────────────────────────────────────────────
  const outroOpacity = interpolate(frame, [OUTRO_IN, OUTRO_IN + fps * 0.8], [0, 1], { extrapolateRight: 'clamp' });
  const mainFadeOut = interpolate(frame, [OUTRO_IN, OUTRO_IN + fps * 0.5], [1, 0], { extrapolateRight: 'clamp' });

  // ── MARKET DATA ───────────────────────────────────────────────────
  const priceChange = marketData?.changePercent ?? 0;
  const isPositive = priceChange >= 0;

  // Pulsing glow for highlighted stats (2s period)
  const glowPulse = 0.6 + Math.sin(frame / (fps * 1.0)) * 0.4;

  return (
    <AbsoluteFill style={{
      backgroundColor: theme.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── AUDIO ── */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* ── ANIMATED BACKGROUND ── */}
      <BackgroundOrbs accent={theme.accent} frame={frame} />
      <Particles accent={theme.accent} frame={frame} />

      {/* Background grid */}
      <svg
        style={{ position: 'absolute', inset: 0, opacity: 0.04 }}
        width="1080" height="1920"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 54} y1="0" x2={i * 54} y2="1920" stroke={theme.accent} strokeWidth="1" />
        ))}
        {Array.from({ length: 36 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 54} x2="1080" y2={i * 54} stroke={theme.accent} strokeWidth="1" />
        ))}
      </svg>

      {/* Slow scan line */}
      <ScanLine accent={theme.accent} frame={frame} totalFrames={durationInFrames} />

      {/* ── ACCENT BARS ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, height: 8,
        width: `${barWidth}%`,
        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}80)`,
        boxShadow: `0 0 24px ${theme.accentGlow}`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0, height: 8,
        width: `${barWidth}%`,
        background: `linear-gradient(270deg, ${theme.accent}, ${theme.accent}80)`,
        boxShadow: `0 0 24px ${theme.accentGlow}`,
      }} />

      {/* Progress bar (white, 4px, sits above bottom accent bar) */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, height: 4,
        width: `${progressPct}%`,
        backgroundColor: 'rgba(255,255,255,0.35)',
      }} />

      {/* ── EVERYTHING EXCEPT OUTRO ── */}
      <div style={{ opacity: mainFadeOut }}>

        {/* ── BRAND HEADER ── */}
        <div style={{
          position: 'absolute', top: 60, left: 60, right: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 38, fontWeight: 900, color: theme.accent,
            letterSpacing: 3, textTransform: 'uppercase',
            transform: `scale(${brandScale})`,
            transformOrigin: 'left center',
            textShadow: `0 0 30px ${theme.accentGlow}`,
          }}>
            PostMint
          </div>
          <div style={{
            opacity: badgeOpacity,
            backgroundColor: theme.accentDim,
            border: `2px solid ${theme.accent}`,
            borderRadius: 40, padding: '10px 24px',
            fontSize: 22, fontWeight: 700, color: theme.accent,
            letterSpacing: 1.5,
            boxShadow: `0 0 16px ${theme.accentDim}`,
          }}>
            {theme.badge}
          </div>
        </div>

        {/* ── TITLE ── */}
        <div style={{
          position: 'absolute', top: 185, left: 60, right: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
          <div style={{
            fontSize: 62, fontWeight: 900, color: '#FFFFFF',
            lineHeight: 1.12, letterSpacing: -1.5,
            textShadow: '0 4px 32px rgba(0,0,0,0.6)',
          }}>
            {script.title}
          </div>
          {/* Animated underline */}
          <div style={{
            height: 4, borderRadius: 2, marginTop: 18,
            width: `${underlineWidth}%`,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}50)`,
            boxShadow: `0 0 12px ${theme.accentGlow}`,
          }} />
        </div>

        {/* ── KEY STATS (staggered slide-in from right) ── */}
        <div style={{
          position: 'absolute', top: 435, left: 60, right: 60,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {script.keyStats.slice(0, statCount).map((stat, i) => {
            const statStart = STATS_IN + i * fps * 0.45;
            const statSp = spring({ frame: frame - statStart, fps, config: { stiffness: 120, damping: 11 } });
            const statOpacity = interpolate(frame, [statStart, statStart + 14], [0, 1], { extrapolateRight: 'clamp' });
            const statX = interpolate(statSp, [0, 1], [90, 0]);
            const glowSize = stat.highlight ? 16 + glowPulse * 16 : 0;

            return (
              <div key={i} style={{
                background: stat.highlight
                  ? `linear-gradient(135deg, ${theme.accentDim}, rgba(255,255,255,0.04))`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${stat.highlight ? theme.accent : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 20, padding: '20px 30px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: statOpacity,
                transform: `translateX(${statX}px)`,
                boxShadow: stat.highlight ? `0 0 ${glowSize}px ${theme.accentDim}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  fontSize: 26, color: 'rgba(255,255,255,0.6)',
                  fontWeight: 500, letterSpacing: 0.3,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: stat.highlight ? 46 : 36,
                  fontWeight: 800,
                  color: stat.highlight ? theme.accent : '#FFFFFF',
                  textShadow: stat.highlight ? `0 0 24px ${theme.accentGlow}` : 'none',
                  letterSpacing: -0.5,
                }}>
                  {stat.value}
                </div>
              </div>
            );
          })}

          {/* Live market price card */}
          {marketData && ticker && (() => {
            const priceStart = STATS_IN + statCount * fps * 0.45;
            const priceSp = spring({ frame: frame - priceStart, fps, config: { stiffness: 120, damping: 11 } });
            const priceOpacity = interpolate(frame, [priceStart, priceStart + 14], [0, 1], { extrapolateRight: 'clamp' });
            const priceX = interpolate(priceSp, [0, 1], [90, 0]);

            return (
              <div style={{
                opacity: priceOpacity,
                transform: `translateX(${priceX}px)`,
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '20px 30px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    backgroundColor: theme.accent, color: theme.bg,
                    borderRadius: 10, padding: '6px 14px',
                    fontSize: 24, fontWeight: 900, letterSpacing: 1,
                  }}>
                    ${ticker}
                  </span>
                  <span style={{
                    fontSize: 20, color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600, letterSpacing: 1,
                  }}>LIVE</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#FFFFFF' }}>
                    ${marketData.price.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 700,
                    color: isPositive ? '#4ADE80' : '#F87171',
                  }}>
                    {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── HOOK TEXT (word by word) ── */}
        <Sequence from={HOOK_IN - 5} layout="none">
          <div style={{
            position: 'absolute', bottom: 290, left: 60, right: 60,
            opacity: hookFadeOut,
          }}>
            <div style={{
              fontSize: 40, lineHeight: 1.6,
              display: 'flex', flexWrap: 'wrap', gap: '0 10px',
            }}>
              {hookWords.map((word, i) => {
                const { isCurrent } = getWordState(i);
                const opacity = wordOpacity(i);
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      opacity,
                      color: isCurrent ? theme.accent : '#FFFFFF',
                      fontWeight: isCurrent ? 800 : 500,
                      textShadow: isCurrent
                        ? `0 0 24px ${theme.accentGlow}`
                        : '0 2px 12px rgba(0,0,0,0.7)',
                      transform: `translateY(${interpolate(opacity, [0, 1], [14, 0])}px)`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </Sequence>

        {/* ── BODY TEXT ── */}
        <Sequence from={BODY_IN - 5} layout="none">
          <div style={{
            position: 'absolute', bottom: 220, left: 60, right: 60,
            opacity: bodyOpacity,
            transform: `translateY(${bodyY}px)`,
          }}>
            <div style={{
              fontSize: 33, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7,
              fontWeight: 400,
              textShadow: '0 2px 16px rgba(0,0,0,0.7)',
            }}>
              {script.body}
            </div>
          </div>
        </Sequence>

        {/* ── CALL TO ACTION ── */}
        <Sequence from={CTA_IN - 5} layout="none">
          <div style={{
            position: 'absolute', bottom: 130, left: 60, right: 60,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            transformOrigin: 'left bottom',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 18,
            }}>
              <div style={{
                width: 5, borderRadius: 3, alignSelf: 'stretch',
                backgroundColor: theme.accent,
                boxShadow: `0 0 12px ${theme.accentGlow}`,
                minHeight: 36,
              }} />
              <div style={{
                fontSize: 32, fontWeight: 700, color: theme.accent,
                textShadow: `0 0 20px ${theme.accentDim}`,
                lineHeight: 1.4,
              }}>
                {script.callToAction}
              </div>
            </div>
          </div>
        </Sequence>

        {/* ── FOOTER ── */}
        <div style={{
          position: 'absolute', bottom: 24, left: 60, right: 60,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent, letterSpacing: 1 }}>
            PostMint
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
            @postmint.app
          </div>
        </div>
      </div>

      {/* ── OUTRO OVERLAY ── */}
      {frame >= OUTRO_IN - 5 && (
        <AbsoluteFill style={{
          backgroundColor: theme.bg,
          opacity: outroOpacity,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24,
        }}>
          <div style={{
            fontSize: 72, fontWeight: 900, color: theme.accent,
            letterSpacing: 6, textTransform: 'uppercase',
            textShadow: `0 0 60px ${theme.accentGlow}`,
          }}>
            PostMint
          </div>
          <div style={{
            width: 120, height: 4, borderRadius: 2,
            backgroundColor: theme.accent,
            boxShadow: `0 0 20px ${theme.accentGlow}`,
          }} />
          <div style={{
            fontSize: 28, color: 'rgba(255,255,255,0.45)',
            letterSpacing: 3,
          }}>
            @postmint.app
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
