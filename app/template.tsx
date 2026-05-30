'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { PAGE_TRANSITION, PAGE_TRANSITION_REDUCED } from '@/lib/motion-presets'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const motionProps = reduced ? PAGE_TRANSITION_REDUCED : PAGE_TRANSITION

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} className="min-h-0" {...motionProps}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
