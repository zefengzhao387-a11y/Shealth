'use client'

import { motion, AnimatePresence } from 'framer-motion'

export function WorkoutCountdownOverlay({ seconds }: { seconds: number | null }) {
  return (
    <AnimatePresence>
      {seconds !== null && seconds > 0 && (
        <motion.div
          key="workout-countdown"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="rounded-3xl border border-white/60 bg-white/55 px-6 py-4 text-center shadow-lg backdrop-blur-xl sm:px-8 sm:py-5"
            initial={{ scale: 0.92, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <p className="text-sm font-medium text-foreground/75 sm:text-base">陪你暴汗共练中...</p>
            <motion.p
              key={seconds}
              className="mt-1 font-brand text-4xl tabular-nums text-primary sm:text-5xl"
              initial={{ scale: 1.15, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {seconds}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
