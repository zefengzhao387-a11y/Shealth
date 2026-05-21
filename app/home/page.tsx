"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { BackgroundEffects } from "@/components/shared/effects"
import { TAP_SPRING } from "@/lib/motion-presets"

type MsgRole = "user" | "ai"
interface ChatMsg {
  id: number
  role: MsgRole
  text: string
}

const QUICK_QUESTIONS = [
  "今天适合做什么运动？",
  "如何缓解经期不适？",
  "有什么快速入睡的方法？",
  "如何改善久坐的肩颈？",
]

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 6) return "夜深了，好好休息 🌙"
  if (h < 12) return "早安，今天也要元气满满 ☀️"
  if (h < 18) return "下午好，记得休息一下 🍃"
  return "晚安，今天辛苦了 ✨"
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/50"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  )
}

function CoachAvatar() {
  return (
    <>
      <motion.div
        className="w-36 h-36 sm:w-44 sm:h-44 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/15"
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-3 md:inset-4 rounded-full glass overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="absolute inset-7 md:inset-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
        <svg className="w-12 h-12 md:w-18 md:h-18 text-primary/60" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="8" r="4" />
          <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
        </svg>
      </div>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/50"
          style={{ left: `${18 + (i % 3) * 32}%`, top: `${12 + Math.floor(i / 3) * 58}%` }}
          animate={{ scale: [0, 1, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.5, delay: i * 0.45, repeat: Infinity }}
        />
      ))}
      {/* Online badge */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full glass-strong text-[10px] font-medium text-foreground/80 whitespace-nowrap shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        AI 教练在线
      </div>
    </>
  )
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user"
  return (
    <motion.div
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 self-end shadow-sm">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-sm"
            : "bg-card/90 border border-border/30 backdrop-blur-sm text-foreground rounded-bl-sm"
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  )
}

function AIInput({
  onSend,
  thinking,
}: {
  onSend: (text: string) => Promise<void>
  thinking: boolean
}) {
  const [msg, setMsg] = useState("")
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = msg.trim()
    if (!content || thinking) return
    setMsg("")
    await onSend(content)
  }

  return (
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <motion.div
        className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent animate-gradient transition-opacity duration-300 ${focused ? "opacity-100" : "opacity-25"}`}
      />
      <div className="relative bg-card/96 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="4" />
              <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
            </svg>
          </div>
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="问 AI 教练任何问题..."
            aria-label="发消息给 AI 教练"
            className="flex-1 min-h-11 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <motion.button
            type="submit"
            disabled={thinking || !msg.trim()}
            aria-label="发送"
            className="touch-target w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            whileTap={TAP_SPRING}
          >
            <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const greeting = getGreeting()
  const scrollRef = useRef<HTMLDivElement>(null)
  const msgId = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, thinking])

  const handleSend = async (content: string) => {
    const userMsg: ChatMsg = { id: ++msgId.current, role: "user", text: content }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)
    setError("")
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
      const aiMsg: ChatMsg = { id: ++msgId.current, role: "ai", text: data.reply || "" }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setError("网络异常，请稍后再试")
    } finally {
      setThinking(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">加载中...</p>
    </div>
  }

  const hasMessages = messages.length > 0

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col relative">
      {/* 背景 */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <BackgroundEffects density="light" />
        <motion.div
          className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-primary/6 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 right-0 w-64 h-64 rounded-full bg-secondary/6 blur-3xl"
          animate={{ x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 极简顶栏 — 不遮内容 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="4" />
              <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
            </svg>
          </div>
          <span className="font-brand text-[17px] bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">灵息</span>
          <span className="text-[11px] text-muted-foreground">AI 教练</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-green-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          在线
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-0 flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] md:pb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            /* 空状态：头像 + 问候 + 快捷问题 */
            <motion.div
              key="empty"
              className="flex-1 flex flex-col items-center justify-center px-4 gap-5 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 头像 */}
              <motion.div
                className="relative"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <CoachAvatar />
              </motion.div>

              {/* 问候气泡 */}
              <motion.div
                className="w-full max-w-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="hero-card rounded-2xl px-4 py-3 text-center">
                  <p className="text-sm text-foreground/85 leading-relaxed">{greeting}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">有任何健康问题都可以问我哦 ✨</p>
                </div>
              </motion.div>

              {/* 快捷问题 chips */}
              <motion.div
                className="w-full max-w-xs flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                {QUICK_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    className="px-3.5 py-2 rounded-full glass border border-white/50 text-[12px] text-foreground/75 hover:text-foreground hover:bg-white/50 transition-colors active:scale-95 touch-target"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    whileTap={TAP_SPRING}
                    onClick={() => handleSend(q)}
                    aria-label={`快捷问题：${q}`}
                  >
                    {q}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* 对话历史 */
            <motion.div
              key="chat"
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {messages.map((m) => (
                <ChatBubble key={m.id} msg={m} />
              ))}

              {thinking && (
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 self-end shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
                    </svg>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-card/90 border border-border/30 backdrop-blur-sm shadow-sm">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}

              {!!error && (
                <p className="text-xs text-destructive text-center py-2">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 吸底输入区 */}
      <div className="bottom-dock md:static md:bottom-auto mobile-shell md:pb-6">
        <AIInput onSend={handleSend} thinking={thinking} />
        {hasMessages && (
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-0.5">
            {QUICK_QUESTIONS.map((q) => (
              <motion.button
                key={q}
                className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full glass border border-white/40 text-muted-foreground whitespace-nowrap touch-target active:bg-white/50 transition-colors"
                whileTap={TAP_SPRING}
                onClick={() => handleSend(q)}
              >
                {q}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
