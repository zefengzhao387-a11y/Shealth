'use client'

import SplitText from '@/components/SplitText/SplitText'
import BlurText from '@/components/BlurText/BlurText'
import ShinyText from '@/components/ShinyText/ShinyText'

type AppPageHeaderProps = {
  title: string
  subtitle?: string
  kicker?: string
  className?: string
}

/** 内页统一标题 — SplitText + BlurText（React Bits） */
export function AppPageHeader({ title, subtitle, kicker, className = '' }: AppPageHeaderProps) {
  return (
    <div className={`mb-5 md:mb-6 ${className}`}>
      {kicker ? (
        <p className="app-kicker mb-2">
          <ShinyText
            text={kicker}
            speed={2.8}
            color="oklch(0.55 0.06 290)"
            shineColor="oklch(0.72 0.12 350)"
            className="text-[11px] uppercase tracking-[0.28em]"
          />
        </p>
      ) : null}
      <SplitText
        text={title}
        tag="h1"
        className="fluid-title font-medium tracking-tight text-foreground app-title-readable"
        textAlign="left"
        splitType="chars"
        from={{ opacity: 0, y: 22 }}
        to={{ opacity: 1, y: 0 }}
        delay={28}
        duration={0.72}
        threshold={0.85}
        rootMargin="0px"
      />
      {subtitle ? (
        <BlurText
          text={subtitle}
          className="app-subtitle-readable mt-1.5 text-sm text-muted-foreground"
          delay={90}
          animateBy="words"
          direction="top"
        />
      ) : null}
    </div>
  )
}
