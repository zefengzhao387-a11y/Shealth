"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

// 花瓣组件
export function Petal({ delay = 0, x = 0, size = "md" }: { delay?: number; x?: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-3 h-4",
    md: "w-4 h-6",
    lg: "w-6 h-8"
  }

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} opacity-40 pointer-events-none`}
      style={{ left: `${x}%` }}
      initial={{ y: -20, opacity: 0, rotate: 0 }}
      animate={{
        y: ["0%", "100vh"],
        opacity: [0, 0.6, 0.6, 0],
        rotate: [0, 360],
        x: [0, Math.random() * 100 - 50],
      }}
      transition={{
        duration: 15 + Math.random() * 10,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <svg viewBox="0 0 24 36" fill="none" className="w-full h-full">
        <ellipse cx="12" cy="18" rx="10" ry="16" fill="url(#petalGradient)" />
        <defs>
          <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#DDA0DD" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

// 光点组件
export function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary/30 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// 涟漪效果
export function Ripple({ isActive }: { isActive: boolean }) {
  if (!isActive) return null
  
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-primary/5 rounded-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 bg-secondary/5 rounded-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1, delay: 0.3, repeat: Infinity }}
      />
    </>
  )
}

// 流光线条效果（用于体态追踪）
export function GlowLine({ points }: { points: { x: number; y: number }[] }) {
  const pathData = points.reduce((acc, point, i) => {
    return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, "")

  return (
    <motion.svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <defs>
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#DDA0DD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#98D8AA" stopOpacity="0.8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={pathData}
        stroke="url(#glowGradient)"
        strokeWidth="3"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </motion.svg>
  )
}

// 送花/点亮动画
export function BloomAnimation({ isActive, onComplete }: { isActive: boolean; onComplete?: () => void }) {
  if (!isActive) return null

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onAnimationComplete={onComplete}
    >
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="url(#bloomGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0] }}
          transition={{ duration: 0.6 }}
        />
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <motion.ellipse
            key={angle}
            cx="24"
            cy="8"
            rx="6"
            ry="10"
            fill="url(#petalBloomGradient)"
            style={{ transformOrigin: "24px 24px" }}
            initial={{ rotate: angle, scale: 0 }}
            animate={{ rotate: angle, scale: [0, 1, 0.8] }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          />
        ))}
        <defs>
          <radialGradient id="bloomGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="petalBloomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB6C1" />
            <stop offset="100%" stopColor="#DDA0DD" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

// 浮动光球（大型模糊光晕）
export function FloatingOrb({ x, y, size, color, delay = 0 }: {
  x: number; y: number; size: number; color: string; delay?: number
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: color,
        filter: `blur(${Math.round(size * 0.45)}px)`,
      }}
      animate={{
        opacity: [0.04, 0.09, 0.05, 0.04],
        x: [0, 40, -25, 0],
        y: [0, -30, 15, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{
        duration: 22 + delay * 2.5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// 微风粒子（从左飘到右）
export function WindParticle({ y, delay, speed }: { y: number; delay: number; speed: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ top: `${y}%`, width: 3, height: 3, backgroundColor: 'rgba(255,182,193,0.55)' }}
      initial={{ x: '-5vw', opacity: 0 }}
      animate={{
        x: '105vw',
        opacity: [0, 0.55, 0.55, 0],
        y: [0, -12, 8, -5],
      }}
      transition={{
        duration: speed,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

// 页面背景动态特效组合
export function BackgroundEffects({ density = 'normal' }: { density?: 'light' | 'normal' | 'rich' }) {
  const petalCount = density === 'light' ? 5 : density === 'rich' ? 12 : 8
  const windCount  = density === 'light' ? 5 : density === 'rich' ? 16 : 10

  const petals = useMemo(() => Array.from({ length: petalCount }, (_, i) => ({
    x: (i * 13 + 7) % 97,
    delay: i * 2.3,
    size: (['sm', 'md', 'md', 'lg'] as const)[i % 4],
  })), [petalCount])

  const orbs = useMemo(() => [
    { x: 8,  y: 15, size: 320, color: 'radial-gradient(circle, #FFB6C1 0%, transparent 68%)', delay: 0  },
    { x: 68, y: 55, size: 260, color: 'radial-gradient(circle, #DDA0DD 0%, transparent 68%)', delay: 8  },
    { x: 38, y: 78, size: 210, color: 'radial-gradient(circle, #98D8AA 0%, transparent 68%)', delay: 15 },
    { x: 82, y: 10, size: 180, color: 'radial-gradient(circle, #FFB6C1 0%, transparent 68%)', delay: 4  },
  ].slice(0, density === 'light' ? 2 : density === 'rich' ? 4 : 3), [density])

  const wind = useMemo(() => Array.from({ length: windCount }, (_, i) => ({
    y: (i * 8 + 3) % 88,
    delay: i * 1.1,
    speed: 9 + (i % 6) * 1.5,
  })), [windCount])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((orb, i) => <FloatingOrb key={`orb-${i}`} {...orb} />)}
      {petals.map((p, i) => <Petal key={`petal-${i}`} {...p} />)}
      {wind.map((w, i) => <WindParticle key={`wind-${i}`} {...w} />)}
    </div>
  )
}

// 浮动气泡
export function FloatingBubble({
  children, 
  delay = 0,
  className = ""
}: { 
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={`glass rounded-2xl p-4 ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {children}
    </motion.div>
  )
}
