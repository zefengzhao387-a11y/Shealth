"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { Navigation } from "@/components/shared/navigation"
import { Footer } from "@/components/shared/footer"
import { Petal, Sparkle, Ripple, BackgroundEffects } from "@/components/shared/effects"
import { LiveStatsBoard } from "@/components/shared/live-stats"
import { CommunityShowcase } from "@/components/shared/community-showcase"
import Link from "next/link"
import dynamic from "next/dynamic"
import { TAP_SPRING } from "@/lib/motion-presets"
import { CoachSpeechBubble } from "@/components/coach/coach-speech-bubble"
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

// ── Grain overlay ──────────────────────────────────────────
function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden />
}

const LANDING_WELCOME_TEXT =
  "嗨！先跟我跳一小段吧～每天哪怕动上十分钟，睡眠和代谢都会悄悄变好呢，经期前后也会更舒服哦！"

// ── AI 教练 3D 数字人 ──────────────────────────────────────
function AICoachArea() {
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [messageKey, setMessageKey] = useState(0)
  const [coachReady, setCoachReady] = useState(false)
  const welcomePlayedRef = useRef(false)

  const playLandingWelcome = useCallback(() => {
    if (welcomePlayedRef.current) return
    welcomePlayedRef.current = true
    setMessageKey((k) => k + 1)
    setBubbleText(LANDING_WELCOME_TEXT)
  }, [])

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-[17.5rem] h-[26rem] sm:w-80 sm:h-[30rem] md:w-[22rem] md:h-[34rem]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
      >
        <DigitalCoach
          view="hero"
          showPlatform={false}
          entranceAnim="hipHop"
          onLoaded={() => setCoachReady(true)}
          onWelcomeVoice={playLandingWelcome}
          className="absolute inset-0 h-full w-full"
        />
        {coachReady ? (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
            <CoachSpeechBubble
              text={bubbleText}
              messageKey={messageKey}
              autoDismissMs={10000}
              onAutoDismiss={() => setBubbleText(null)}
              className="top-[12%] -left-[0.5rem] sm:-left-2"
            />
          </div>
        ) : null}
        {coachReady ? (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full glass-strong text-xs text-foreground flex items-center gap-1.5 whitespace-nowrap z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          灵息在线
        </motion.div>
        ) : null}
      </motion.div>
    </div>
  )
}

// ── Hero CTA 按钮 ──────────────────────────────────────────
function HeroButton() {
  return (
    <Link href="/home">
      <motion.button
        className="relative group px-7 md:px-8 py-3.5 md:py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium overflow-hidden text-sm md:text-base shadow-[0_10px_26px_rgba(230,137,171,0.38)]"
        whileTap={TAP_SPRING}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-white/20"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full bg-white/20"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative z-10 flex items-center gap-2">
          和灵息对话
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >→</motion.span>
        </span>
      </motion.button>
    </Link>
  )
}

