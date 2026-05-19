"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/shared/navigation"

// ── 工具 ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return "夜深了，好好休息 🌙"
  if (h < 12) return "早安，今天也要元气满满 ☀️"
  if (h < 18) return "下午好，记得休息一下 🍃"
  return "晚安，今天辛苦了 ✨"
}

// ── AI 对话栏 ─────────────────────────────────────────────
function AIChat({
  onAsk,
  thinking,
  error,
}: {
  onAsk: (content: string) => Promise<void>
  thinking: boolean
  error: string
}) {
  const [msg, setMsg] = useState("")
  const [focused, setFocused] = useState(false)

  const sendToAI = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = msg.trim()
    if (!content || thinking) return

    try {
      await onAsk(content)
      setMsg("")
    } catch {
      // errors are surfaced by parent state
    }
  }

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
      <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl px-4 py-3">
        <form onSubmit={sendToAI} className="flex items-center gap-2">
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
            type="submit"
            disabled={thinking || !msg.trim()}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-60"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </motion.button>
        </form>
        {thinking && <p className="mt-2 text-xs text-muted-foreground">灵息思考中...</p>}
        {!!error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </motion.div>
  )
}

// ── 主页面 ────────────────────────────────────────────────
export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState("")
  const [reply, setReply] = useState("")
  const [bubbleOffset, setBubbleOffset] = useState({ x: 0, y: 0 })
  const greeting = getGreeting()

  useEffect(() => { setMounted(true) }, [])

  const askAI = async (content: string) => {
    setThinking(true)
    setError("")
    setReply("")
    setBubbleOffset({
      x: Math.floor(Math.random() * 30) - 15,
      y: Math.floor(Math.random() * 16) - 8,
    })

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.detail || data?.error || "AI 暂时不可用")
        return
      }
      setReply(data.reply || "")
    } catch {
      setError("网络异常，请稍后再试")
    } finally {
      setThinking(false)
    }
  }

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
        {/* AI 教练头像 —— 居中大圆 */}
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            className="relative"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute left-1/2 -top-10 z-10 pointer-events-none"
              style={{ transform: `translateX(calc(-50% + ${bubbleOffset.x}px)) translateY(${bubbleOffset.y}px)` }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative max-w-[260px] md:max-w-[360px] rounded-2xl bg-card/90 border border-border/50 shadow-md backdrop-blur-md px-4 py-2.5">
                <p className="text-sm md:text-base leading-relaxed text-foreground/85 whitespace-pre-wrap">
                  {thinking ? "灵息正在思考..." : (reply || greeting)}
                </p>
                <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-card/90" />
              </div>
            </motion.div>

            {/* 外层呼吸光环 */}
            <motion.div
              className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/15"
              animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* 中层毛玻璃圆 */}
            <div className="absolute inset-5 rounded-full glass overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {/* 核心头像 */}
            <div className="absolute inset-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
              <svg className="w-16 h-16 md:w-20 md:h-20 text-primary/60" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
              </svg>
            </div>
            {/* 散落光点 */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/40"
                style={{
                  left: `${20 + (i % 3) * 30}%`,
                  top: `${15 + Math.floor(i / 3) * 55}%`,
                }}
                animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0] }}
                transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </motion.div>
        </div>

      </div>

      <div className="px-4 pb-6">
        <AIChat onAsk={askAI} thinking={thinking} error={error} />
      </div>
    </div>
  )
}
