import { Composition } from 'remotion';
import { FinanceVideo } from './compositions/FinanceVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FinanceVideo"
        component={FinanceVideo}
        durationInFrames={900}  // 30 seconds at 30fps, adjusted at render time
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          script: {
            hook: 'Markets are moving fast today.',
            body: 'Apple just reported a massive earnings beat.',
            callToAction: 'Follow PostMint for daily market updates.',
            fullScript: 'Markets are moving fast today. Apple just reported a massive earnings beat. Follow PostMint for daily market updates.',
            title: 'Apple Earnings Beat',
            keyStats: [
              { label: 'Revenue Growth', value: '+12% YoY', highlight: true },
              { label: 'iPhone Sales', value: 'Record High', highlight: false },
            ],
          },
          style: 'analysis',
          duration: 30,
        }}
      />
    </>
  );
};
