'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CoachSpeechBubbleProps = {
  text: string | null
  thinking?: boolean
  /** 0~1，随语音进度逐字显示；1 或未传则完整显示 */
  progress?: number
  messageKey?: number
  /** 显示后自动消失（毫秒），默认 10s */
  autoDismissMs?: number
  onAutoDismiss?: () => void
  className?: string
}

function buildSubtitle(text: string, progress: number) {
  if (progress >= 0.999) return text
  const target = Math.max(1, Math.ceil(text.length * Math.min(Math.max(progress, 0), 1)))
  return text.slice(0, target)
}

const CLOUD_EXIT = {
  opacity: 0,
  scale: 1.14,
  y: -22,
  x: 8,
  filter: 'blur(18px)',
} as const

/** 数字人对话云 — 右侧专用列，完整字幕随语音打满；超时云朵散开消失 */
export function CoachSpeechBubble({
  text,
  thinking,
  progress = 1,
  messageKey = 0,
  autoDismissMs = 10000,
  onAutoDismiss,
  className = '',
}: CoachSpeechBubbleProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [text, messageKey, thinking])

  useEffect(() => {
    if (thinking || !text || !autoDismissMs || autoDismissMs <= 0) return
    const timer = window.setTimeout(() => {
      setDismissed(true)
    }, autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [text, messageKey, thinking, autoDismissMs])

  const visible = (thinking || !!text) && !dismissed

  const displayText = useMemo(() => {
    if (!text || thinking) return text
    return buildSubtitle(text, progress)
  }, [text, thinking, progress])

  return (
    <AnimatePresence onExitComplete={() => onAutoDismiss?.()}>
      {visible ? (
        <motion.div
          key={thinking ? 'think' : `msg-${messageKey}`}
          className={`absolute top-[28%] left-0 w-full pl-0.5 ${className}`}
          initial={{ opacity: 0, scale: 0.92, x: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
          exit={CLOUD_EXIT}
          transition={{
            type: 'spring',
            damping: 26,
            stiffness: 340,
            exit: {
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
        >
          <div className="relative ml-auto w-full max-w-[148px] sm:max-w-[162px] md:max-w-[176px]">
            <svg
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

            <div className="relative max-h-[min(42vh,280px)] overflow-y-auto rounded-[1.2rem] rounded-tl-[0.45rem] border border-white/65 bg-[rgba(255,252,254,0.94)] px-3 py-2.5 shadow-[0_10px_28px_rgba(84,52,98,0.1)] backdrop-blur-xl scrollbar-hide">
              {thinking ? (
                <div className="flex items-center gap-1.5 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                  <span className="ml-0.5 text-[11px] text-muted-foreground">让我想想…</span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[12px] leading-[1.65] text-foreground/90 sm:text-[13px]">
                  {displayText}
                  {text && progress < 0.999 && (
                    <motion.span
                      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] bg-primary/70"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.75, repeat: Infinity }}
                      aria-hidden
                    />
                  )}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
