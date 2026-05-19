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

// AI 教练互动区
function AICoachArea() {
  return (
    <motion.div
      className="relative w-64 h-64 md:w-80 md:h-80"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
    >
      {/* 外层光环 */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* 中层毛玻璃 */}
      <div className="absolute inset-4 glass rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* 核心区域 - VRM 3D 教练 */}
      <motion.div
        className="absolute inset-2 rounded-full overflow-hidden"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <VRMCoach view="circle" />
        {/* 呼吸光晕叠加 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-secondary/10 pointer-events-none"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      
      {/* 在线状态标签 */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full glass-strong text-xs text-foreground flex items-center gap-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        AI 教练在线
      </motion.div>
      
      {/* 散落的光点 */}
      {[...Array(8)].map((_, i) => (
        <Sparkle
          key={i}
          x={20 + (i % 4) * 20}
          y={20 + Math.floor(i / 4) * 60}
          delay={i * 0.3}
        />
      ))}
    </motion.div>
  )
}

// Hero 区 CTA 按钮
function HeroButton() {
  return (
    <Link href="/home">
      <motion.button
        className="relative group px-8 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium overflow-hidden"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {/* 水波纹效果 */}
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
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
        />
        
        {/* 发光效果 */}
        <motion.span
          className="absolute inset-0 rounded-full animate-pulse-glow"
        />
        
        <span className="relative z-10 flex items-center gap-2">
          开启花间之旅
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </span>
      </motion.button>
    </Link>
  )
}

// Hero 区
function HeroSection({ onScrollDown }: { onScrollDown: () => void }) {
  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
      {/* 流动渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 animate-gradient" />

      {/* 飘落的花瓣 */}
      {[...Array(12)].map((_, i) => (
        <Petal
          key={i}
          delay={i * 1.5}
          x={(i * 8.3) % 100}
          size={["sm", "md", "lg"][i % 3] as "sm" | "md" | "lg"}
        />
      ))}

      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* 左侧文案 */}
        <motion.div
          className="text-center md:text-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span className="font-brand text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block mb-2">
              花间塑
            </span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold ml-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FloraMotion
            </span>
            <br />
            <span className="text-foreground/80 text-2xl md:text-3xl lg:text-4xl">
              你的专属 AI 闺蜜教练
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-muted-foreground max-w-md mx-auto md:mx-0 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            懂你每一个阶段的身体节奏，用最温柔的方式陪伴你变得更好。
            如花般绽放，如风般轻盈。
          </motion.p>

          <div className="mt-8">
            <HeroButton />
          </div>
        </motion.div>

        {/* 右侧 AI 教练区 */}
        <div className="flex justify-center">
          <AICoachArea />
        </div>
      </div>

      {/* 向下滚动提示 */}
      <motion.button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span className="text-xs tracking-widest">探索更多</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </motion.button>
    </div>
  )
}

