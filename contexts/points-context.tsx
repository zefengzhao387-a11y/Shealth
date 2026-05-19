"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-context'

interface Reward {
  amount: number
  reason: string
}

interface PointsContextType {
  totalPoints: number
  streak: number
  totalMinutes: number
  todayCheckedIn: boolean
  reward: Reward | null
  addPoints: (amount: number, reason: string, meta?: {
    courseId?: string; courseTitle?: string; durationMinutes?: number
  }) => Promise<void>
  dismissReward: () => void
  recordCheckin: () => Promise<boolean>
  refreshStats: () => Promise<void>
  unlockedAchievements: string[]
  newAchievement: string | null
  dismissAchievement: () => void
}

const PointsContext = createContext<PointsContextType | null>(null)

// 成就解锁条件
const ACHIEVEMENT_CONDITIONS: Record<string, (pts: number, streak: number, mins: number, workoutCount: number) => boolean> = {
  first_workout:       (_, __, ___, count) => count >= 1,
  hundred_points:      (pts) => pts >= 100,
  five_hundred_points: (pts) => pts >= 500,
  thousand_points:     (pts) => pts >= 1000,
  week_streak:         (_, streak) => streak >= 7,
  month_streak:        (_, streak) => streak >= 30,
  hour_total:          (_, __, mins) => mins >= 60,
  ten_hours_total:     (_, __, mins) => mins >= 600,
  ten_workouts:        (_, __, ___, count) => count >= 10,
}

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [totalPoints, setTotalPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [todayCheckedIn, setTodayCheckedIn] = useState(false)
  const [reward, setReward] = useState<Reward | null>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState<string | null>(null)
  const workoutCountRef = useRef(0)

  const refreshStats = useCallback(async () => {
    if (!user) return

    const [workoutsRes, checkinsRes, achievementsRes] = await Promise.all([
      supabase.from('workouts').select('points_earned, duration_minutes, course_id').eq('user_id', user.id),
      supabase.from('checkins').select('checked_in_at').eq('user_id', user.id).order('checked_in_at', { ascending: false }),
      supabase.from('achievements').select('achievement_id').eq('user_id', user.id),
    ])

    if (workoutsRes.data) {
      const pts = workoutsRes.data.reduce((s, w) => s + (w.points_earned || 0), 0)
      const mins = workoutsRes.data.reduce((s, w) => s + (w.duration_minutes || 0), 0)
      setTotalPoints(pts)
      setTotalMinutes(mins)
      workoutCountRef.current = workoutsRes.data.filter(w => w.course_id !== 'checkin').length
    }

    if (checkinsRes.data) {
      // Calculate streak
      let s = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      for (const c of checkinsRes.data) {
        const d = new Date(c.checked_in_at)
        d.setHours(0, 0, 0, 0)
        const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
        if (diff === s) s++
        else break
      }
      setStreak(s)

      // Check today
      const todayStr = new Date().toISOString().split('T')[0]
      setTodayCheckedIn(checkinsRes.data.some(c => c.checked_in_at === todayStr))
    }

    if (achievementsRes.data) {
      setUnlockedAchievements(achievementsRes.data.map(a => a.achievement_id))
    }
  }, [user])

  useEffect(() => {
    if (user) refreshStats()
    else {
      setTotalPoints(0); setStreak(0); setTotalMinutes(0)
      setTodayCheckedIn(false); setUnlockedAchievements([])
    }
  }, [user, refreshStats])

  const checkAndUnlock = useCallback(async (pts: number, str: number, mins: number, count: number) => {
    if (!user) return
    const { data: existing } = await supabase.from('achievements').select('achievement_id').eq('user_id', user.id)
    const existingIds = new Set(existing?.map(a => a.achievement_id) ?? [])

    for (const [id, check] of Object.entries(ACHIEVEMENT_CONDITIONS)) {
      if (!existingIds.has(id) && check(pts, str, mins, count)) {
        await supabase.from('achievements').insert({ user_id: user.id, achievement_id: id })
        setUnlockedAchievements(prev => [...prev, id])
        setNewAchievement(id)
        break // show one at a time
      }
    }
  }, [user])

  const addPoints = useCallback(async (
    amount: number,
    reason: string,
    meta?: { courseId?: string; courseTitle?: string; durationMinutes?: number }
  ) => {
    const newPts = totalPoints + amount
    const newMins = totalMinutes + (meta?.durationMinutes ?? 0)
    setTotalPoints(newPts)
    setTotalMinutes(newMins)
    setReward({ amount, reason })
    setTimeout(() => setReward(null), 4000)

    if (user && meta?.courseId) {
      workoutCountRef.current += 1
      await supabase.from('workouts').insert({
        user_id: user.id,
        course_id: meta.courseId,
        course_title: meta.courseTitle ?? '',
        duration_minutes: meta.durationMinutes ?? 0,
        points_earned: amount,
      })
    }

    await checkAndUnlock(newPts, streak, newMins, workoutCountRef.current)
  }, [user, totalPoints, totalMinutes, streak, checkAndUnlock])

  const recordCheckin = useCallback(async () => {
    if (!user || todayCheckedIn) return false
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('checkins').insert({ user_id: user.id, checked_in_at: today })
    if (!error) {
      setTodayCheckedIn(true)
      const newStreak = streak + 1
      setStreak(newStreak)
      // Persist checkin points to workouts table so they survive page refresh
      await supabase.from('workouts').insert({
        user_id: user.id,
        course_id: 'checkin',
        course_title: '每日打卡',
        duration_minutes: 0,
        points_earned: 10,
      })
      await addPoints(10, '每日打卡')
      return true
    }
    return false
  }, [user, todayCheckedIn, streak, addPoints])

  return (
    <PointsContext.Provider value={{
      totalPoints, streak, totalMinutes, todayCheckedIn,
      reward, addPoints, dismissReward: () => setReward(null),
      recordCheckin, refreshStats,
      unlockedAchievements, newAchievement,
      dismissAchievement: () => setNewAchievement(null),
    }}>
      {children}
    </PointsContext.Provider>
  )
}

export function usePoints() {
  const ctx = useContext(PointsContext)
  if (!ctx) throw new Error('usePoints must be used within PointsProvider')
  return ctx
}
