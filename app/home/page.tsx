"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/shared/navigation"
import { BottomNav } from "@/components/shared/bottom-nav"
import { Petal, FloatingBubble, BackgroundEffects } from "@/components/shared/effects"
import dynamic from "next/dynamic"

const DigitalCoach3D = dynamic(() =>
  import("@/components/3d/digital-coach").then(mod => mod.DigitalCoach),
  { ssr: false, loading: () => <div className="h-80 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 rounded-3xl animate-pulse" /> }
)

function DigitalCoach() {
  return (
    <motion.div
      className="relative mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <DigitalCoach3D view="portrait" />
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full glass-strong text-xs text-muted-foreground flex items-center gap-1.5 z-10"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        AI 教练在线
      </motion.div>
    </motion.div>
  )
}

function DailyGreeting() {
  const [greeting, setGreeting] = useState("")
  const [tip, setTip] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("早安，今天也要元气满满")
      setTip("晨间唤醒 10 分钟，开启美好的一天")
    } else if (hour < 18) {
      setGreeting("下午好，记得休息一下")
      setTip("办公室拉伸 5 分钟，缓解肩颈疲劳")
    } else {
      setGreeting("晚安，今天辛苦了")
      setTip("睡前冥想 15 分钟，安抚疲惫的心")
    }
  }, [])

  return (
    <motion.div
      className="text-center mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h1 className="text-xl md:text-2xl font-medium text-foreground mb-2">{greeting}</h1>
      <p className="text-sm text-muted-foreground">{tip}</p>
    </motion.div>
  )
}

function TaskBubble({ task, delay, position }: { task: { title: string; duration: string; icon: React.ReactNode }; delay: number; position: string }) {
  return (
    <motion.div
      className={`absolute ${position}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <FloatingBubble className="min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            {task.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{task.title}</p>
            <p className="text-xs text-muted-foreground">{task.duration}</p>
          </div>
        </div>
      </FloatingBubble>
    </motion.div>
  )
}

function FloatingTasks() {
  const tasks = [
    {
      title: "晨间唤醒",
      duration: "10 分钟",
      icon: <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
      position: "top-0 left-4 md:left-12",
    },
    {
      title: "经期舒缓",
      duration: "15 分钟",
      icon: <svg className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
      position: "top-8 right-4 md:right-12",
    },
    {
      title: "冥想助眠",
      duration: "20 分钟",
      icon: <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
      position: "bottom-8 left-8 md:left-20",
    },
  ]

  return (
    <div className="relative h-56">
      {tasks.map((task, i) => (
        <TaskBubble key={task.title} task={task} delay={0.5 + i * 0.2} position={task.position} />
      ))}
    </div>
  )
}

function StartButton() {
  return (
    <motion.button
      className="relative px-8 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      style={{ boxShadow: "0 0 30px rgba(255,182,193,0.4), 0 0 60px rgba(255,182,193,0.2)" }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative z-10 flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        开始今日律动
      </span>
    </motion.button>
  )
}

function StatusCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div
      className="glass rounded-2xl p-4 text-center"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-lg font-medium text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  )
}

function TodayStatus() {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <StatusCard label="连续打卡" value="7 天" icon={<svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" /></svg>} />
      <StatusCard label="本周运动" value="120 分" icon={<svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>} />
      <StatusCard label="轻息币" value="350" icon={<svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M8 10h8M8 14h8" /></svg>} />
    </motion.div>
  )
}

function CourseCard({ title, subtitle, duration, tag, color }: { title: string; subtitle: string; duration: string; tag: string; color: string }) {
  return (
    <motion.div
      className={`rounded-2xl p-4 bg-gradient-to-br ${color} relative overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/30 text-foreground">{tag}</span>
      <h3 className="text-base font-medium text-foreground mt-2">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        {duration}
      </div>
    </motion.div>
  )
}

function AIChat() {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-md md:mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="relative">
        <motion.div className={`absolute -inset-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-accent animate-gradient ${isFocused ? 'opacity-100' : 'opacity-40'}`} />
        <div className="relative flex items-center gap-2 bg-card rounded-full px-4 py-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="和 AI 教练说点什么..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <motion.button
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// 向下滚动提示
function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
    >
      <span className="text-xs tracking-wide">向下探索</span>
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </motion.button>
  )
}

