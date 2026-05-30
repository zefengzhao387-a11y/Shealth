'use client'

import Dither from '@/components/Dither/Dither'

const WAVE_COLOR = [0.7490196078431373, 0.5058823529411764, 0.6274509803921569] as const

export function LandingDitherBackground() {
  return (
    <div className="landing-dither-bg" aria-hidden>
      <Dither
        waveColor={[...WAVE_COLOR]}
        disableAnimation={false}
        enableMouseInteraction
        mouseRadius={0.3}
        colorNum={2.5}
        pixelSize={2}
        waveAmplitude={0.3}
        waveFrequency={3}
        waveSpeed={0.05}
      />
      <div className="landing-dither-bg__veil" />
    </div>
  )
}
