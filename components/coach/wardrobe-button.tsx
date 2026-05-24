'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveBottomSheet } from '@/components/shared/responsive-bottom-sheet'
import { TAP_SPRING } from '@/lib/motion-presets'
import {
  COACH_OUTFITS,
  type CoachOutfitId,
  getOutfitPreset,
} from '@/lib/coach-outfit'
import { cn } from '@/lib/utils'

type WardrobeButtonProps = {
  value: CoachOutfitId
  onChange: (id: CoachOutfitId) => void
  className?: string
}

/** 换装入口按钮 + 弹层（移动端 Drawer / 桌面浮动卡片） */
export function WardrobeButton({ value, onChange, className }: WardrobeButtonProps) {
  const [open, setOpen] = useState(false)
  const current = getOutfitPreset(value)

  const handleSelect = (id: CoachOutfitId) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="打开换装"
        className={cn(
          'touch-target flex items-center gap-2 rounded-full glass-strong border border-white/55 px-4 py-2 text-sm text-foreground/85 shadow-sm hover:bg-white/60 transition-colors',
          className,
        )}
        whileTap={TAP_SPRING}
        onClick={() => setOpen(true)}
      >
        <span
          className="h-5 w-5 rounded-full border border-white/60 shrink-0"
          style={{ background: current.preview }}
          aria-hidden
        />
        <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2l3 6 3-2 3 2 3-6" />
          <path d="M4 8h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
        </svg>
        换装
      </motion.button>

      <ResponsiveBottomSheet
        open={open}
        onOpenChange={setOpen}
        title="灵息换装"
        description="挑选训练服配色，实时同步到 3D 模型"
        contentClassName="pb-2"
      >
        <div className="grid grid-cols-2 gap-3">
          {COACH_OUTFITS.map((outfit) => {
            const selected = outfit.id === value
            return (
              <motion.button
                key={outfit.id}
                type="button"
                whileTap={TAP_SPRING}
                onClick={() => handleSelect(outfit.id)}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/10 shadow-[0_8px_24px_rgba(230,137,171,0.2)]'
                    : 'border-white/50 bg-white/35 hover:bg-white/55',
                )}
              >
                <div
                  className="mb-3 h-16 w-full rounded-xl border border-white/40"
                  style={{ background: outfit.preview }}
                />
                <p className="text-sm font-medium text-foreground">{outfit.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{outfit.desc}</p>
                {selected ? (
                  <span className="mt-2 inline-block text-[11px] text-primary font-medium">当前穿着</span>
                ) : null}
              </motion.button>
            )
          })}
        </div>
      </ResponsiveBottomSheet>
    </>
  )
}
