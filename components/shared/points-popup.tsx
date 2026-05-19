"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePoints } from "@/contexts/points-context"

// 成就名称映射
const ACHIEVEMENT_NAMES: Record<string, { name: string; desc: string; icon: string }> = {
  first_workout:       { name: "初绽", desc: "完成了第一次训练！", icon: "🌸" },
  hundred_points:      { name: "积累", desc: "累计获得 100 运动分！", icon: "✨" },
  five_hundred_points: { name: "绽放", desc: "累计获得 500 运动分！", icon: "🌺" },
  thousand_points:     { name: "满园", desc: "累计获得 1000 运动分！", icon: "🎊" },
  week_streak:         { name: "坚持", desc: "连续打卡 7 天！", icon: "🌟" },
  month_streak:        { name: "蜕变", desc: "连续打卡 30 天！", icon: "👑" },
  hour_total:          { name: "初心", desc: "累计运动 60 分钟！", icon: "💪" },
  ten_hours_total:     { name: "花开", desc: "累计运动 600 分钟！", icon: "🏵️" },
  ten_workouts:        { name: "勤勉", desc: "完成 10 次训练！", icon: "🎯" },
}

export function PointsPopup() {
  const { reward, dismissReward, newAchievement, dismissAchievement } = usePoints()

  return (
    <>
      {/* 运动分获得弹窗 */}
      <AnimatePresence>
        {reward && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
              style={{ boxShadow: "0 8px 30px rgba(255,182,193,0.5)" }}
            >
              {/* 粒子爆炸 */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i / 6) * Math.PI * 2) * 40,
                    y: Math.sin((i / 6) * Math.PI * 2) * 40,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                />
              ))}

              <motion.span
                className="text-2xl font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.3, 1] }}
                transition={{ duration: 0.4 }}
              >
                +{reward.amount}
              </motion.span>
              <div>
                <p className="text-sm font-medium leading-none">运动分</p>
                <p className="text-xs opacity-80 mt-0.5">{reward.reason}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 成就解锁弹窗 */}
      <AnimatePresence>
        {newAchievement && ACHIEVEMENT_NAMES[newAchievement] && (
          <motion.div
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] cursor-pointer"
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={dismissAchievement}
          >
            <div className="relative px-6 py-4 rounded-3xl bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm text-primary-foreground shadow-2xl text-center min-w-[240px]"
              style={{ boxShadow: "0 12px 40px rgba(255,182,193,0.5)" }}
            >
              {/* 光晕 */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-white/20"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1.5, repeat: 2 }}
              />

              <motion.div
                className="text-4xl mb-2"
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8 }}
              >
                {ACHIEVEMENT_NAMES[newAchievement].icon}
              </motion.div>
              <p className="text-xs opacity-80 mb-1">🏆 成就解锁</p>
              <p className="font-bold text-lg">{ACHIEVEMENT_NAMES[newAchievement].name}</p>
              <p className="text-xs opacity-80 mt-1">{ACHIEVEMENT_NAMES[newAchievement].desc}</p>
              <p className="text-xs opacity-60 mt-2">点击关闭</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
