'use client'

import dynamic from 'next/dynamic'
import { LandingDitherBackground } from '@/components/landing/landing-dither-bg'
import { LandingHero } from '@/components/landing/landing-sections'

const HomeLanyard = dynamic(
  () => import('@/components/Lanyard/HomeLanyard'),
  { ssr: false },
)

export default function LandingPage() {
  return (
    <div className="landing-page relative h-[100svh]">
      <LandingDitherBackground />
      <main className="relative z-10 h-full pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <LandingHero />
      </main>

      <HomeLanyard placement="landing" />
    </div>
  )
}
