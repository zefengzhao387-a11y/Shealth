"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { TAP_SPRING } from "@/lib/motion-presets"

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const DEFAULT_CYCLE_DAYS = 28
const DEFAULT_PERIOD_DAYS = 5

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function storageKey(userId: string) {
  return `shealth_period_records_v1:${userId}`
}

function readLocalRecords(userId: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeLocalRecords(userId: string, records: Set<string>) {
  localStorage.setItem(storageKey(userId), JSON.stringify([...records].sort()))
}

function getCycleStarts(records: Set<string>) {
  const sorted = [...records].sort().map(fromDateKey)
  return sorted.filter((date, index) => index === 0 || daysBetween(sorted[index - 1], date) > 1)
}

function calculateCycleLength(starts: Date[]) {
  if (starts.length < 2) return DEFAULT_CYCLE_DAYS
  const intervals = starts.slice(1).map((date, index) => daysBetween(starts[index], date)).filter(days => days >= 20 && days <= 45)
  if (intervals.length === 0) return DEFAULT_CYCLE_DAYS
  return Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length)
}

export function PeriodTracker({ userId }: { userId: string }) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [records, setRecords] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [savingDate, setSavingDate] = useState('')
  const [localOnly, setLocalOnly] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const localRecords = new Set(readLocalRecords(userId))
      const { data, error } = await supabase
        .from('period_records')
        .select('record_date')
        .eq('user_id', userId)
        .order('record_date', { ascending: true })

      if (!active) return
      if (error) {
        setRecords(localRecords)
        setLocalOnly(true)
      } else {
        const remoteRecords = new Set((data ?? []).map(item => item.record_date as string))
        setRecords(remoteRecords)
        writeLocalRecords(userId, remoteRecords)
        setLocalOnly(false)
      }
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [userId])

  const starts = useMemo(() => getCycleStarts(records), [records])
  const cycleLength = useMemo(() => calculateCycleLength(starts), [starts])
  const latestStart = starts.at(-1) ?? null
  const nextStart = latestStart ? addDays(latestStart, cycleLength) : null
  const predictedPeriod = useMemo(() => {
    const values = new Set<string>()
    if (!nextStart) return values
    for (let index = 0; index < DEFAULT_PERIOD_DAYS; index++) values.add(dateKey(addDays(nextStart, index)))
    return values
  }, [nextStart])
  const fertileWindow = useMemo(() => {
    const values = new Set<string>()
    if (!nextStart) return values
    const ovulation = addDays(nextStart, -14)
    for (let index = -5; index <= 1; index++) values.add(dateKey(addDays(ovulation, index)))
    return values
  }, [nextStart])

  const days = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const monthDays = new Date(year, month + 1, 0).getDate()
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: monthDays }, (_, index) => new Date(year, month, index + 1)),
    ]
  }, [cursor])

  const toggleDate = useCallback(async (date: Date) => {
    const key = dateKey(date)
    if (savingDate) return
    setSavingDate(key)
    setMessage('')
    const removing = records.has(key)
    const next = new Set(records)
    if (removing) next.delete(key); else next.add(key)
    setRecords(next)
    writeLocalRecords(userId, next)

    if (!localOnly) {
      const result = removing
        ? await supabase.from('period_records').delete().eq('user_id', userId).eq('record_date', key)
        : await supabase.from('period_records').insert({ user_id: userId, record_date: key })
      if (result.error) {
        setLocalOnly(true)
        setMessage('已保存在当前设备；配置数据库后可跨设备同步')
      }
    }
    setSavingDate('')
  }, [localOnly, records, savingDate, userId])

  const nextText = nextStart
    ? `${nextStart.getMonth() + 1}月${nextStart.getDate()}日左右`
    : '记录本次经期后生成预测'

  return (
    <motion.section className="mb-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} aria-labelledby="period-title">
      <div className="mb-2.5 flex items-end justify-between px-1">
        <div>
          <h3 id="period-title" className="fluid-title font-semibold text-foreground">经期记录</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">点击日期，记录经期开始与持续时间</p>
        </div>
        <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] text-primary">周期 {cycleLength} 天</span>
      </div>

      <div className="premium-card overflow-hidden rounded-3xl border border-white/35 bg-gradient-to-br from-primary/14 via-card/80 to-secondary/14 p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/35 bg-white/35 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground">下次经期预测</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{nextText}</p>
          </div>
          <div className="rounded-2xl border border-white/35 bg-white/35 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground">已记录周期</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{starts.length} 个</p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <motion.button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/35 text-foreground" whileTap={TAP_SPRING} aria-label="上个月">‹</motion.button>
          <p className="text-sm font-semibold tracking-wide text-foreground">{cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月</p>
          <motion.button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/35 text-foreground" whileTap={TAP_SPRING} aria-label="下个月">›</motion.button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(day => <div key={day} className="py-1 text-[10px] text-muted-foreground">{day}</div>)}
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} aria-hidden />
            const key = dateKey(date)
            const recorded = records.has(key)
            const predicted = predictedPeriod.has(key) && !recorded
            const fertile = fertileWindow.has(key) && !recorded && !predicted
            const isToday = key === dateKey(today)
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => void toggleDate(date)}
                disabled={loading || savingDate === key}
                className={`relative mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  recorded ? 'bg-primary text-primary-foreground shadow-[0_5px_16px_rgba(255,143,172,0.32)]'
                    : predicted ? 'bg-primary/20 text-foreground'
                      : fertile ? 'bg-secondary/20 text-foreground'
                        : 'text-foreground/80 hover:bg-white/35'
                }`}
                whileTap={TAP_SPRING}
                aria-pressed={recorded}
                aria-label={`${cursor.getMonth() + 1}月${date.getDate()}日${recorded ? '，已记录经期' : '，记录经期'}`}
              >
                {date.getDate()}
                {isToday ? <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${recorded ? 'bg-white' : 'bg-primary'}`} /> : null}
              </motion.button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/25 pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-primary" />已记录经期</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-primary/25" />预测经期</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-secondary/25" />易孕期参考</span>
        </div>
        {localOnly || message ? <p className="mt-2 text-[10px] text-amber-200/90">{message || '记录暂存在当前设备，配置数据库后可跨设备同步'}</p> : null}
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/75">周期预测仅供健康记录参考，不能用于避孕或医疗诊断。</p>
      </div>
    </motion.section>
  )
}
