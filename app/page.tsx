"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Navigation } from "@/components/shared/navigation"
import { Footer } from "@/components/shared/footer"
import { Petal, Sparkle, Ripple, BackgroundEffects } from "@/components/shared/effects"
import { LiveStatsBoard } from "@/components/shared/live-stats"
import { CommunityShowcase } from "@/components/shared/community-showcase"
import Link from "next/link"
import dynamic from "next/dynamic"

const VRMCoach = dynamic(
  () => import("@/components/3d/digital-coach").then(m => m.DigitalCoach),
  { ssr: false, loading: () => null }
)

// ── Grain overlay ──────────────────────────────────────────
function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden />
}

// ── AI 教练头像区 ──────────────────────────────────────────
function AICoachArea() {
  return (
    <motion.div
      className="relative w-52 h-52 md:w-64 md:h-64"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-4 glass rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.div
        className="absolute inset-2 rounded-full overflow-hidden"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <VRMCoach view="circle" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-secondary/10 pointer-events-none"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full glass-strong text-xs text-foreground flex items-center gap-1.5 whitespace-nowrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        AI 教练在线
      </motion.div>
      {[...Array(6)].map((_, i) => (
        <Sparkle key={i} x={15 + (i % 3) * 30} y={15 + Math.floor(i / 3) * 60} delay={i * 0.4} />
      ))}
    </motion.div>
  )
}

// ── Hero CTA 按钮 ──────────────────────────────────────────
function HeroButton() {
  return (
    <Link href="/home">
      <motion.button
        className="relative group px-8 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium overflow-hidden text-sm md:text-base"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
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
          开启花间之旅
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
    <div className="relative h-full flex flex-col overflow-hidden px-6 md:px-12 pt-20">
      {/* 流动渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-peach/8 to-lilac/15 animate-gradient" />

      {/* 飘落花瓣（更稀疏） */}
      {[...Array(7)].map((_, i) => (
        <Petal key={i} delay={i * 2.2} x={(i * 14) % 100} size={["sm", "md"][i % 2] as "sm" | "md"} />
      ))}

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
        {/* Eyebrow label */}
        <motion.div
          className="flex items-center gap-3 mb-5 md:mb-7"
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
          <span className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-primary/60 font-medium">
            女性专属 AI 健身教练
          </span>
        </motion.div>

        {/* 超大品牌名 */}
        <div className="overflow-hidden mb-1 md:mb-2">
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <span className="font-brand block text-[22vw] sm:text-[18vw] md:text-[15vw] lg:text-[13vw] leading-[0.82] bg-gradient-to-br from-primary via-[oklch(0.72_0.11_350)] to-secondary bg-clip-text text-transparent select-none">
              花间塑
            </span>
          </motion.div>
        </div>

        {/* 下半区：文案 + AI 教练 */}
        <div className="flex items-end justify-between gap-6 md:gap-12">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <p className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/50 mb-2 tracking-widest">
              FloraMotion
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-xs md:max-w-sm leading-relaxed mb-7">
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
          className="mt-7 md:mt-9 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 0.85 }}
        />

        {/* 底部数据栏 */}
        <motion.div
          className="flex items-center gap-8 md:gap-12 py-4 md:py-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          {[
            { label: "活跃用户", value: "240万+" },
            { label: "精选课程", value: "800+" },
            { label: "用户好评", value: "4.9★" },
          ].map((stat) => (
            <div key={stat.label} className="hidden sm:block">
              <div className="text-base md:text-lg font-semibold text-foreground">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 tracking-wide">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 探索更多 — 底部绝对居中 */}
      <motion.button
        onClick={onScrollDown}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">探索更多</span>
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
      title: "AI 灵息陪伴",
      description: "专属 AI 闺蜜教练，懂你的生理期、理解你的情绪，用最温柔的方式迎接每一天。语音/文字早晚问候，今日轻量目标展示。",
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
      description: "普拉提、瑜伽、经期舒缓、冥想助眠。AI 视觉实时纠错，流光线条温柔指引你的每一个动作。动作到位时，花瓣绽放作为正向反馈。",
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
      description: "维度数据可视化、贝塞尔曲线记录蜕变轨迹。数字衣橱与成就徽章，用运动获得的轻息币兑换好看的虚拟装扮。",
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/4 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">四大核心模块</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">功能 · 04</span>
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
                <div className="flex items-center gap-3 md:gap-10 py-5 md:py-9 cursor-pointer">
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
                </div>
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
      large: true,
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
    },
    {
      title: "助眠冥想与呼吸",
      description: "月光般温柔的引导，让每一次呼吸都成为治愈",
      icon: (
        <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
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
    },
  ]

  return (
    <section className="relative py-14 md:py-28 px-4 md:px-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-secondary/4" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">为你量身定制的温柔功能</h2>
          <span className="text-muted-foreground/40 text-xs font-mono tracking-widest">特色 · 06</span>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              className={`glass rounded-2xl p-5 md:p-6 flex flex-col gap-4 ${
                item.large ? "col-span-2 md:col-span-1 md:row-span-2" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              whileHover={{ scale: 1.025, y: -4 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1.5 text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/4 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="flex items-baseline justify-between pb-5 border-b border-border/30 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl md:text-2xl font-medium text-foreground">全球花间塑社区</h2>
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lilac/8 to-transparent" />

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
              花间塑
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
            花间塑摒弃了传统健身 App 的硬核数据和高压训练，用柔和的色彩、温暖的 AI 陪伴、精准的体态纠正，打造一个属于你的专属健身空间。
          </motion.p>
          <motion.p
            className="text-foreground/65 leading-loose text-sm md:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            在这里，你不需要和任何人比较，只需要成为更好的自己。每一次练习都是一朵花开，每一滴汗水都是最美的蜕变。
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
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

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
          告诉 AI 教练你的想法，让我们一起开始这段旅程
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
          <div className="relative flex items-center gap-3 bg-card rounded-full px-6 py-4">
            <input
              type="text"
              placeholder="告诉 AI 教练你今天想怎么动..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <Link href="/home">
              <motion.button
                className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground flex-shrink-0"
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

// ── 主页面 ─────────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<"hero" | "content">("hero")
  const touchStartY = useRef(0)
  const busy = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

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
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop === 0 && e.touches[0].clientY - touchStartY.current > 40) goToHero()
    }
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [mounted, phase])

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />
  }

  return (
    <div className="h-screen overflow-hidden relative">
      <GrainOverlay />
      <BackgroundEffects density="light" />
      <Navigation />

      <AnimatePresence mode="wait">
        {phase === "hero" ? (
          <motion.div
            key="hero"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 20 }}
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
            className="absolute inset-0 overflow-y-auto bg-background"
            initial={{ opacity: 0, y: 100, rotateX: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center bottom", transformPerspective: 1400 }}
          >
            {/* 返回按钮 */}
            <div className="sticky top-0 z-20 flex justify-center pt-20 pointer-events-none">
              <motion.button
                onClick={goToHero}
                className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full glass-strong text-xs text-muted-foreground hover:text-foreground transition-colors shadow-sm"
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

            <div className="-mt-16">
              <FeaturesSection />
              <HighlightsSection />
              <CommunitySection />
              <AboutSection />
              <CTASection />
              <Footer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
