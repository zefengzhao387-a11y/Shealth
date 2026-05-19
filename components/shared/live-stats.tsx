'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface LiveStats {
  activeUsers: number
  totalMinutes: number
  achievements: number
  streak: number
}

export function LiveStatsBoard() {
  const [stats, setStats] = useState<LiveStats>({
    activeUsers: 0,
    totalMinutes: 0,
    achievements: 0,
    streak: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 初始值
    setStats({
      activeUsers: Math.floor(Math.random() * 500) + 1200,
      totalMinutes: Math.floor(Math.random() * 50000) + 150000,
      achievements: Math.floor(Math.random() * 10) + 45,
      streak: Math.floor(Math.random() * 100) + 200,
    })

    // 模拟实时更新
    const interval = setInterval(() => {
      setStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        totalMinutes: prev.totalMinutes + Math.floor(Math.random() * 100),
        achievements: prev.achievements + (Math.random() > 0.7 ? 1 : 0),
        streak: prev.streak + Math.floor(Math.random() * 5),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const statItems = [
    {
      label: '在线用户',
      value: stats.activeUsers.toLocaleString(),
      icon: '👥',
      gradient: 'from-primary/20 to-primary/10',
    },
    {
      label: '总运动时长',
      value: (stats.totalMinutes / 60).toFixed(0) + 'h',
      icon: '⏱️',
      gradient: 'from-secondary/20 to-secondary/10',
    },
    {
      label: '已解锁成就',
      value: stats.achievements,
      icon: '🏆',
      gradient: 'from-accent/20 to-accent/10',
    },
    {
      label: '连续打卡',
      value: stats.streak,
      icon: '🔥',
      gradient: 'from-lilac/20 to-lilac/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {statItems.map((item, i) => (
        <motion.div
          key={item.label}
          className={`glass rounded-xl p-3 md:p-4 bg-gradient-to-br ${item.gradient} backdrop-blur-sm`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <div className="text-2xl mb-2">{item.icon}</div>
          <motion.div
            className="text-xl md:text-2xl font-bold text-foreground"
            key={item.value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {item.value}
          </motion.div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
