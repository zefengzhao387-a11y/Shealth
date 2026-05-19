"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/shared/navigation"
import { BottomNav } from "@/components/shared/bottom-nav"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import dynamic from "next/dynamic"

const DigitalCoach3D = dynamic(
  () => import("@/components/3d/digital-coach").then(mod => mod.DigitalCoach),
  { ssr: false, loading: () => <div className="h-36 w-36 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" /> }
)

// ── 工具 ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return { text: "夜深了，注意休息", tip: "睡前冥想 15 分钟，深度放松" }
  if (h < 12) return { text: "早安，今天也要元气满满", tip: "晨间唤醒 10 分钟，开启美好的一天" }
  if (h < 18) return { text: "下午好，记得休息一下", tip: "办公室拉伸 5 分钟，缓解肩颈疲劳" }
  return { text: "晚安，今天辛苦了", tip: "睡前冥想 15 分钟，安抚疲惫的心" }
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

// ── 今日打卡按钮 ──────────────────────────────────────────
function CheckinButton({ userId, onCheckin }: { userId: string | undefined; onCheckin: () => void }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    supabase.from('checkins')
      .select('id')
      .eq('user_id', userId)
      .gte('checked_in_at', today.toISOString())
      .limit(1)
      .then(({ data }) => { if (data && data.length > 0) setDone(true) })
  }, [userId])

  const handleCheckin = async () => {
    if (!userId || done || loading) return
    setLoading(true)
    await supabase.from('checkins').insert({ user_id: userId })
    setDone(true)
    setLoading(false)
    onCheckin()
  }

  return (
    <motion.button
      onClick={handleCheckin}
      disabled={done || loading || !userId}
      className={`relative w-full py-4 rounded-2xl font-medium text-sm overflow-hidden transition-all ${
        done
          ? "bg-gradient-to-r from-sage/40 to-accent/30 text-accent-foreground"
          : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
      }`}
      whileHover={done ? {} : { scale: 1.02 }}
      whileTap={done ? {} : { scale: 0.98 }}
    >
      {!done && (
        <motion.span
          className="absolute inset-0 bg-white/20 rounded-2xl"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {done ? (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            今日已打卡
          </>
        ) : loading ? (
          "打卡中..."
        ) : userId ? (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            今日打卡
          </>
        ) : (
          "登录后打卡"
        )}
      </span>
    </motion.button>
  )
}

// ── AI 对话栏 ─────────────────────────────────────────────
function AIChat() {
  const [msg, setMsg] = useState("")
  const [focused, setFocused] = useState(false)

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent animate-gradient transition-opacity duration-300 ${focused ? "opacity-100" : "opacity-40"}`}
          />
          <div className="relative flex items-center gap-2 bg-card/95 backdrop-blur-xl rounded-2xl px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
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
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── 课程卡片 ──────────────────────────────────────────────
function CourseCard({ title, subtitle, duration, tag, color, href = "/workout" }: {
  title: string; subtitle: string; duration: string; tag: string; color: string; href?: string
}) {
  return (
    <Link href={href}>
      <motion.div
        className={`rounded-2xl p-4 bg-gradient-to-br ${color} relative overflow-hidden h-full`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-white/30 text-foreground/80 mb-2">{tag}</span>
        <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">{subtitle}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          {duration}
        </div>
      </motion.div>
    </Link>
  )
}

// ── 主页面 ────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [streak, setStreak] = useState(0)
  const [weekMins, setWeekMins] = useState(0)
  const [points, setPoints] = useState(0)
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([])
  const greeting = getGreeting()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !user) return

    // 连续打卡天数
    supabase.from('checkins')
      .select('checked_in_at')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(60)
      .then(({ data }) => { if (data) setStreak(calcStreak(data)) })

    // 本周运动时长
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    supabase.from('workouts')
      .select('duration_minutes, points_earned, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', weekAgo.toISOString())
      .then(({ data }) => {
        if (data) {
          setWeekMins(data.reduce((s, w) => s + (w.duration_minutes ?? 0), 0))
        }
      })

    // 轻息币（从 profile）
    supabase.from('profiles')
      .select('bio')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        // bio 字段暂时不存积分；直接累计 workouts
        supabase.from('workouts')
          .select('points_earned')
          .eq('user_id', user.id)
          .then(({ data: w }) => {
            if (w) setPoints(w.reduce((s, x) => s + (x.points_earned ?? 0), 0))
          })
      })

    // 近期运动记录
    supabase.from('workouts')
      .select('course_title, duration_minutes, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setRecentWorkouts(data) })
  }, [mounted, user])

  if (!mounted) return <div className="min-h-screen bg-background" />

  return (
    <div className="min-h-screen bg-background relative">
      {/* 柔和背景光晕 */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          className="absolute top-20 -left-16 w-64 h-64 rounded-full bg-primary/8 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 -right-16 w-72 h-72 rounded-full bg-secondary/8 blur-3xl"
          animate={{ x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Navigation />

      <div className="pt-16 pb-40 px-4 max-w-lg mx-auto">

        {/* ── 顶部：AI 教练 + 问候 ── */}
        <motion.div
          className="flex items-center gap-4 mt-4 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* AI 教练头像（小） */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden glass border border-border/30">
              <DigitalCoach3D view="circle" />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/90 border border-border/20 text-[10px] text-muted-foreground whitespace-nowrap shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              在线
            </span>
          </div>

          {/* 问候文字 */}
          <div className="flex-1 min-w-0">
            {user && (
              <p className="text-xs text-muted-foreground mb-0.5 truncate">
                你好，{user.email?.split('@')[0]} 👋
              </p>
            )}
            <h1 className="text-base font-semibold text-foreground leading-snug">{greeting.text}</h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{greeting.tip}</p>
          </div>
        </motion.div>

        {/* ── 今日打卡 ── */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CheckinButton
            userId={user?.id}
            onCheckin={() => setStreak(s => s + 1)}
          />
        </motion.div>

        {/* ── 状态数据 ── */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {[
            {
              label: "连续打卡",
              value: user ? `${streak} 天` : "—",
              icon: (
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                </svg>
              ),
            },
            {
              label: "本周运动",
              value: user ? `${weekMins} 分` : "—",
              icon: (
                <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              ),
            },
            {
              label: "轻息币",
              value: user ? `${points}` : "—",
              icon: (
                <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v12M8 10h8M8 14h8" />
                </svg>
              ),
            },
          ].map((s) => (
            <motion.div
              key={s.label}
              className="glass rounded-2xl p-3 text-center"
              whileHover={{ scale: 1.03, y: -2 }}
            >
              <div className="w-9 h-9 mx-auto mb-1.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                {s.icon}
              </div>
              <p className="text-base font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── 今日推荐课程 ── */}
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">今日推荐</h2>
            <Link href="/workout" className="text-xs text-primary">查看全部 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <CourseCard title="晨间唤醒流" subtitle="激活身体能量" duration="10 分钟" tag="今日必做" color="from-peach/40 to-primary/20" />
            <CourseCard title="经期舒缓瑜伽" subtitle="温柔呵护身心" duration="15 分钟" tag="女性专属" color="from-lilac/40 to-secondary/20" />
            <CourseCard title="办公室拉伸" subtitle="缓解久坐疲劳" duration="8 分钟" tag="随时可做" color="from-primary/20 to-accent/20" />
            <CourseCard title="睡前冥想" subtitle="安抚疲惫的心" duration="20 分钟" tag="睡眠助手" color="from-secondary/20 to-lilac/40" />
          </div>
        </motion.section>

        {/* ── 近期运动记录 ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">近期记录</h2>

          {!user ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">登录后查看你的运动记录</p>
              <Link href="/">
                <motion.button
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-medium"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  去登录
                </motion.button>
              </Link>
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-2xl mb-2">🌸</p>
              <p className="text-sm text-foreground font-medium mb-1">还没有记录</p>
              <p className="text-xs text-muted-foreground">完成第一次课程后，记录将显示在这里</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((r, i) => {
                const d = new Date(r.completed_at)
                const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
                const dateLabel = diffDays === 0 ? "今天" : diffDays === 1 ? "昨天" : `${diffDays} 天前`
                return (
                  <motion.div
                    key={i}
                    className="glass rounded-2xl px-4 py-3 flex items-center justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 2 }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.course_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{dateLabel} · {r.duration_minutes} 分钟</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.section>

        {/* 未登录提示 */}
        {!user && (
          <motion.div
            className="mt-5 glass rounded-2xl p-4 flex items-center gap-3 border border-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">登录解锁全部功能</p>
              <p className="text-xs text-muted-foreground mt-0.5">打卡记录、数据追踪、AI 个性化推荐</p>
            </div>
            <Link href="/">
              <span className="text-xs text-primary font-medium whitespace-nowrap">登录 →</span>
            </Link>
          </motion.div>
        )}
      </div>

      <AIChat />
      <BottomNav />
    </div>
  )
}
