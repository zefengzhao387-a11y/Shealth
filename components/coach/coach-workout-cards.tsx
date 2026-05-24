'use client'

import { motion } from 'framer-motion'
import { TAP_SPRING } from '@/lib/motion-presets'
import { WORKOUT_CARDS, type WorkoutKind, type WorkoutState } from '@/lib/coach-workout'

export function CoachWorkoutCards({
  workoutState,
  onStart,
  disabled,
}: {
  workoutState: WorkoutState
  onStart: (kind: WorkoutKind) => void
  disabled?: boolean
}) {
  const busy = workoutState !== 'idle' || disabled

  return (
    <div className="pointer-events-auto absolute right-0 top-[22%] z-30 flex w-[min(100%,148px)] flex-col gap-2 sm:top-[20%] sm:w-[156px]">
      <p className="mb-0.5 px-1 text-[10px] font-medium tracking-wide text-foreground/45 sm:text-[11px]">
        专属训练
      </p>
      {WORKOUT_CARDS.map((card, i) => (
        <motion.button
          key={card.kind}
          type="button"
          disabled={busy}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.08 }}
          whileTap={busy ? undefined : TAP_SPRING}
          onClick={() => onStart(card.kind)}
          className={`group rounded-2xl border border-white/55 bg-white/42 px-3 py-2.5 text-left shadow-sm backdrop-blur-xl transition-all sm:px-3.5 sm:py-3 ${
            busy
              ? 'cursor-not-allowed opacity-45'
              : 'hover:border-primary/25 hover:bg-white/58 hover:shadow-md active:scale-[0.98]'
          }`}
        >
          <span className="text-lg leading-none sm:text-xl">{card.emoji}</span>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-foreground/88 sm:text-xs">
            {card.title}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">（{card.duration}）</p>
        </motion.button>
      ))}
    </div>
  )
}
