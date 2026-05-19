'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CommunityUser {
  id: number
  name: string
  avatar: string
  streak: number
  achievement: string
  gradient: string
}

export function CommunityShowcase() {
  const [users, setUsers] = useState<CommunityUser[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mockUsers: CommunityUser[] = [
      {
        id: 1,
        name: '小花花',
        avatar: '👩‍🦰',
        streak: 45,
        achievement: '坚持达人',
        gradient: 'from-pink-300 to-rose-300',
      },
      {
        id: 2,
        name: '蜜桃小姐',
        avatar: '👩‍🌾',
        streak: 32,
        achievement: '瑜伽高手',
        gradient: 'from-peach/40 to-orange-300',
      },
      {
        id: 3,
        name: '紫兰梦',
        avatar: '👩‍🎨',
        streak: 28,
        achievement: '社区明星',
        gradient: 'from-lilac/40 to-purple-300',
      },
      {
        id: 4,
        name: '丽莎',
        avatar: '👩‍💼',
        streak: 21,
        achievement: '新星闪耀',
        gradient: 'from-sage/40 to-emerald-300',
      },
      {
        id: 5,
        name: '林夕',
        avatar: '👩‍🔬',
        streak: 18,
        achievement: '数据之星',
        gradient: 'from-primary/40 to-blue-300',
      },
      {
        id: 6,
        name: '樱花',
        avatar: '🧘‍♀️',
        streak: 15,
        achievement: '冥想大师',
        gradient: 'from-secondary/40 to-violet-300',
      },
    ]
    setUsers(mockUsers)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          ✨ 本周闪耀明星
        </h3>
        <p className="text-sm text-muted-foreground">
          和她们一起享受运动的快乐
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            className={`glass rounded-2xl p-4 bg-gradient-to-br ${user.gradient} text-center cursor-pointer`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{
              scale: 1.08,
              y: -5,
            }}
          >
            {/* 头像 */}
            <motion.div
              className="text-4xl md:text-5xl mb-2"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
            >
              {user.avatar}
            </motion.div>

            {/* 用户信息 */}
            <h4 className="font-semibold text-sm md:text-base text-foreground truncate">
              {user.name}
            </h4>

            {/* 连续打卡 */}
            <motion.div
              className="inline-block mt-2 px-2 py-1 rounded-full bg-white/20 text-xs font-bold text-foreground"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            >
              🔥 {user.streak} 天
            </motion.div>

            {/* 成就标签 */}
            <div className="mt-2 text-xs text-muted-foreground bg-black/10 rounded-lg py-1 px-2">
              {user.achievement}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 底部激励文案 */}
      <motion.div
        className="text-center py-4 px-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <p className="text-sm text-foreground">
          💝 <span className="font-semibold">加入她们的行列</span>，一起蜕变成更好的自己！
        </p>
      </motion.div>
    </div>
  )
}