// 特色功能卡片
function FeatureCard({ 
  title, 
  description, 
  icon, 
  delay,
  gradient,
  href
}: { 
  title: string
  description: string
  icon: React.ReactNode
  delay: number
  gradient: string
  href: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={href}>
      <motion.div
        className={`relative p-6 md:p-8 rounded-3xl glass overflow-hidden cursor-pointer h-full ${gradient}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -5 }}
      >
        <Ripple isActive={isHovered} />
        
        <motion.div
          className="relative z-10"
          animate={isHovered ? { y: -3 } : { y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4"
            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.div>
          
          <h3 className="text-lg md:text-xl font-medium mb-2 text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>
      </motion.div>
    </Link>
  )
}

// 特色功能区 - 四大核心模块
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
      gradient: "bg-gradient-to-br from-peach/30 to-transparent",
      href: "/home"
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
      gradient: "bg-gradient-to-br from-lilac/30 to-transparent",
      href: "/workout"
    },
    {
      title: "繁花社区",
      description: "分享穿搭、健康食谱、微小的进步与蜕变故事。话题频道、微光小队组队打卡，闺蜜互相监督鼓励。送花点亮，治愈每一刻。",
      icon: (
        <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
        </svg>
      ),
      gradient: "bg-gradient-to-br from-sage/30 to-transparent",
      href: "/community"
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
      gradient: "bg-gradient-to-br from-primary/20 to-transparent",
      href: "/profile"
    }
  ]

  return (
    <section id="features" className="relative py-24 px-6 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-4">
            四大核心模块
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            每一个功能都在倾听你的需要，陪伴你如花绽放
          </p>
        </motion.div>
        
        {/* 2x2 网格 */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} delay={0.1 + i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  )
}

// 亮点功能展示
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
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-4">
            为你量身定制的温柔功能
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            每一个细节都在呵护你
          </p>
        </motion.div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              className="glass rounded-2xl p-6 flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 社群展示和数据看板
function CommunitySection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 实时数据看板 */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-3">
              🌍 全球花间塑社区
            </h2>
            <p className="text-muted-foreground">
              数百万女性正在这里一起蜕变成更好的自己
            </p>
          </div>
          <LiveStatsBoard />
        </motion.div>

        {/* 社群明星展示 */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <CommunityShowcase />
        </motion.div>
      </div>
    </section>
  )
}

// 关于我们
function AboutSection() {
  return (
    <section id="about" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lilac/10 to-transparent" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-6">
            为什么选择<span className="font-brand text-3xl md:text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mx-1">花间塑</span>？
          </h2>
          
          <div className="glass rounded-3xl p-8 md:p-12">
            <p className="text-muted-foreground leading-relaxed mb-6">
              我们理解，健身不只是消耗卡路里。对于女性来说，它更是一种自我关爱、身心治愈的过程。
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <span className="text-2xl font-medium text-foreground">花间塑</span>摒弃了传统健身 App 的硬核数据和高压训练，用柔和的色彩、温暖的 AI 陪伴、
              精准的体态纠正，打造一个属于你的专属健身空间。
            </p>
            <p className="text-foreground font-medium">
              在这里，你不需要和任何人比较，只需要成为更好的自己。
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// CTA 输入区
function CTASection() {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <section id="community" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.h2
          className="text-2xl md:text-3xl font-medium text-foreground mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          准备好开始了吗？
        </motion.h2>
        
        <motion.p
          className="text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          告诉 AI 教练你的想法，让我们一起开始这段旅程
        </motion.p>
        
        {/* 流光渐变边框输入框 */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* 流光边框 */}
          <motion.div
            className={`absolute -inset-[2px] rounded-full bg-gradient-to-r from-primary via-secondary to-accent animate-gradient ${
              isFocused ? 'opacity-100' : 'opacity-50'
            }`}
            animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative flex items-center gap-3 bg-card rounded-full px-6 py-4">
            <input
              type="text"
              placeholder="告诉 AI 教练你今天想怎么动..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            
            <Link href="/home">
              <motion.button
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  animate={{ y: [0, -2, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </motion.svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>
        
        {/* 快捷建议 */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {["放松拉伸", "经期舒缓", "睡前冥想", "普拉提塑形"].map((tag, i) => (
            <motion.button
              key={tag}
              className="px-4 py-2 rounded-full glass text-sm text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              {tag}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// 主页面组件
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'hero' | 'content'>('hero')
  const touchStartY = useRef(0)
  const busy = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // 英雄屏：监听向下滚动
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

  // 内容页顶端：监听向上滑回英雄屏（移动端）
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

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />
  }

  return (
    <div className="h-screen overflow-hidden relative">
      <BackgroundEffects density="light" />
      <Navigation />

      <AnimatePresence mode="wait">
        {phase === 'hero' ? (
          /* ── 英雄首屏 ── */
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
          /* ── 长内容页 ── */
          <motion.div
            key="content"
            ref={contentRef}
            className="absolute inset-0 overflow-y-auto"
            initial={{ opacity: 0, y: 100, rotateX: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "center bottom", transformPerspective: 1400 }}
          >
            {/* 返回英雄屏按钮（桌面端，顶部滚动到头后显示） */}
            <div className="sticky top-0 z-20 flex justify-center pt-20 pointer-events-none">
              <motion.button
                onClick={goToHero}
                className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full glass-strong text-xs text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.04 }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                回到首页
              </motion.button>
            </div>

            <div className="-mt-14">
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
