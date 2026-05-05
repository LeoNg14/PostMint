import React from 'react';
import { Composition, CalculateMetadataFunction } from 'remotion';
import { FinanceVideo } from './compositions/FinanceVideo';

type VideoProps = React.ComponentProps<typeof FinanceVideo>;

// Sets video duration dynamically from the audio duration prop.
// This ensures the Remotion render matches the actual voiceover length.
const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const fps = 30;
  const audioDuration = typeof props.duration === 'number' ? props.duration : 30;
  // Add 2.5s for the outro, minimum 15s total
  const totalSeconds = Math.max(audioDuration + 2.5, 15);
  return {
    durationInFrames: Math.ceil(totalSeconds * fps),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FinanceVideo"
        component={FinanceVideo}
        calculateMetadata={calculateMetadata}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          script: {
            hook: 'Markets are moving fast today. Here is what you need to know.',
            body: 'Apple just reported a massive earnings beat, smashing analyst expectations across every category.',
            callToAction: 'Follow PostMint for daily market updates.',
            fullScript: 'Markets are moving fast today. Here is what you need to know. Apple just reported a massive earnings beat, smashing analyst expectations across every category. Follow PostMint for daily market updates.',
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
