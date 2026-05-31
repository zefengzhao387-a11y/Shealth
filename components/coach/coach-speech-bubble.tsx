'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useEffect, useMemo, useRef, useState } from 'react'

gsap.registerPlugin(useGSAP)

type CoachSpeechBubbleProps = {
  text: string | null
  thinking?: boolean
  /** 0~1，随语音进度逐字显示；1 或未传则完整显示 */
  progress?: number
  messageKey?: number
  /** 显示后自动消失（毫秒），默认 10s；从每条新内容完整显示后开始计时 */
  autoDismissMs?: number
  onAutoDismiss?: () => void
  className?: string
}

function buildSubtitle(text: string, progress: number) {
  if (progress >= 0.999) return text
  const target = Math.max(1, Math.ceil(text.length * Math.min(Math.max(progress, 0), 1)))
  return text.slice(0, target)
}

/** 数字人对话云 — GSAP 入场 / 云朵散开退场 */
export function CoachSpeechBubble({
  text,
  thinking,
  progress = 1,
  messageKey = 0,
  autoDismissMs = 10000,
  onAutoDismiss,
  className = '',
}: CoachSpeechBubbleProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<SVGSVGElement>(null)
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([])
  const cursorRef = useRef<HTMLSpanElement>(null)
  const exitTweenRef = useRef<gsap.core.Tween | null>(null)

  const [isExiting, setIsExiting] = useState(false)
  const present = thinking || !!text
  const shouldRender = present || isExiting
  const outputComplete = !thinking && !!text && progress >= 0.999

  useEffect(() => {
    setIsExiting(false)
    exitTweenRef.current?.kill()
    exitTweenRef.current = null
  }, [messageKey])

  useEffect(() => {
    if (!outputComplete || !autoDismissMs || autoDismissMs <= 0 || isExiting) return
    const timer = window.setTimeout(() => setIsExiting(true), autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [messageKey, outputComplete, autoDismissMs, isExiting])

  const displayText = useMemo(() => {
    if (!text || thinking) return text
    return buildSubtitle(text, progress)
  }, [text, thinking, progress])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !present || isExiting) return

      gsap.set(root, { visibility: 'visible' })

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(root, { autoAlpha: 1, scale: 1, x: 0, y: 0, filter: 'none' })
      })
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.fromTo(
          root,
          { autoAlpha: 0, scale: 0.9, x: 8, y: 6, filter: 'blur(6px)' },
          { autoAlpha: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)', duration: 0.58 },
        )
        if (tailRef.current) {
          tl.fromTo(
            tailRef.current,
            { scale: 0.55, autoAlpha: 0, transformOrigin: '100% 50%' },
            { scale: 1, autoAlpha: 1, duration: 0.38 },
            '-=0.35',
          )
        }
        if (cardRef.current) {
          tl.fromTo(cardRef.current, { y: 8 }, { y: 0, duration: 0.45 }, '-=0.42')
        }
      })

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [present, messageKey, thinking, isExiting], revertOnUpdate: true },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !isExiting) return

      exitTweenRef.current?.kill()
      exitTweenRef.current = gsap.to(root, {
        autoAlpha: 0,
        scale: 1.14,
        y: -22,
        x: 8,
        filter: 'blur(18px)',
        duration: 0.72,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsExiting(false)
          onAutoDismiss?.()
        },
      })
    },
    { scope: rootRef, dependencies: [isExiting] },
  )

  useGSAP(
    () => {
      if (!thinking) return
      const dots = dotsRef.current.filter(Boolean) as HTMLSpanElement[]
      if (!dots.length) return

      gsap.set(dots, { y: 0, autoAlpha: 0.45 })
      gsap.to(dots, {
        y: -4,
        autoAlpha: 1,
        duration: 0.38,
        stagger: { each: 0.14, repeat: -1, yoyo: true },
        ease: 'sine.inOut',
      })
    },
    { scope: rootRef, dependencies: [thinking, messageKey], revertOnUpdate: true },
  )

  useGSAP(
    () => {
      const cursor = cursorRef.current
      if (!cursor || thinking || !text || progress >= 0.999) return

      gsap.to(cursor, {
        autoAlpha: 0.25,
        duration: 0.38,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    },
    { scope: rootRef, dependencies: [thinking, text, progress], revertOnUpdate: true },
  )

  if (!shouldRender) return null

  return (
    <div
      ref={rootRef}
      className={`absolute top-[28%] left-0 w-full pl-0.5 ${className}`}
      style={{ visibility: 'hidden' }}
    >
      <div className="relative ml-auto w-full max-w-[148px] sm:max-w-[162px] md:max-w-[176px]">
        <svg
          ref={tailRef}
          className="absolute -left-[13px] top-[8%] h-[22px] w-[16px] overflow-visible drop-shadow-sm"
          viewBox="0 0 16 22"
          aria-hidden
        >
          <polygon
            points="0,2 15,0 15,22"
            className="fill-[rgba(255,252,254,0.94)] stroke-white/70"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
        </svg>

        <div
          ref={cardRef}
          className="relative max-h-[min(42vh,280px)] overflow-y-auto rounded-[1.2rem] rounded-tl-[0.45rem] border border-white/65 bg-[rgba(255,252,254,0.94)] px-3 py-2.5 shadow-[0_10px_28px_rgba(84,52,98,0.1)] backdrop-blur-xl scrollbar-hide"
        >
          {thinking ? (
            <div className="flex items-center gap-1.5 py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    dotsRef.current[i] = el
                  }}
                  className="h-2 w-2 rounded-full bg-primary/60"
                />
              ))}
              <span className="ml-0.5 text-[11px] text-primary-foreground/60">让我想想…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[12px] leading-[1.65] text-primary-foreground sm:text-[13px]">
              {displayText}
              {text && progress < 0.999 && (
                <span
                  ref={cursorRef}
                  className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] bg-primary/70"
                  aria-hidden
                />
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
