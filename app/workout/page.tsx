"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/shared/navigation"
import { Petal, BackgroundEffects } from "@/components/shared/effects"
import { useAuth } from "@/contexts/auth-context"
import { usePoints } from "@/contexts/points-context"
import { TAP_SPRING } from "@/lib/motion-presets"

type CourseCategory = "all" | "pilates" | "yoga" | "period" | "meditation"

interface Course {
  id: string
  title: string
  subtitle: string
  category: CourseCategory
  durationMinutes: number
  difficulty: "入门" | "进阶" | "轻柔"
  instructor: string
  points: number
  thumbnail: string
  gradient: string
  description: string
  steps: string[]
}

const courses: Course[] = [
  {
    id: "1", title: "晨间唤醒普拉提", subtitle: "激活全身能量",
    category: "pilates", durationMinutes: 15, difficulty: "入门",
    instructor: "Flora 教练", points: 30,
    thumbnail: "from-peach/50 to-primary/40", gradient: "from-peach/30 to-primary/20",
    description: "用温柔的普拉提动作唤醒沉睡的肌肉，为新的一天注入能量。",
    steps: ["深呼吸预热 2 分钟", "骨盆中立位练习", "腹部核心激活", "侧卧腿部练习", "脊柱伸展收尾"],
  },
  {
    id: "2", title: "办公室肩颈舒缓", subtitle: "缓解久坐疲劳",
    category: "yoga", durationMinutes: 10, difficulty: "入门",
    instructor: "Luna 教练", points: 20,
    thumbnail: "from-lilac/50 to-secondary/40", gradient: "from-lilac/30 to-secondary/20",
    description: "专为久坐人群设计，重点舒缓肩颈压力，改善血液循环。",
    steps: ["颈部侧伸展", "肩部绕环运动", "胸腔扩展", "背部猫牛式", "放松冥想"],
  },
  {
    id: "3", title: "经期温和伸展", subtitle: "温柔呵护身心",
    category: "period", durationMinutes: 20, difficulty: "轻柔",
    instructor: "Flora 教练", points: 35,
    thumbnail: "from-primary/50 to-peach/40", gradient: "from-primary/30 to-peach/20",
    description: "经期专属课程，用温柔的动作缓解经期不适，给身体最好的呵护。",
    steps: ["卧姿深呼吸", "膝盖轻柔画圈", "蝴蝶式伸展", "婴儿式放松", "仰卧扭转"],
  },
  {
    id: "4", title: "深度睡眠冥想", subtitle: "安抚疲惫的心",
    category: "meditation", durationMinutes: 25, difficulty: "入门",
    instructor: "Mist 教练", points: 40,
    thumbnail: "from-sage/50 to-accent/40", gradient: "from-sage/30 to-accent/20",
    description: "睡前专属冥想引导，帮助放空思绪，进入深度睡眠状态。",
    steps: ["身体扫描放松", "腹式呼吸练习", "正念冥想引导", "想象海浪意象", "渐进式入眠"],
  },
  {
    id: "5", title: "核心塑形普拉提", subtitle: "雕塑腰腹线条",
    category: "pilates", durationMinutes: 30, difficulty: "进阶",
    instructor: "Flora 教练", points: 60,
    thumbnail: "from-secondary/50 to-lilac/40", gradient: "from-secondary/30 to-lilac/20",
    description: "针对核心肌群的进阶普拉提课程，有效塑造腰腹线条。",
    steps: ["核心预热激活", "百次练习", "单腿拉伸系列", "侧卧腿部训练", "游泳式练习", "脊柱放松收尾"],
  },
  {
    id: "6", title: "阴瑜伽深度放松", subtitle: "释放深层紧张",
    category: "yoga", durationMinutes: 40, difficulty: "入门",
    instructor: "Luna 教练", points: 65,
    thumbnail: "from-accent/50 to-sage/40", gradient: "from-accent/30 to-sage/20",
    description: "长时间保持体式，深入释放筋膜和关节的紧张感。",
    steps: ["蝴蝶式 5 分钟", "鸽子式左右各 5 分钟", "方块式 5 分钟", "婴儿式放松", "挺尸式冥想"],
  },
  {
    id: "7", title: "呼吸调节练习", subtitle: "平衡自律神经",
    category: "meditation", durationMinutes: 15, difficulty: "入门",
    instructor: "Mist 教练", points: 25,
    thumbnail: "from-peach/50 to-lilac/40", gradient: "from-peach/30 to-lilac/20",
    description: "通过科学的呼吸练习调节自律神经，缓解焦虑紧张。",
    steps: ["4-7-8 呼吸法", "箱式呼吸练习", "交替鼻孔呼吸", "横膈膜呼吸", "正念觉察收尾"],
  },
  {
    id: "8", title: "骨盆底肌修复", subtitle: "产后功能恢复",
    category: "period", durationMinutes: 20, difficulty: "轻柔",
    instructor: "Flora 教练", points: 35,
    thumbnail: "from-primary/50 to-secondary/40", gradient: "from-primary/30 to-secondary/20",
    description: "专为骨盆底肌修复设计，温柔而有效，适合产后及久坐人群。",
    steps: ["骨盆感知练习", "Kegel 基础训练", "髋部灵活练习", "腹横肌激活", "放松整合"],
  },
]