// ── Hero 区（awwwards 大字排版） ────────────────────────────
function HeroSection({ onScrollDown }: { onScrollDown: () => void }) {
  return (
    <div className="relative h-full flex flex-col overflow-hidden px-4 sm:px-6 md:px-12 pt-16 sm:pt-20">
      {/* 流动渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-peach/8 to-lilac/15 animate-gradient" />

      {/* 飘落花瓣（更稀疏） */}
      {[...Array(7)].map((_, i) => (
        <Petal key={i} delay={i * 2.2} x={(i * 14) % 100} size={["sm", "md"][i % 2] as "sm" | "md"} />
      ))}

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
        {/* Eyebrow label */}
        <motion.div
          className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-7"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="h-px bg-primary/50"
            initial={{ width: 0 }}
            animate={{ width: 44 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <span className="text-[10px] md:text-xs tracking-[0.28em] md:tracking-[0.35em] uppercase text-primary/60 font-medium">
            3D 数字人 · 女性健康陪伴
          </span>
        </motion.div>

        {/* 超大品牌名 */}
        <div className="overflow-hidden mb-1 md:mb-2">
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <span className="font-brand block fluid-display md:text-[15vw] lg:text-[13vw] bg-gradient-to-br from-primary via-[oklch(0.72_0.11_350)] to-secondary bg-clip-text text-transparent select-none tracking-tight">
              她健康
            </span>
          </motion.div>
        </div>

        {/* 下半区：文案 + AI 教练 */}
        <div className="flex items-end justify-between gap-4 md:gap-12">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <p className="text-lg md:text-2xl lg:text-3xl font-light text-foreground/50 mb-1.5 md:mb-2 tracking-[0.22em] md:tracking-widest">
              Shealth
            </p>
            <p className="fluid-body text-muted-foreground max-w-[18rem] md:max-w-sm mb-5 md:mb-7">
              懂你每一个阶段的身体节奏，用最温柔的方式陪伴你变得更好。如花般绽放，如风般轻盈。
            </p>
            <HeroButton />
          </motion.div>

          <motion.div
            className="hidden md:flex flex-shrink-0 pb-2"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          >
            <AICoachArea />
          </motion.div>
        </div>

        {/* 分隔线 */}
        <motion.div
          className="mt-6 md:mt-9 h-px soft-divider"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.85 }}
        />

        {/* 底部数据栏 */}
        <motion.div
          className="flex items-center gap-6 md:gap-12 py-3 md:py-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          {[
            { label: "数字人对话", value: "240万+" },
            { label: "实时口型", value: "同步" },
            { label: "用户好评", value: "4.9★" },
          ].map((stat) => (
            <div key={stat.label} className="hidden sm:block">
              <div className="text-base md:text-lg font-semibold text-foreground">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 tracking-wide">{stat.label}</div>
            </div>
          ))}
          <div className="sm:hidden premium-card rounded-xl px-3 py-2">
            <div className="text-sm font-semibold text-foreground">240万+ 与灵息对话</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">面对面陪伴</div>
          </div>
        </motion.div>
      </div>

      {/* 探索更多 — 底部绝对居中 */}
      <motion.button
        onClick={onScrollDown}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 min-h-12 min-w-[7rem] text-muted-foreground/50 active:text-muted-foreground transition-colors z-10 touch-target"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        whileTap={TAP_SPRING}
      >
        <span className="text-[10px] tracking-[0.24em] sm:tracking-[0.3em] uppercase">探索更多</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </motion.button>
    </div>
  )
}

