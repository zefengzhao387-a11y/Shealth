"use client"

import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef, useCallback } from "react"
import { WardrobeButton } from "@/components/coach/wardrobe-button"
import { CoachSpeechBubble } from "@/components/coach/coach-speech-bubble"
import { CoachModuleLinks } from "@/components/coach/coach-module-links"
import type { CoachSpeechCue } from "@/components/3d/digital-coach"
import { touchPokeBubbleText, type TouchPokeRegion } from "@/lib/vrm-spring-poke"
import { TAP_SPRING } from "@/lib/motion-presets"
import { DEFAULT_OUTFIT_ID, type CoachOutfitId } from "@/lib/coach-outfit"
import { playCoachSpeech, stopCoachSpeech } from "@/lib/coach-tts"
import { DigitalCoachLoading } from "@/components/coach/digital-coach-loading"

const DigitalCoach = dynamic(
  () => import("@/components/3d/digital-coach").then((m) => m.DigitalCoach),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full min-h-[200px] w-full bg-transparent">
        <DigitalCoachLoading />
      </div>
    ),
  },
)

const FallingPetalsScreen = dynamic(
  () => import("@/components/3d/falling-petals-screen").then((m) => m.FallingPetalsScreen),
  { ssr: false },
)

interface UserChatMsg {
  id: number
  text: string
}

const MAX_VISIBLE_USER_MSGS = 2

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

