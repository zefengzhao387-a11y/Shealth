'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { TAP_SPRING } from '@/lib/motion-presets'
import BlurText from '@/components/BlurText/BlurText'

gsap.registerPlugin(useGSAP)

type HomeEmptyPromptProps = {
  greeting: string
  subtitle: string
  questions: string[]
  onSelect: (question: string) => void
}

/** 首页空状态 — 问候卡 + 快捷问题 GSAP stagger 入场 */
export function HomeEmptyPrompt({ greeting, subtitle, questions, onSelect }: HomeEmptyPromptProps) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const hero = sectionRef.current?.querySelector<HTMLElement>('[data-hero-card]')
      const chips = gsap.utils.toArray<HTMLElement>('[data-quick-q]', sectionRef.current)
      if (!hero && !chips.length) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: reduce)', () => {
        if (hero) gsap.set(hero, { autoAlpha: 1, y: 0 })
        gsap.set(chips, { autoAlpha: 1, y: 0, scale: 1 })
      })
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        if (hero) {
          tl.fromTo(hero, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.58 })
        }
        if (chips.length) {
          tl.fromTo(
            chips,
            { autoAlpha: 0, y: 12, scale: 0.9 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.46,
              stagger: 0.07,
              ease: 'back.out(1.35)',
            },
            hero ? '-=0.22' : 0,
          )
        }
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <div
      ref={sectionRef}
      className="flex flex-1 flex-col justify-start gap-4 overflow-y-auto py-2 md:py-4"
    >
      <div
        data-hero-card
        className="app-hero-card px-5 py-4 md:px-6 md:py-5"
        style={{ visibility: 'hidden' }}
      >
        <BlurText
          text={greeting}
          className="text-base leading-relaxed text-foreground/95 md:text-lg app-title-readable"
          delay={60}
          animateBy="words"
        />
        <BlurText
          text={subtitle}
          className="app-subtitle-readable mt-2 text-sm text-muted-foreground"
          delay={80}
          animateBy="words"
        />
      </div>

      <div className="flex flex-wrap gap-2 md:gap-2.5">
        {questions.map((q) => (
          <motion.button
            key={q}
            type="button"
            data-quick-q
            className="app-chip px-4 py-2.5 text-sm text-foreground/75 transition-colors hover:text-foreground active:scale-95"
            style={{ visibility: 'hidden' }}
            whileTap={TAP_SPRING}
            onClick={() => onSelect(q)}
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

type QuickQuestionRowProps = {
  questions: string[]
  onSelect: (question: string) => void
}

/** 对话中底部快捷问题条 — 横向 stagger */
export function QuickQuestionRow({ questions, onSelect }: QuickQuestionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const chips = gsap.utils.toArray<HTMLElement>('[data-quick-q]', rowRef.current)
      if (!chips.length) return

      gsap.fromTo(
        chips,
        { autoAlpha: 0, x: 12 },
        { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
      )
    },
    { scope: rowRef },
  )

  return (
    <div ref={rowRef} className="mt-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
      {questions.map((q) => (
        <motion.button
          key={q}
          type="button"
          data-quick-q
          className="app-chip flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          whileTap={TAP_SPRING}
          onClick={() => onSelect(q)}
        >
          {q}
        </motion.button>
      ))}
    </div>
  )
}
