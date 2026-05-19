"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/shared/navigation"
import { BottomNav } from "@/components/shared/bottom-nav"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import dynamic from "next/dynamic"

const DigitalCoach3D = dynamic(
  () => import("@/components/3d/digital-coach").then(mod => mod.DigitalCoach),
  { ssr: false, loading: () => null }
)

// ── 工具 ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return "夜深了，好好休息 🌙"
  if (h < 12) return "早安，今天也要元气满满 ☀️"
  if (h < 18) return "下午好，记得休息一下 🍃"
  return "晚安，今天辛苦了 ✨"
}

function calcStreak(checkins: { checked_in_at: string }[]) {
  if (!checkins.length) return 0
  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = new Set(checkins.map(c => {
    const d = new Date(c.checked_in_at); d.setHours(0, 0, 0, 0); return d.getTime()
  }))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    if (days.has(d.getTime())) streak++
    else if (i > 0) break
  }
  return streak
}

// ── AI 对话栏 ─────────────────────────────────────────────
function AIChat() {
  const [msg, setMsg] = useState("")
  const [focused, setFocused] = useState(false)
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent animate-gradient transition-opacity duration-300 ${focused ? "opacity-100" : "opacity-30"}`}
      />
      <div className="relative flex items-center gap-2 bg-card/95 backdrop-blur-xl rounded-2xl px-4 py-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
          </svg>
        </div>
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="和 AI 教练说点什么..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <motion.button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        >
          <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── 打卡按钮 ──────────────────────────────────────────────
function CheckinButton({ userId, onCheckin }: { userId?: string; onCheckin: () => void }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    supabase.from('checkins')
      .select('id').eq('user_id', userId)
      .gte('checked_in_at', today.toISOString()).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setDone(true) })
  }, [userId])

  const handleCheckin = async () => {
    if (!userId || done || loading) return
    setLoading(true)
    await supabase.from('checkins').insert({ user_id: userId })
    setDone(true); setLoading(false); onCheckin()
  }

  return (
    <motion.button
      onClick={handleCheckin}
      disabled={done || !userId}
      className={`flex-1 py-3.5 rounded-2xl font-medium text-sm relative overflow-hidden transition-all ${
        done
          ? "bg-gradient-to-r from-sage/50 to-accent/30 text-foreground/70"
          : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
      }`}
      whileHover={done ? {} : { scale: 1.02 }}
      whileTap={done ? {} : { scale: 0.97 }}
    >
      {!done && (
        <motion.span className="absolute inset-0 bg-white/20 rounded-2xl"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {done ? (
          <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> 今日已打卡</>
        ) : userId ? (
          <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 今日打卡</>
        ) : "登录后打卡"}
      </span>
    </motion.button>
  )
}

// ── 主页面 ────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [streak, setStreak] = useState(0)
  const [weekMins, setWeekMins] = useState(0)
  const [points, setPoints] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const greeting = getGreeting()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !user) return
    // 连续打卡
    supabase.from('checkins').select('checked_in_at').eq('user_id', user.id)
      .order('checked_in_at', { ascending: false }).limit(60)
      .then(({ data }) => { if (data) setStreak(calcStreak(data)) })
    // 本周运动时长
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    supabase.from('workouts').select('duration_minutes').eq('user_id', user.id)
      .gte('completed_at', weekAgo.toISOString())
      .then(({ data }) => { if (data) setWeekMins(data.reduce((s, w) => s + (w.duration_minutes ?? 0), 0)) })
    // 轻息币
    supabase.from('workouts').select('points_earned').eq('user_id', user.id)
      .then(({ data }) => { if (data) setPoints(data.reduce((s, w) => s + (w.points_earned ?? 0), 0)) })
  }, [mounted, user])

  if (!mounted) return <div className="h-screen bg-background" />

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col relative">
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-primary/6 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute bottom-20 right-0 w-64 h-64 rounded-full bg-secondary/6 blur-3xl"
          animate={{ x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Navigation />

      {/* ── 数字人区域：撑满剩余高度 ── */}
      <div className="flex-1 relative pt-14 overflow-hidden">
        {/* 问候语叠加在数字人上方 */}
        <motion.div
          className="absolute top-4 left-0 right-0 z-10 flex flex-col items-center pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm md:text-base font-medium text-foreground/80 bg-card/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
            {greeting}
          </p>
          {user && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {user.email?.split('@')[0]} · 连续打卡 {streak} 天
            </p>
          )}
        </motion.div>

        {/* 3D 数字人 Canvas —— 撑满整个区域 */}
        <div className="w-full h-full">
          <DigitalCoach3D view="portrait" />
        </div>

        {/* 在线状态标签 */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full glass-strong text-xs text-foreground/70 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.span className="w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          AI 教练在线
        </motion.div>
      </div>

      {/* ── 底部控制面板 ── */}
      <motion.div
        className="flex-shrink-0 bg-card/80 backdrop-blur-xl border-t border-border/30 px-4 pt-4 pb-20 space-y-3"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 数据统计行 */}
        <div className="flex items-center justify-around">
          {[
            { label: "打卡", value: user ? `${streak}天` : "—" },
            { label: "本周", value: user ? `${weekMins}分` : "—" },
            { label: "轻息币", value: user ? `${points}` : "—" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
          {/* 展开详情按钮 */}
          <motion.button
            onClick={() => setShowDetail(v => !v)}
            className="text-[10px] text-primary flex flex-col items-center gap-0.5"
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-4 h-4"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              animate={{ rotate: showDetail ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M6 9l6 6 6-6" />
            </motion.svg>
            详情
          </motion.button>
        </div>

        {/* AI 对话栏 + 打卡按钮 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <AIChat />
          </div>
          <CheckinButton userId={user?.id} onCheckin={() => setStreak(s => s + 1)} />
        </div>

        {/* 展开的详情面板 */}
        <AnimatePresence>
          {showDetail && (
            <motion.div
              className="space-y-2 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { title: "今日推荐", desc: "晨间唤醒 · 10分钟", href: "/workout", color: "from-peach/40 to-primary/20" },
                  { title: "经期舒缓", desc: "瑜伽 · 15分钟", href: "/workout", color: "from-lilac/40 to-secondary/20" },
                ].map(c => (
                  <Link href={c.href} key={c.title}>
                    <motion.div
                      className={`rounded-xl p-3 bg-gradient-to-br ${c.color}`}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    >
                      <p className="text-xs font-medium text-foreground">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
              {!user && (
                <div className="flex items-center justify-between glass rounded-xl px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">登录解锁数据追踪与 AI 推荐</p>
                  <Link href="/">
                    <span className="text-xs text-primary font-medium">登录 →</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <BottomNav />
    </div>
  )
}