export default function HomePage() {
  const [phase, setPhase] = useState<'hero' | 'content'>('hero')
  const [mounted, setMounted] = useState(false)
  const touchStartY = useRef(0)
  const busy = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  const goToContent = () => {
    if (busy.current) return
    busy.current = true
    setPhase('content')
    setTimeout(() => { busy.current = false }, 800)
  }

  const goToHero = () => {
    if (busy.current) return
    busy.current = true
    setPhase('hero')
    setTimeout(() => { busy.current = false }, 800)
  }

  // 英雄屏上监听向下滚动
  useEffect(() => {
    if (!mounted || phase !== 'hero') return

    const onWheel = (e: WheelEvent) => { if (e.deltaY > 20) goToContent() }
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current - e.touches[0].clientY > 40) goToContent()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [mounted, phase])

  // 内容页滚动到顶端时监听向上滚回英雄屏
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!mounted || phase !== 'content') return
    const el = contentRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop === 0 && e.touches[0].clientY - touchStartY.current > 40) goToHero()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [mounted, phase])

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />

  return (
    <div className="h-screen overflow-hidden relative">
      {/* 固定背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
      <motion.div className="fixed top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl -z-10" animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="fixed bottom-40 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl -z-10" animate={{ x: [0, -20, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      {[...Array(8)].map((_, i) => (
        <Petal key={i} delay={i * 2} x={Math.random() * 100} size={["sm", "md", "lg"][i % 3] as "sm" | "md" | "lg"} />
      ))}

      <Navigation />

      <AnimatePresence mode="wait">
        {phase === 'hero' ? (
          /* ── 英雄屏 ── */
          <motion.div
            key="hero"
            className="absolute inset-0 flex flex-col items-center justify-between pt-20 pb-10 px-4 overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -60,
              rotateX: 8,
              scale: 0.96,
              filter: "blur(4px)",
            }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center top", transformPerspective: 1200 }}
          >
            <div className="relative w-full max-w-lg">
              <DigitalCoach />
              <FloatingTasks />
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-lg">
              <DailyGreeting />
              <StartButton />
              <ScrollHint onClick={goToContent} />
            </div>
          </motion.div>
        ) : (
          /* ── 长内容页 ── */
          <motion.div
            key="content"
            ref={contentRef}
            className="absolute inset-0 overflow-y-auto pt-20 pb-32 px-4"
            initial={{ opacity: 0, y: 80, rotateX: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center bottom", transformPerspective: 1200 }}
          >
            <div className="max-w-lg mx-auto space-y-8">
              {/* 返回英雄屏 */}
              <motion.button
                onClick={goToHero}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                回到首页
              </motion.button>

              {/* 今日状态 */}
              <section>
                <h2 className="text-base font-medium text-foreground mb-4">今日状态</h2>
                <TodayStatus />
              </section>

              {/* 推荐课程 */}
              <section>
                <h2 className="text-base font-medium text-foreground mb-4">为你推荐</h2>
                <div className="grid grid-cols-2 gap-3">
                  <CourseCard title="晨间唤醒流" subtitle="激活身体能量" duration="10 分钟" tag="今日必做" color="from-peach/40 to-primary/20" />
                  <CourseCard title="经期舒缓瑜伽" subtitle="温柔呵护身心" duration="15 分钟" tag="女性专属" color="from-lilac/40 to-secondary/20" />
                  <CourseCard title="办公室拉伸" subtitle="缓解久坐疲劳" duration="8 分钟" tag="随时可做" color="from-primary/20 to-accent/20" />
                  <CourseCard title="睡前冥想" subtitle="安抚疲惫的心" duration="20 分钟" tag="睡眠助手" color="from-secondary/20 to-lilac/40" />
                </div>
              </section>

              {/* 近期记录 */}
              <section>
                <h2 className="text-base font-medium text-foreground mb-4">近期记录</h2>
                <div className="space-y-3">
                  {[
                    { date: "昨天", title: "晨间唤醒", duration: "10 分钟", cal: "45 千卡" },
                    { date: "前天", title: "经期舒缓瑜伽", duration: "15 分钟", cal: "60 千卡" },
                    { date: "3 天前", title: "睡前冥想", duration: "20 分钟", cal: "—" },
                  ].map((r) => (
                    <motion.div
                      key={r.date + r.title}
                      className="glass rounded-2xl p-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 2 }}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.date} · {r.duration}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.cal}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChat />
      <BottomNav />
    </div>
  )
}