const categories = [
  { id: "all", label: "全部", emoji: "✨" },
  { id: "pilates", label: "普拉提", emoji: "🌸" },
  { id: "yoga", label: "瑜伽", emoji: "🧘" },
  { id: "period", label: "经期舒缓", emoji: "🌙" },
  { id: "meditation", label: "冥想助眠", emoji: "🌊" },
]

// 格式化秒数
function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function CategoryTabs({ active, onChange }: { active: CourseCategory; onChange: (c: CourseCategory) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
      {categories.map((cat) => {
        const isActive = active === cat.id
        return (
          <motion.button
            key={cat.id}
            className={`min-h-12 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all snap-start touch-target ${
              isActive
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm"
                : "glass text-muted-foreground active:bg-white/50 active:text-foreground"
            }`}
            onClick={() => onChange(cat.id as CourseCategory)}
            whileTap={TAP_SPRING}
            aria-pressed={isActive}
          >
            {cat.label}
          </motion.button>
        )
      })}
    </div>
  )
}

function CourseCard({ course, index, onClick }: { course: Course; index: number; onClick: () => void }) {
  return (
    <motion.div
      className={`group relative rounded-3xl overflow-hidden cursor-pointer bg-gradient-to-br ${course.gradient} premium-card card-lift`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileTap={TAP_SPRING}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`开始课程：${course.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* 封面 */}
      <div className={`aspect-[4/3] bg-gradient-to-br ${course.thumbnail} relative overflow-hidden`}>
        {/* 装饰圆 */}
        <motion.div
          className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/12"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 难度 + 积分 */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-[11px] text-white/90 font-medium">
            {course.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-sm text-[11px] text-foreground font-semibold">
            +{course.points}分
          </span>
        </div>
        {/* 时长 */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm">
          <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[11px] text-white/90">{course.durationMinutes} 分钟</span>
        </div>
        {/* 播放按钮 — 移动端始终可见 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center shadow-md"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
          >
            <svg className="w-5 h-5 text-primary ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* 信息 */}
      <div className="p-3.5">
        <h3 className="font-medium text-[14px] text-foreground mb-0.5 truncate">{course.title}</h3>
        <p className="text-[12px] text-muted-foreground truncate">{course.subtitle}</p>
        <div className="divider-fade my-2" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{course.instructor}</span>
            <span className="chip bg-primary/10 text-primary">{categories.find(c => c.id === course.category)?.label ?? ""}</span>
        </div>
      </div>
    </motion.div>
  )
}

// 课程详情 + 播放器
function WorkoutPlayer({ course, onClose }: { course: Course; onClose: () => void }) {
  const { user, openAuthModal } = useAuth()
  const { addPoints } = usePoints()

  const totalSecs = course.durationMinutes * 60
  const [phase, setPhase] = useState<'detail' | 'playing' | 'paused' | 'done'>('detail')
  const [elapsed, setElapsed] = useState(0)
  const [poseAccuracy, setPoseAccuracy] = useState(82)
  const [showPIP, setShowPIP] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 模拟动作准确度波动
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => {
      setPoseAccuracy(prev => Math.max(60, Math.min(98, prev + (Math.random() - 0.4) * 5)))
    }, 2000)
    return () => clearInterval(t)
  }, [phase])

  // 计时器
  useEffect(() => {
    if (phase === 'playing') {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= totalSecs) {
            clearInterval(intervalRef.current!)
            setPhase('done')
            return totalSecs
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, totalSecs])

  const handleStart = () => {
    if (!user) { openAuthModal(); return }
    setPhase('playing')
  }

  const handleComplete = async () => {
    if (rewarded) return
    setRewarded(true)
    setPhase('done')
    if (intervalRef.current) clearInterval(intervalRef.current)
    await addPoints(course.points, `完成「${course.title}」`, {
      courseId: course.id,
      courseTitle: course.title,
      durationMinutes: Math.round(elapsed / 60) || 1,
    })
  }

  const progress = elapsed / totalSecs
  const currentStep = Math.min(
    Math.floor(progress * course.steps.length),
    course.steps.length - 1
  )

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 顶部栏 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <motion.button className="w-10 h-10 rounded-full glass flex items-center justify-center" onClick={onClose} whileTap={{ scale: 0.9 }}>
          <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.instructor}</p>
        </div>
        {phase === 'playing' || phase === 'paused' ? (
          <motion.button
            className={`w-10 h-10 rounded-full flex items-center justify-center ${showPIP ? 'bg-primary text-primary-foreground' : 'glass'}`}
            onClick={() => setShowPIP(!showPIP)} whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><rect x="12" y="10" width="8" height="6" rx="1" /></svg>
          </motion.button>
        ) : <div className="w-10" />}
      </div>

      {/* 详情视图 */}
      {phase === 'detail' && (
        <div className="h-full overflow-y-auto pt-24 md:pt-16 pb-8 px-4">
          <div className="max-w-lg mx-auto">
            {/* 封面 */}
            <motion.div
              className={`aspect-[16/9] rounded-3xl bg-gradient-to-br ${course.thumbnail} relative overflow-hidden mb-6`}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center text-white/90">
                  <p className="text-4xl font-bold mb-1">{course.durationMinutes}'</p>
                  <p className="text-sm">{course.difficulty}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm text-xs text-white font-medium">
                +{course.points} 运动分
              </div>
            </motion.div>

            <motion.h2 className="text-2xl font-medium text-foreground mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {course.title}
            </motion.h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{course.description}</p>

            {/* 课程步骤 */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-foreground mb-3">课程内容</h3>
              <div className="space-y-2">
                {course.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl glass"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-base relative overflow-hidden"
              onClick={handleStart}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ boxShadow: "0 8px 25px rgba(255,182,193,0.4)" }}
            >
              <motion.span className="absolute inset-0 rounded-2xl bg-white/20" initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="relative z-10">{user ? '开始训练' : '登录后开始训练'}</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* 播放/暂停视图 */}
      {(phase === 'playing' || phase === 'paused') && (
        <>
          {/* 背景 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${course.thumbnail} opacity-30`} />

          {/* 当前步骤显示 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <p className="text-xs text-muted-foreground mb-2">当前步骤 {currentStep + 1}/{course.steps.length}</p>
              <p className="text-2xl font-medium text-foreground">{course.steps[currentStep]}</p>
            </motion.div>

            {/* 计时圆环 */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="url(#timerGrad)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFB6C1" />
                    <stop offset="100%" stopColor="#DDA0DD" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{fmtTime(elapsed)}</p>
                <p className="text-xs text-muted-foreground">{fmtTime(totalSecs)}</p>
              </div>
            </div>
          </div>

          {/* PIP 摄像头小窗 */}
          <AnimatePresence>
            {showPIP && (
              <motion.div
                className="absolute top-20 right-4 w-32 h-44 rounded-2xl overflow-hidden glass"
                initial={{ opacity: 0, scale: 0.8, x: 50 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 50 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="10" r="3" /><path d="M6 21v-1a6 6 0 0 1 12 0v1" />
                  </svg>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.path d="M64 30 L64 50 L54 70 L64 90 L74 70 L64 50" stroke="url(#sg)" strokeWidth="2" fill="none" filter="url(#gf)"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }} />
                  <defs>
                    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#DDA0DD" /></linearGradient>
                    <filter id="gf"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>
                </svg>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <div className="px-2 py-1 rounded-full bg-white/30 text-xs">
                    准确度 <span className="text-primary font-medium">{Math.round(poseAccuracy)}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 花瓣特效 */}
          {poseAccuracy >= 90 && [...Array(4)].map((_, i) => (
            <Petal key={i} delay={i * 0.5} x={20 + i * 20} size="sm" />
          ))}

          {/* 底部控制 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 glass">
            <div className="flex items-center justify-center gap-6 mb-4">
              <motion.button
                className="w-14 h-14 rounded-full glass flex items-center justify-center"
                onClick={() => setPhase(phase === 'playing' ? 'paused' : 'playing')}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              >
                {phase === 'playing' ? (
                  <svg className="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-foreground ml-1" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                )}
              </motion.button>

              <motion.button
                className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm"
                onClick={handleComplete}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{ boxShadow: "0 4px 20px rgba(255,182,193,0.4)" }}
              >
                完成训练 +{course.points}分
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* 完成视图 */}
      {phase === 'done' && (
        <div className="h-full flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6"
            style={{ boxShadow: "0 0 60px rgba(255,182,193,0.5)" }}
          >
            <svg className="w-14 h-14 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          {[...Array(8)].map((_, i) => (
            <Petal key={i} delay={i * 0.3} x={(i * 12.5) % 100} size={["sm", "md"][i % 2] as "sm" | "md"} />
          ))}

          <motion.h2 className="text-2xl font-medium text-foreground mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            训练完成！
          </motion.h2>
          <motion.p className="text-muted-foreground mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            坚持了 {Math.round(elapsed / 60)} 分钟
          </motion.p>
          <motion.div
            className="px-6 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground font-medium mb-8"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
          >
            +{course.points} 运动分已入账
          </motion.div>

          <motion.button
            className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium"
            onClick={onClose}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          >
            返回课程列表
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

function TodayRecommend({ onStart }: { onStart: (c: Course) => void }) {
  const recommend = courses[2]
  return (
    <motion.div className="mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h2 className="text-[15px] font-semibold text-foreground">今日推荐</h2>
        <span className="chip bg-primary/10 text-primary">AI 智能推荐 ✨</span>
      </div>
      <motion.div
        className={`relative rounded-3xl overflow-hidden cursor-pointer bg-gradient-to-br ${recommend.thumbnail}`}
        style={{ boxShadow: "0 10px 36px rgba(255,182,193,0.28), 0 2px 0 rgba(255,255,255,0.6) inset" }}
        whileHover={{ scale: 1.01 }}
        whileTap={TAP_SPRING}
        onClick={() => onStart(recommend)}
        role="button"
        tabIndex={0}
        aria-label={`今日推荐：${recommend.title}`}
        onKeyDown={(e) => e.key === "Enter" && onStart(recommend)}
      >
        {/* 装饰背景圆 */}
        <motion.div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15"
          animate={{ scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative p-4 md:p-5">
          <div className="flex items-center gap-4">
            {/* 封面缩略 */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <motion.div
                  className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center shadow-md"
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg className="w-6 h-6 text-primary ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </motion.div>
              </div>
              {/* 脉冲圆 */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-white/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[16px] text-foreground/95 mb-1 truncate">{recommend.title}</h3>
              <p className="text-xs text-foreground/65 mb-2.5">{recommend.subtitle} · {recommend.instructor}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="chip bg-white/40 text-foreground/80">⏱ {recommend.durationMinutes} 分钟</span>
                <span className="chip bg-white/40 text-foreground/80">🎯 {recommend.difficulty}</span>
                <span className="chip bg-primary/20 text-primary font-semibold">+{recommend.points} 运动分</span>
              </div>
            </div>
          </div>

          {/* 底部进度条装饰 */}
          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <motion.div
                className="h-full bg-white/70 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] text-foreground/60 whitespace-nowrap">适合你的水平</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function WorkoutPage() {
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CourseCategory>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />

  const filtered = activeCategory === "all" ? courses : courses.filter(c => c.category === activeCategory)

  return (
    <main className="relative min-h-screen pb-[calc(env(safe-area-inset-bottom,0px)+7.5rem)] md:pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
      <BackgroundEffects density="light" />
      <Navigation />

      <div className="relative z-10 pt-24 md:pt-20 mobile-shell">
        <div className="max-w-2xl mx-auto">
          <motion.div className="mb-5 md:mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="fluid-title font-medium text-foreground tracking-tight">悦动专区</h1>
            <p className="text-sm text-muted-foreground mt-1">选择一个课程，开始今天的练习</p>
          </motion.div>

          <TodayRecommend onStart={setSelectedCourse} />

          <div className="mb-6">
            <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
          </div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((course, i) => (
                <motion.div key={course.id} layout>
                  <CourseCard course={course} index={i} onClick={() => setSelectedCourse(course)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <WorkoutPlayer course={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </AnimatePresence>

    </main>
  )
}
