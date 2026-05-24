'use client'

/** 数字人加载占位 — 透明底，仅显示加载动画 */
export function DigitalCoachLoading({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center bg-transparent pointer-events-none ${className}`}
      aria-live="polite"
      aria-busy="true"
      aria-label="数字人加载中"
    >
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/40" />
        <div className="absolute inset-[18%] animate-pulse rounded-full bg-primary/20" />
      </div>
    </div>
  )
}
