import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface KeyStat {
  label: string;
  value: string;
  highlight: boolean;
}

interface Props {
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
}

const STYLE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  breaking: { bg: '#0A0A0F', accent: '#FF3333', text: '#FFFFFF' },
  analysis: { bg: '#0A0F1A', accent: '#3B8BD4', text: '#FFFFFF' },
  educational: { bg: '#0A1A0F', accent: '#7CFC8A', text: '#FFFFFF' },
  hype: { bg: '#1A0A0F', accent: '#FF8C00', text: '#FFFFFF' },
};

export const FinanceVideo: React.FC<Props> = ({ script, ticker, marketData, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const colors = STYLE_COLORS[style] ?? STYLE_COLORS.analysis;

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: 'clamp' });

  const statsOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  const scriptOpacity = interpolate(
    frame,
    [fps * 2, fps * 2 + 15],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const priceChange = marketData?.changePercent ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: 'sans-serif' }}>
      {/* Background grid pattern */}
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.05 }} width="1080" height="1920">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={i} x1={i * 54} y1="0" x2={i * 54} y2="1920" stroke={colors.accent} strokeWidth="1"/>
        ))}
        {Array.from({ length: 36 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 54} x2="1080" y2={i * 54} stroke={colors.accent} strokeWidth="1"/>
        ))}
      </svg>

      {/* Accent bar top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 8,
        backgroundColor: colors.accent,
      }}/>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 60, left: 60, right: 60,
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 700, color: colors.accent,
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12,
        }}>
          {style === 'breaking' ? '🔴 BREAKING' : style === 'hype' ? '🚀 POSTMINT' : '📊 POSTMINT'}
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: colors.text, lineHeight: 1.2 }}>
          {script.title}
        </div>
      </div>

      {/* Key stats */}
      <div style={{
        position: 'absolute', top: 320, left: 60, right: 60,
        opacity: statsOpacity,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {script.keyStats.map((stat, i) => (
          <div key={i} style={{
            background: stat.highlight ? `${colors.accent}22` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${stat.highlight ? colors.accent : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16, padding: '20px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)' }}>{stat.label}</div>
            <div style={{
              fontSize: stat.highlight ? 48 : 36,
              fontWeight: 800,
              color: stat.highlight ? colors.accent : colors.text,
            }}>{stat.value}</div>
          </div>
        ))}

        {/* Live price if available */}
        {marketData && ticker && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '20px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>${ticker}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: colors.text }}>
                ${marketData.price.toFixed(2)}
              </div>
              <div style={{ fontSize: 24, color: isPositive ? '#7CFC8A' : '#FF4444', fontWeight: 600 }}>
                {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Script text */}
      <div style={{
        position: 'absolute', bottom: 200, left: 60, right: 60,
        opacity: scriptOpacity,
      }}>
        <div style={{
          fontSize: 36, color: colors.text, lineHeight: 1.6,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {script.hook}
        </div>
      </div>

      {/* Branding footer */}
      <div style={{
        position: 'absolute', bottom: 60, left: 60, right: 60,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>PostMint</div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>@postmint.app</div>
      </div>

      {/* Accent bar bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
        backgroundColor: colors.accent,
      }}/>
    </AbsoluteFill>
  );
};