function UserChatBubble({ msg }: { msg: UserChatMsg }) {
  return (
    <motion.div
      layout
      className="flex flex-row-reverse"
      initial={{ opacity: 0, y: 14, scale: 0.94, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        y: -24,
        scale: 1.1,
        filter: "blur(14px)",
      }}
      transition={{
        layout: { type: "spring", damping: 28, stiffness: 320 },
        opacity: { duration: 0.58, ease: [0.4, 0, 0.2, 1] },
        y: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: 0.52, ease: "easeOut" },
      }}
    >
      <div className="max-w-[min(85%,520px)] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm bg-gradient-to-br from-primary/95 to-secondary/95 text-primary-foreground backdrop-blur-sm">
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
    <motion.div className="relative w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div
        className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent animate-gradient transition-opacity duration-300 ${focused ? "opacity-100" : "opacity-25"}`}
      />
      <div className="relative bg-card/96 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="和灵息说点什么..."
            aria-label="发消息给灵息"
            className="flex-1 min-h-11 bg-transparent border-none outline-none text-sm md:text-base text-foreground placeholder:text-muted-foreground"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <motion.button
            type="submit"
            disabled={thinking || !msg.trim()}
            aria-label="发送"
            className="touch-target w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
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
  const [userMessages, setUserMessages] = useState<UserChatMsg[]>([])
  const [outfitId, setOutfitId] = useState<CoachOutfitId>(DEFAULT_OUTFIT_ID)
  const [coachSpeech, setCoachSpeech] = useState<CoachSpeechCue | null>(null)
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [subtitleProgress, setSubtitleProgress] = useState(1)
  const [speechMessageKey, setSpeechMessageKey] = useState(0)
  const greeting = getGreeting()
  const scrollRef = useRef<HTMLDivElement>(null)
  const msgId = useRef(0)
  const speechToken = useRef(0)
  const speechCtrlRef = useRef<Awaited<ReturnType<typeof playCoachSpeech>> | null>(null)
  const welcomePlayedRef = useRef(false)
  const gazeEasterEggPlayedRef = useRef(false)
  const [coachReady, setCoachReady] = useState(false)

  const playWelcomeVoice = useCallback(() => {
    if (welcomePlayedRef.current) return
    welcomePlayedRef.current = true
    const text = "今天锻炼了吗？"
    const token = ++speechToken.current
    setSpeechMessageKey(token)
    setBubbleText(text)
    setSubtitleProgress(1)
    setCoachSpeech(null)
  }, [])

  const playGazeEasterEgg = useCallback(() => {
    if (gazeEasterEggPlayedRef.current || thinking || coachSpeech) return
    gazeEasterEggPlayedRef.current = true
    const text = "宝贝，一直看着我，是我脸上有什么东西吗？（笑）"
    const token = ++speechToken.current
    setSpeechMessageKey(token)
    setBubbleText(text)
    setSubtitleProgress(1)
    setCoachSpeech(null)
  }, [thinking, coachSpeech])

  const playTouchPoke = useCallback(
    (region: TouchPokeRegion) => {
      if (coachSpeech) return
      const text = touchPokeBubbleText(region)
      const token = ++speechToken.current
      setSpeechMessageKey(token)
      setBubbleText(text)
      setSubtitleProgress(1)
      setCoachSpeech(null)
    },
    [coachSpeech],
  )

  useEffect(() => {
    setMounted(true)
    return () => {
      speechCtrlRef.current?.stop()
      stopCoachSpeech()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [userMessages, thinking])

  useEffect(() => {
    if (!bubbleText) {
      setSubtitleProgress(0)
      return
    }
    if (!coachSpeech?.getElapsedSec || !coachSpeech.durationMs) {
      setSubtitleProgress(1)
      return
    }

    let raf = 0
    const tick = () => {
      const durationSec = coachSpeech.durationMs! / 1000
      const p = durationSec > 0 ? Math.min(1, coachSpeech.getElapsedSec!() / durationSec) : 1
      setSubtitleProgress(p)
      if (p < 0.999) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [coachSpeech?.token, coachSpeech?.durationMs, bubbleText])

  const handleSend = async (content: string) => {
    const userMsg: UserChatMsg = { id: ++msgId.current, text: content }
    setUserMessages((prev) => {
      const next = [...prev, userMsg]
      return next.length > MAX_VISIBLE_USER_MSGS ? next.slice(-MAX_VISIBLE_USER_MSGS) : next
    })
    setThinking(true)
    setError("")
    speechCtrlRef.current?.stop()
    speechCtrlRef.current = null
    setCoachSpeech(null)
    setBubbleText(null)
    setSubtitleProgress(0)
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
      const reply = data.reply || ""
      const token = ++speechToken.current
      setSpeechMessageKey(token)
      setBubbleText(reply)
      setSubtitleProgress(0)

      const speechCtrl = await playCoachSpeech(reply)
      speechCtrlRef.current = speechCtrl
      setCoachSpeech({
        text: reply,
        token,
        durationMs: speechCtrl.durationMs,
        getElapsedSec: speechCtrl.getElapsedSec,
      })

      speechCtrl.done.finally(() => {
        if (speechCtrlRef.current === speechCtrl) {
          speechCtrlRef.current = null
          setCoachSpeech(null)
        }
      })
    } catch {
      setError("网络异常，请稍后再试")
    } finally {
      setThinking(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-[#FAF6F0]" />
  }

  const hasMessages = userMessages.length > 0

  return (
    <div className="relative min-h-screen md:h-screen w-full overflow-hidden bg-[#FAF6F0] flex flex-col">
      <div
        className="fixed inset-0 z-0 pointer-events-none blur-[120px] opacity-40"
        aria-hidden
      >
        <div className="absolute -left-[10%] top-[6%] h-[min(92vw,640px)] w-[min(92vw,640px)] rounded-full bg-pink-200/60 animate-fluid-glow" />
        <div className="absolute right-[-8%] top-[32%] h-[min(88vw,600px)] w-[min(88vw,600px)] rounded-full bg-amber-100/70 animate-fluid-glow-alt" />
        <div className="absolute left-[22%] bottom-[-10%] h-[min(84vw,560px)] w-[min(84vw,560px)] rounded-full bg-sky-100/50 animate-fluid-glow-soft" />
      </div>

      <FallingPetalsScreen />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      {/* 顶栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2">
        <div className="flex items-center gap-2.5">
          <span className="font-brand text-xl md:text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">灵息</span>
          <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">3D 数字人 · 面对面陪伴</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          在线
        </div>
      </div>

      {/* 主体：最左模块栏 + 居中舞台与对话 */}
      <div className="flex flex-1 min-h-0 w-full">
        <aside className="flex-shrink-0 pl-3 pt-2 md:pl-5 md:pt-6 lg:pl-8">
          <CoachModuleLinks variant="sidebar" />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center px-3 sm:px-4 md:px-6">
      {/* 中间 3D 舞台 — 居中 */}
      <div
        className={`relative flex-shrink-0 w-full flex justify-center transition-[height] duration-500 ${
          hasMessages ? "h-[34vh] md:h-[42vh]" : "h-[min(48vh,480px)] md:h-[min(52vh,560px)]"
        }`}
      >
        <div className="relative h-full w-full max-w-[min(100%,520px)]">
          {/* 左：模型独占区 | 右：云朵专用区 — 物理隔离，云朵不会压住模型 */}
          <div className="grid h-full grid-cols-[minmax(0,1fr)_138px] sm:grid-cols-[minmax(0,1fr)_152px] md:grid-cols-[minmax(0,1fr)_168px]">
            <div className="relative min-w-0 h-full overflow-hidden">
              <DigitalCoach
                view="full"
                outfitId={outfitId}
                speech={coachSpeech}
                onLoaded={() => setCoachReady(true)}
                onSpeechEnd={() => setCoachSpeech(null)}
                onWelcomeVoice={playWelcomeVoice}
                onGazeEasterEgg={playGazeEasterEgg}
                onTouchPoke={playTouchPoke}
                className="absolute inset-0 z-10 h-full w-full"
              />

              {/* 头部锚点 — 尖角对准此处（不可见） */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-[15%] left-[54%] h-1 w-1 -translate-x-1/2 opacity-0"
                data-coach-head-anchor
              />

              <div className="absolute top-2 right-0 z-20 md:top-3">
                {coachReady ? (
                  <WardrobeButton value={outfitId} onChange={setOutfitId} />
                ) : null}
              </div>

              {coachReady ? (
                <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full glass-strong px-3 py-1 text-[11px] text-foreground/80 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  灵息在线
                </div>
              ) : null}
            </div>

            <div className="relative h-full overflow-visible pointer-events-none">
              <CoachSpeechBubble
                text={bubbleText}
                thinking={thinking}
                progress={subtitleProgress}
                messageKey={speechMessageKey}
                autoDismissMs={10000}
                onAutoDismiss={() => setBubbleText(null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 下方对话区 */}
      <div className="flex w-full max-w-2xl flex-1 min-h-0 flex-col pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="empty"
              className="flex-1 flex flex-col justify-start gap-4 py-2 md:py-4 overflow-y-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="hero-card rounded-2xl px-5 py-4 md:px-6 md:py-5">
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">{greeting}</p>
                <p className="text-sm text-muted-foreground mt-2">我是灵息，你的 3D 数字人教练。运动、健康、情绪，都可以直接跟我聊 ✨</p>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-2.5">
                {QUICK_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    className="px-4 py-2.5 rounded-full glass border border-white/50 text-sm text-foreground/75 hover:text-foreground hover:bg-white/50 transition-colors active:scale-95"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    whileTap={TAP_SPRING}
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden py-2 pt-3 space-y-4 md:space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {userMessages.map((m) => (
                  <UserChatBubble key={m.id} msg={m} />
                ))}
              </AnimatePresence>

              {thinking && (
                <motion.div className="flex gap-2.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 self-end shadow-sm">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-card/92 border border-border/30 backdrop-blur-sm shadow-sm">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}

              {!!error && <p className="text-sm text-destructive text-center py-2">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-shrink-0 pt-3">
          <AIInput onSend={handleSend} thinking={thinking} />
          {hasMessages && (
            <div className="flex gap-2 mt-2.5 overflow-x-auto scrollbar-hide">
              {QUICK_QUESTIONS.map((q) => (
                <motion.button
                  key={q}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full glass border border-white/40 text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors"
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
        </div>
      </div>
      </div>
    </div>
  )
}
