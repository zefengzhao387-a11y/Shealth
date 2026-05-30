'use client'

import PillNav from '@/components/PillNav/PillNav'

const LANDING_NAV_ITEMS = [
  { label: '能力', href: '#capabilities' },
  { label: '日常', href: '#daily' },
  { label: '开始', href: '/home' },
] as const

export function LandingTopBar() {
  return (
    <header className="pill-nav-shell pill-nav-shell--landing fixed inset-x-0 top-0 z-50 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:px-10">
      <div className="mx-auto max-w-6xl">
        <PillNav
          logo="/icon.svg"
          logoAlt="灵息"
          logoHref="/"
          items={[...LANDING_NAV_ITEMS]}
          activeHref=""
          ease="power2.easeOut"
          baseColor="#0a0a0f"
          pillColor="#f5e8ee"
          pillTextColor="#1a1018"
          hoveredPillTextColor="#ffffff"
          initialLoadAnimation
          className="landing-pill-nav"
        />
      </div>
    </header>
  )
}
