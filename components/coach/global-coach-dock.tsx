'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DigitalCoachLoading } from '@/components/coach/digital-coach-loading'

const DigitalCoach = dynamic(
  () => import('@/components/3d/digital-coach').then((m) => m.DigitalCoach),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full">
        <DigitalCoachLoading />
      </div>
    ),
  },
)

const STORAGE_KEY = 'coach-dock-offset-y'
const COMPANION_MODEL = '/models/hitem3d.vrm'

function readSavedOffset() {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

export function GlobalCoachDock() {
  const pathname = usePathname()
  const dockRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startY: number; startOffset: number } | null>(null)
  const [offsetY, setOffsetY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setOffsetY(readSavedOffset())
    setMounted(true)
  }, [])

  const clampOffset = useCallback((next: number) => {
    const el = dockRef.current
    if (!el) return next
    const rect = el.getBoundingClientRect()
    const half = rect.height / 2
    const topSafe = 68
    const bottomSafe = window.innerWidth < 768 ? 128 : 88
    const minCenter = topSafe + half
    const maxCenter = window.innerHeight - bottomSafe - half
    const centerY = window.innerHeight / 2 + next
    const clampedCenter = Math.min(Math.max(centerY, minCenter), maxCenter)
    return clampedCenter - window.innerHeight / 2
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, String(Math.round(offsetY)))
  }, [offsetY, mounted])

  useEffect(() => {
    const onResize = () => setOffsetY((y) => clampOffset(y))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampOffset])

  const onHandlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: offsetY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onHandlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const delta = event.clientY - drag.startY
    setOffsetY(clampOffset(drag.startOffset + delta))
  }

  const onHandlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  if (pathname === '/') return null
  if (!mounted) return null

  return (
    <div
      ref={dockRef}
      className="fixed right-0 z-40 flex w-[7rem] h-[13.5rem] sm:w-[9.5rem] sm:h-[17rem] md:w-[11rem] md:h-[20rem] flex-col pointer-events-none"
      style={{
        top: `calc(50% + ${offsetY}px)`,
        transform: 'translateY(-50%)',
      }}
      aria-label="右侧数字人"
    >
      <button
        type="button"
        aria-label="拖动数字人位置"
        className="pointer-events-auto mx-auto mb-1 flex h-5 w-12 cursor-grab items-center justify-center rounded-full border border-white/60 bg-white/70 text-[10px] text-muted-foreground shadow-sm backdrop-blur-md active:cursor-grabbing"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        ⠿
      </button>
      <div className="pointer-events-auto relative min-h-0 flex-1 overflow-hidden rounded-l-2xl">
        <DigitalCoach
          view="portrait"
          modelPath={COMPANION_MODEL}
          showPlatform={false}
          entranceAnim="wave"
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