// ── 特色功能区（editorial 编号行） ─────────────────────────
function FeaturesSection() {
  const features = [
    {
      title: "3D 数字人灵息",
      description: "项目核心：可对话的 3D 数字人。实时语音与口型、招手互动、数字衣橱换装。懂生理期与情绪节奏，像闺蜜一样面对面陪你。",
      icon: (
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <circle cx="12" cy="10" r="3" />
          <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
        </svg>
      ),
      gradient: "bg-gradient-to-br from-peach/40 to-primary/10",
      href: "/home",
    },
    {
      title: "柔和悦动专区",
      description: "灵息推荐适合你的课程：普拉提、瑜伽、经期舒缓、冥想助眠。训练时 AI 视觉纠错，动作到位时花瓣绽放作为正向反馈。",
      icon: (
        <svg className="w-7 h-7 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      gradient: "bg-gradient-to-br from-lilac/40 to-secondary/10",
      href: "/workout",
    },
    {
      title: "繁花社区",
      description: "分享穿搭、健康食谱、微小的进步与蜕变故事。话题频道、微光小队组队打卡，闺蜜互相监督鼓励。送花点亮，治愈每一刻。",
      icon: (
        <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01" />
        </svg>
      ),
      gradient: "bg-gradient-to-br from-sage/40 to-accent/10",
      href: "/community",
    },
    {
      title: "镜心个人中心",
      description: "记录身体维度与蜕变轨迹，让灵息更懂你的变化。成就徽章与轻息币，可为灵息解锁更多装扮与互动。",
      icon: (
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      gradient: "bg-gradient-to-br from-primary/20 to-peach/10",
      href: "/profile",
    },
  ]

  return (
    <section id="features" className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="fluid-title font-medium text-foreground">以灵息为中心</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">数字人 · 01</span>
        </motion.div>

        {/* Editorial numbered rows */}
        <div className="divide-y divide-border/20">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link href={feature.href}>
                <motion.div
                  className="flex items-center gap-3 md:gap-10 py-5 md:py-9 cursor-pointer active:bg-primary/5 rounded-2xl -mx-1 px-1"
                  whileTap={TAP_SPRING}
                >
                  {/* Large number */}
                  <span className="text-3xl md:text-6xl font-bold text-primary/8 group-hover:text-primary/18 transition-colors w-10 md:w-20 flex-shrink-0 font-mono text-center leading-none select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Icon pill */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${feature.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-xl font-medium text-foreground mb-0.5 md:mb-1 group-hover:text-primary transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground/85 leading-relaxed line-clamp-1 sm:hidden">
                      {feature.description}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-lg hidden sm:block">
                      {feature.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="w-8 h-8 rounded-full border border-border/30 items-center justify-center flex-shrink-0 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-200 flex">
                    <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 亮点功能（bento grid） ─────────────────────────────────
function HighlightsSection() {
  const highlights = [
    {
      title: "懂你的生理期轻运动",
      description: "智能感知你的身体周期，推荐最适合当下状态的轻柔运动",
      icon: (
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      accent: "from-peach/30 to-primary/10",
    },
    {
      title: "AI 流光体态纠正",
      description: "温柔的流光线条实时指引，动作到位时花瓣绽放",
      icon: (
        <svg className="w-6 h-6 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      accent: "from-lilac/30 to-secondary/10",
    },
    {
      title: "助眠冥想与呼吸",
      description: "月光般温柔的引导，让每一次呼吸都成为治愈",
      icon: (
        <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
      accent: "from-sage/25 to-accent/10",
    },
    {
      title: "微光小队打卡",
      description: "和闺蜜组队，互相监督鼓励，一起变得更好",
      icon: (
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      accent: "from-primary/15 to-peach/10",
    },
    {
      title: "数字衣橱成就",
      description: "用轻息币兑换虚拟装扮，让坚持变得有趣",
      icon: (
        <svg className="w-6 h-6 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      accent: "from-secondary/15 to-lilac/10",
    },
    {
      title: "贝塞尔曲线数据",
      description: "平滑优雅的数据可视化，记录你的蜕变轨迹",
      icon: (
        <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      ),
      accent: "from-accent/15 to-sage/10",
    },
  ]

  return (
    <section className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="fluid-title font-medium text-foreground">为你量身定制的温柔功能</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">特色 · 06</span>
        </motion.div>

        {/* 移动端：横滑卡片 */}
        <div className="flex snap-scroll-x pb-1 -mx-4 px-4 md:!hidden">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              className="premium-card rounded-2xl p-4 flex flex-col gap-3 w-[78vw] max-w-[300px]"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileTap={TAP_SPRING}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 桌面端：Bento 网格（仅一处，无重复） */}
        <div className="hidden md:grid md:grid-cols-3 md:grid-rows-[auto_auto_auto] gap-5">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              className={[
                "premium-card group rounded-3xl p-7 flex flex-col gap-5 transition-all duration-300",
                "hover:shadow-[0_12px_40px_rgba(230,137,171,0.12)] hover:-translate-y-1",
                i === 0 ? "md:col-span-2 md:row-span-2 md:p-9" : "",
                i === 1 ? "md:col-start-3 md:row-start-1" : "",
                i === 2 ? "md:col-start-3 md:row-start-2" : "",
              ].join(" ")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.accent} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium text-foreground mb-2 ${i === 0 ? "text-xl" : "text-base"}`}>
                  {item.title}
                </h3>
                <p className={`text-muted-foreground leading-relaxed ${i === 0 ? "text-sm max-w-md" : "text-sm"}`}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 社群展示 ───────────────────────────────────────────────
function CommunitySection() {
  return (
    <section className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">全球她健康社区</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">社区</span>
        </motion.div>

        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-muted-foreground mb-8 max-w-md">
            数百万女性正在这里一起蜕变成更好的自己
          </p>
          <LiveStatsBoard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <CommunityShowcase />
        </motion.div>
      </div>
    </section>
  )
}

// ── 关于（大引用 editorial） ───────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">
            为什么选择
            <span className="font-brand ml-2 text-2xl md:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              她健康
            </span>
          </h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">关于</span>
        </motion.div>

        {/* Large editorial blockquote */}
        <motion.blockquote
          className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/75 leading-relaxed mb-12 pl-6 md:pl-8 border-l-2 border-primary/40"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          "健身，不只是消耗卡路里。<br />
          对于女性来说，它更是
          <span className="text-primary font-medium"> 自我关爱</span>
          与
          <span className="text-secondary font-medium"> 身心治愈</span>
          的过程。"
        </motion.blockquote>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <motion.p
            className="text-muted-foreground leading-loose text-sm md:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            她健康以 3D 数字人灵息为入口，摒弃传统健身 App 的硬核与高压。你看到的不是冷冰冰的界面，而是一个会回应、会动作、会记住你的陪伴者。
          </motion.p>
          <motion.p
            className="text-foreground/65 leading-loose text-sm md:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            和灵息聊运动、聊睡眠、聊心情——训练、社区与数据都围绕这位数字人展开。你不需要和任何人比较，只需要成为更好的自己。
          </motion.p>
        </div>
      </div>
    </section>
  )
}

// ── CTA 区 ─────────────────────────────────────────────────
function CTASection() {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <section id="community" className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.div
          className="flex items-baseline justify-center gap-4 mb-2 pb-5 border-b border-border/20 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">准备好开始了吗？</h2>
        </motion.div>

        <motion.p
          className="text-muted-foreground mb-8 text-sm md:text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          和灵息打个招呼，开始你们的第一次面对面聊天
        </motion.p>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div
            className={`absolute -inset-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-accent animate-gradient transition-opacity duration-300 ${
              isFocused ? "opacity-100" : "opacity-40"
            }`}
          />
          <div className="relative flex items-center gap-2.5 md:gap-3 bg-card rounded-full px-4 md:px-6 py-3.5 md:py-4">
            <input
              type="text"
              placeholder="今天想聊运动、睡眠，还是心情？"
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-[13px] md:text-sm"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <Link href="/home">
              <motion.button
                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {["放松拉伸", "经期舒缓", "睡前冥想", "普拉提塑形"].map((tag, i) => (
            <motion.button
              key={tag}
              className="px-4 py-1.5 rounded-full glass text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              {tag}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── 今日计划卡片（skill 验证区） ──────────────────────────────
function TodayPlanSection() {
  const planCards = [
    {
      title: "晨间舒缓",
      duration: "12 分钟",
      status: "推荐",
      description: "轻柔拉伸与呼吸唤醒，适合起床后快速进入状态。",
      href: "/workout",
      accent: "bg-primary/10 text-primary",
    },
    {
      title: "午间核心",
      duration: "18 分钟",
      status: "进阶",
      description: "短时核心激活，保持腰腹力量与稳定感。",
      href: "/workout",
      accent: "bg-secondary/10 text-secondary",
    },
    {
      title: "晚间助眠",
      duration: "15 分钟",
      status: "放松",
      description: "低强度伸展配合冥想节奏，帮助你更快放松入睡。",
      href: "/home",
      accent: "bg-accent/15 text-accent",
    },
  ]

  return (
    <section className="relative py-14 md:py-24 px-4 md:px-12 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="fluid-title font-medium text-foreground">今日专属计划</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">计划</span>
        </motion.div>

        <div className="flex snap-scroll-x pb-1 -mx-4 px-4 md:!hidden">
          {planCards.map((card, i) => (
            <motion.article
              key={card.title}
              className="rounded-2xl border border-border/40 bg-card/95 p-5 w-[82vw] max-w-[320px]"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileTap={TAP_SPRING}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${card.accent}`}>
                  {card.status}
                </span>
                <span className="text-xs text-muted-foreground">{card.duration}</span>
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{card.description}</p>
              <Link
                href={card.href}
                className="touch-target inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 py-3 text-sm font-medium active:opacity-90"
              >
                开始训练
              </Link>
            </motion.article>
          ))}
        </div>
        <div className="hidden md:grid grid-cols-3 gap-4">
          {planCards.map((card, i) => (
            <motion.article
              key={card.title}
              className="rounded-2xl border border-border/40 bg-card/95 p-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${card.accent}`}>
                  {card.status}
                </span>
                <span className="text-xs text-muted-foreground">{card.duration}</span>
              </div>

              <h3 className="text-base md:text-lg font-medium text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{card.description}</p>

              <Link
                href={card.href}
                className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                开始训练
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 主页面 ─────────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<"hero" | "content">("hero")
  const touchStartY = useRef(0)
  const busy = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const privacyRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const goToContent = () => {
    if (busy.current) return
    busy.current = true
    setPhase("content")
    setTimeout(() => { busy.current = false }, 800)
  }

  const goToHero = () => {
    if (busy.current) return
    busy.current = true
    setPhase("hero")
    setTimeout(() => { busy.current = false }, 800)
  }

  useEffect(() => {
    if (!mounted || phase !== "hero") return
    const onWheel = (e: WheelEvent) => { if (e.deltaY > 20) goToContent() }
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current - e.touches[0].clientY > 40) goToContent()
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [mounted, phase])

  useEffect(() => {
    if (!mounted || phase !== "content") return
    const el = contentRef.current
    if (!el) return

    const clampScrollToPrivacy = () => {
      const privacy = privacyRef.current
      if (!privacy) return
      const maxScroll = Math.max(0, privacy.offsetTop - el.clientHeight + 72)
      if (el.scrollTop > maxScroll) {
        el.scrollTop = maxScroll
      }
    }

    const onScroll = () => clampScrollToPrivacy()
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop === 0 && e.touches[0].clientY - touchStartY.current > 40) goToHero()
    }
    clampScrollToPrivacy()
    el.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [mounted, phase])

  return (
    <div className="h-screen overflow-hidden relative bg-gradient-to-br from-cream via-peach/10 to-lilac/20">
      <GrainOverlay />
      <BackgroundEffects density="light" />
      <Navigation />

      <AnimatePresence mode="wait">
        {phase === "hero" ? (
          <motion.div
            key="hero"
            className="absolute inset-0"
            initial={mounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -70,
              rotateX: 10,
              scale: 0.95,
              filter: "blur(6px)",
            }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center top", transformPerspective: 1400 }}
          >
            <HeroSection onScrollDown={goToContent} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            ref={contentRef}
            className="absolute inset-0 overflow-y-auto bg-background pb-[calc(env(safe-area-inset-bottom,0px)+5.8rem)] md:pb-0"
            initial={mounted ? { opacity: 0, y: 100, rotateX: -10, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center bottom", transformPerspective: 1400 }}
          >
            {/* 返回按钮 */}
            <div className="sticky top-0 z-20 flex justify-center pt-12 md:pt-14 pointer-events-none">
              <motion.button
                onClick={goToHero}
                className="pointer-events-auto hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full glass-strong text-xs text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.04 }}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                回到首页
              </motion.button>
            </div>

            <div className="-mt-8 md:-mt-10">
              <FeaturesSection />
              <HighlightsSection />
              <TodayPlanSection />
              <CommunitySection />
              <AboutSection />
              <CTASection />
              <a ref={privacyRef} id="privacy-policy-anchor" className="block h-px w-full" aria-hidden />
              <Footer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
