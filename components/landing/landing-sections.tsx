'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Link from 'next/link'
import { useRef } from 'react'
import TextType from '@/components/TextType/TextType'
import BlurText from '@/components/BlurText/BlurText'
import DecryptedText from '@/components/DecryptedText/DecryptedText'
import ShinyText from '@/components/ShinyText/ShinyText'
import Shuffle from '@/components/Shuffle/Shuffle'
import StarBorder from '@/components/StarBorder/StarBorder'
import { LandingHeroCarousel } from '@/components/landing/landing-hero-carousel'

gsap.registerPlugin(useGSAP)

const HERO_TYPE_LINES = [
  '你的 3D 健康陪伴',
  '运动 · 恢复 · 情绪 · 日常',
  '每天十分钟，也算数',
]

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const scope = sectionRef.current
      if (!scope) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-hero-item]', { autoAlpha: 1, x: 0, y: 0 })
      })
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-hero-item]', {
          autoAlpha: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.05,
        })
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden px-5 py-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:px-10"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
        <div className="max-w-xl">
          <p
            data-hero-item
            className="landing-kicker landing-muted-readable mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] md:text-xs"
          >
            <span className="landing-kicker__dot" aria-hidden />
            <ShinyText
              text="Shealth · 3D Coach"
              speed={3}
              color="oklch(0.84 0.032 var(--h-rose-soft))"
              shineColor="oklch(0.95 0.025 var(--h-rose-bright))"
            />
          </p>

          <h1 className="landing-readable m-0">
            <Shuffle
              text="Spirit Breath"
              tag="span"
              className="landing-hero-shuffle"
              textAlign="left"
              shuffleDirection="right"
              duration={0.35}
              animationMode="evenodd"
              shuffleTimes={2}
              ease="power3.out"
              stagger={0.04}
              threshold={0.1}
              rootMargin="0px"
              triggerOnce
              triggerOnHover
              respectReducedMotion
              loop={false}
              loopDelay={0}
            />
          </h1>

          <TextType
            as="p"
            data-hero-item
            text={HERO_TYPE_LINES}
            typingSpeed={52}
            deletingSpeed={26}
            pauseDuration={2200}
            initialDelay={400}
            loop
            showCursor
            cursorCharacter="|"
            cursorBlinkDuration={0.45}
            className="landing-hero-type landing-readable mt-6 min-h-[2.5rem] text-xl md:mt-8 md:min-h-[3rem] md:text-3xl md:leading-snug"
            textColors={['#fdf2f6', '#f5d4e4', '#efbdd4']}
          />

          <BlurText
            text="她健康 Shealth — 以 3D 数字人灵息为核心，把运动、恢复与情绪支持放进你的日常。"
            className="landing-muted-readable mt-8 max-w-lg text-sm leading-relaxed md:text-[15px]"
            delay={55}
            animateBy="words"
          />

          <div data-hero-item className="mt-10">
            <Link href="/home" className="star-border-link">
              <StarBorder
                as="span"
                className="star-border--landing"
                color="#f0abfc"
                speed="5s"
              >
                <DecryptedText
                  text="开始体验"
                  animateOn="view"
                  speed={35}
                  maxIterations={8}
                  sequential
                  className="text-white"
                  parentClassName="inline-block"
                />
              </StarBorder>
            </Link>
          </div>
        </div>

        <div data-hero-item className="flex justify-center lg:justify-end">
          <LandingHeroCarousel />
        </div>
      </div>
    </section>
  )
}
