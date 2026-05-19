"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/shared/navigation"
import { supabase } from "@/lib/supabase"
import type { Dimension } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { usePoints } from "@/contexts/points-context"
import { BackgroundEffects } from "@/components/shared/effects"

// 成就定义
const ACHIEVEMENTS = [
  { id: "first_workout", name: "初绽", desc: "完成第一次训练", icon: "🌸", condition: "完成 1 次训练", gradient: "from-peach/60 to-primary/50" },
  { id: "week_streak", name: "坚持", desc: "连续打卡 7 天", icon: "🌟", condition: "连续打卡 7 天", gradient: "from-lilac/60 to-secondary/50" },
  { id: "month_streak", name: "蜕变", desc: "连续打卡 30 天", icon: "👑", condition: "连续打卡 30 天", gradient: "from-sage/60 to-accent/50" },
  { id: "hundred_points", name: "积累", desc: "累计 100 运动分", icon: "✨", condition: "累计 100 运动分", gradient: "from-primary/60 to-secondary/50" },
  { id: "five_hundred_points", name: "绽放", desc: "累计 500 运动分", icon: "🌺", condition: "累计 500 运动分", gradient: "from-secondary/60 to-lilac/50" },
  { id: "hour_total", name: "初心", desc: "累计运动 60 分钟", icon: "💪", condition: "累计运动 60 分钟", gradient: "from-accent/60 to-sage/50" },
  { id: "ten_workouts", name: "勤勉", desc: "完成 10 次训练", icon: "🎯", condition: "完成 10 次训练", gradient: "from-peach/60 to-lilac/50" },
  { id: "ten_hours_total", name: "花开", desc: "累计运动 600 分钟", icon: "🏵️", condition: "累计运动 600 分钟", gradient: "from-primary/60 to-accent/50" },
  { id: "thousand_points", name: "满园", desc: "累计 1000 运动分", icon: "🎊", condition: "累计 1000 运动分", gradient: "from-sage/60 to-primary/50" },
]

// 贝塞尔曲线图
function BezierChart({ data, color = "primary" }: { data: number[]; color?: string }) {
  const w = 200, h = 60, p = 10
  const min = Math.min(...data) - 1
  const max = Math.max(...data) + 1
  const range = max - min || 1
  const pts = data.map((v, i) => ({
    x: p + (i / (data.length - 1)) * (w - p * 2),
    y: h - p - ((v - min) / range) * (h - p * 2),
  }))
  let path = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i]
    const cp1x = prev.x + (curr.x - prev.x) / 3
    const cp2x = curr.x - (curr.x - prev.x) / 3
    path += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`
  }
  const area = path + ` L ${pts[pts.length - 1].x} ${h - p} L ${pts[0].x} ${h - p} Z`
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`cg-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`lg-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#DDA0DD" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#cg-${color})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.path d={path} fill="none" stroke={`url(#lg-${color})`} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut" }} />
      <motion.circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill="white" stroke="#FFB6C1" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }} />
    </svg>
  )
}

// 维度录入弹窗
function DimensionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ weight: '', height: '', flexibility: '', strength: '', endurance: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('dimensions').insert({
      user_id: user.id,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      flexibility: form.flexibility ? parseInt(form.flexibility) : null,
      strength: form.strength ? parseInt(form.strength) : null,
      endurance: form.endurance ? parseInt(form.endurance) : null,
    })
    if (error) { setError('保存失败，请重试'); setSaving(false); return }
    onSaved()
    onClose()
  }

  const fields = [
    { key: 'weight', label: '体重', unit: 'kg', type: 'number', step: '0.1', placeholder: '如 52.5' },
    { key: 'height', label: '身高', unit: 'cm', type: 'number', step: '0.1', placeholder: '如 165' },
    { key: 'flexibility', label: '柔韧度', unit: '分', type: 'number', placeholder: '1-100 自评' },
    { key: 'strength', label: '力量感', unit: '分', type: 'number', placeholder: '1-100 自评' },
    { key: 'endurance', label: '耐力', unit: '分', type: 'number', placeholder: '1-100 自评' },
  ]

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30 max-h-[85vh] overflow-y-auto"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-medium text-foreground">录入今日数据</h3>
            <p className="text-xs text-muted-foreground mt-0.5">记录你的身体变化轨迹</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {fields.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <label className="text-sm text-foreground w-16 flex-shrink-0">{f.label}</label>
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 focus-within:border-primary/40 transition-colors">
                <input
                  type={f.type}
                  step={(f as any).step}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">{f.unit}</span>
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <motion.button
            type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm mt-2"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          >
            {saving ? '保存中...' : '保存记录'}
          </motion.button>
        </form>
      </motion.div>
    </>
  )
}

// 成就徽章
function AchievementBadge({ ach, unlocked, index }: { ach: typeof ACHIEVEMENTS[0]; unlocked: boolean; index: number }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer"
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: unlocked ? 1 : 0.45, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: unlocked ? 1.12 : 1.05, y: -4 }}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <motion.div
        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${unlocked ? ach.gradient : 'from-muted to-muted'} flex items-center justify-center mb-2`}
        style={{
          boxShadow: unlocked
            ? "0 4px 15px rgba(255,182,193,0.35), inset 0 2px 10px rgba(255,255,255,0.4)"
            : "none",
          filter: unlocked ? 'none' : 'grayscale(1)',
        }}
        animate={unlocked ? { boxShadow: ["0 4px 15px rgba(255,182,193,0.3)", "0 4px 25px rgba(255,182,193,0.5)", "0 4px 15px rgba(255,182,193,0.3)"] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {unlocked ? (
          <span className="text-2xl">{ach.icon}</span>
        ) : (
          <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {unlocked && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        )}
      </motion.div>
      <p className="text-xs font-medium text-foreground text-center leading-tight">{ach.name}</p>

      {/* 条件提示 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute z-30 bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl glass-strong text-xs text-foreground whitespace-nowrap shadow-lg"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          >
            {unlocked ? `✓ ${ach.desc}` : `🔒 ${ach.condition}`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── 消息通知设置 ──────────────────────────────────────────────
function NotifModal({ onClose }: { onClose: () => void }) {
  const KEYS = ['workout_reminder', 'community_interaction', 'checkin_reminder', 'dm_notification']
  const LABELS = ['运动提醒', '社区互动（点赞/评论）', '每日打卡提醒', '私信通知']
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('notif_settings') ?? '{}') } catch { return {} }
  })
  const toggle = (k: string) => {
    const next = { ...toggles, [k]: !toggles[k] }
    setToggles(next)
    localStorage.setItem('notif_settings', JSON.stringify(next))
  }
  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-medium text-foreground">消息通知</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          {KEYS.map((k, i) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{LABELS[i]}</span>
              <motion.button
                className={`w-12 h-6 rounded-full relative transition-colors ${toggles[k] ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'}`}
                onClick={() => toggle(k)} whileTap={{ scale: 0.95 }}
              >
                <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ left: toggles[k] ? '1.75rem' : '0.25rem' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-5 text-center">设置仅保存在本设备</p>
      </motion.div>
    </>
  )
}

// ── 隐私设置 ──────────────────────────────────────────────────
function PrivacyModal({ onClose }: { onClose: () => void }) {
  const [pub, setPub] = useState(() => localStorage.getItem('privacy_public') !== 'false')
  const [allowDM, setAllowDM] = useState(() => localStorage.getItem('privacy_dm') !== 'false')
  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-medium text-foreground">隐私设置</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: '公开我的档案', desc: '其他用户可查看你的动态', val: pub, set: (v: boolean) => { setPub(v); localStorage.setItem('privacy_public', String(v)) } },
            { label: '允许私信', desc: '其他用户可向你发送私信', val: allowDM, set: (v: boolean) => { setAllowDM(v); localStorage.setItem('privacy_dm', String(v)) } },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-foreground">{item.label}</span>
                <motion.button
                  className={`w-12 h-6 rounded-full relative transition-colors ${item.val ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'}`}
                  onClick={() => item.set(!item.val)} whileTap={{ scale: 0.95 }}
                >
                  <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: item.val ? '1.75rem' : '0.25rem' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ── 帮助中心 ──────────────────────────────────────────────────
const FAQ = [
  { q: '如何获得运动分？', a: '完成悦动专区的课程后，系统会自动发放对应运动分。每日打卡也可获得 10 分。' },
  { q: '连续打卡有什么奖励？', a: '连续打卡会提升你的连续天数记录，并可解锁「坚持」「蜕变」等成就徽章。' },
  { q: '维度数据如何使用？', a: '在「镜心」页面点击「录入今日数据」，输入体重、柔韧度等指标，积累 2 条以上可查看趋势图。' },
  { q: '如何发送私信？', a: '在繁花社区的帖子下方点击信封图标，即可向发帖者发送私信。' },
  { q: '成就徽章如何解锁？', a: '满足相应条件后系统会自动解锁，点击灰色徽章可查看解锁条件。' },
]
function HelpModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30 max-h-[80vh] overflow-y-auto"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-medium text-foreground">帮助中心</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <motion.div key={i} className="rounded-2xl overflow-hidden border border-border/30">
              <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                <motion.svg className="w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  animate={{ rotate: open === i ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <path d="M9 18l6-6-6-6" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div className="px-4 pb-4" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ── 好友系统 ──────────────────────────────────────────────────
type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

interface FriendUser {
  id: string
  username: string | null
  friendship_id?: string
  status?: FriendStatus
}

function FriendsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'friends' | 'pending' | 'search'>('friends')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [pendingIn, setPendingIn] = useState<(FriendUser & { friendship_id: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<Record<string, boolean>>({})

  const loadFriends = async () => {
    if (!user) return
    const { data } = await supabase
      .from('friendships')
      .select('id, status, requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
    if (data && data.length > 0) {
      const otherIds = data.map((f: any) => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      const { data: profs } = await supabase.from('profiles').select('id, username').in('id', otherIds)
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.username]))
      setFriends(data.map((f: any) => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        return { id: otherId, username: map.get(otherId) ?? null, friendship_id: f.id }
      }))
    } else {
      setFriends([])
    }
  }

  const loadPending = async () => {
    if (!user) return
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
    if (data && data.length > 0) {
      const { data: profs } = await supabase
        .from('profiles').select('id, username').in('id', data.map((f: any) => f.requester_id))
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.username]))
      setPendingIn(data.map((f: any) => ({
        id: f.requester_id, username: map.get(f.requester_id) ?? null, friendship_id: f.id,
      })))
    } else {
      setPendingIn([])
    }
  }

  useEffect(() => {
    loadFriends()
    loadPending()
  }, [user])

  const searchUsers = async () => {
    if (!query.trim() || !user) return
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', user.id)
      .limit(10)

    if (profiles && profiles.length > 0) {
      const ids = profiles.map((p: any) => p.id)
      // 两次简单查询代替复杂 OR
      const [out, inn] = await Promise.all([
        supabase.from('friendships').select('id, status, addressee_id')
          .eq('requester_id', user.id).in('addressee_id', ids),
        supabase.from('friendships').select('id, status, requester_id')
          .eq('addressee_id', user.id).in('requester_id', ids),
      ])

      setSearchResults(profiles.map((p: any) => {
        const outF = out.data?.find((x: any) => x.addressee_id === p.id)
        const inF = inn.data?.find((x: any) => x.requester_id === p.id)
        const f = outF || inF
        let status: FriendStatus = 'none'
        if (f) {
          if (f.status === 'accepted') status = 'accepted'
          else if (outF) status = 'pending_sent'
          else status = 'pending_received'
        }
        return { ...p, status, friendship_id: f?.id }
      }))
    } else {
      setSearchResults([])
    }
    setLoading(false)
  }

  const sendRequest = async (toId: string) => {
    if (!user) return
    setSending(s => ({ ...s, [toId]: true }))
    await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: toId })
    setSearchResults(r => r.map(u => u.id === toId ? { ...u, status: 'pending_sent' } : u))
    setSending(s => ({ ...s, [toId]: false }))
  }

  const respond = async (friendshipId: string, accept: boolean) => {
    await supabase.from('friendships').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', friendshipId)
    setPendingIn(p => p.filter(u => u.friendship_id !== friendshipId))
    if (accept) loadFriends()
  }

  const removeFriend = async (friendshipId: string, friendId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriends(f => f.filter(u => u.id !== friendId))
  }

  const TABS = [
    { key: 'friends', label: `好友 ${friends.length > 0 ? friends.length : ''}` },
    { key: 'pending', label: `待确认 ${pendingIn.length > 0 ? `(${pendingIn.length})` : ''}` },
    { key: 'search', label: '搜索' },
  ] as const

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed left-1/2 top-1/2 z-[61] w-[92vw] max-w-2xl max-h-[82vh] -translate-x-1/2 -translate-y-1/2 bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 flex flex-col"
        initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="font-medium text-foreground">我的好友</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 mx-5 mt-3 p-1 bg-muted/40 rounded-xl">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-2">

          {/* 搜索 tab */}
          {tab === 'search' && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="text" value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUsers()}
                  placeholder="输入用户名搜索..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted/60 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
                />
                <motion.button
                  onClick={searchUsers} disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? '...' : '搜索'}
                </motion.button>
              </div>
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary/70" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" /></svg>
                  </div>
                  <p className="flex-1 text-sm font-medium text-foreground">{u.username ?? '花间用户'}</p>
                  {u.status === 'accepted' && (
                    <span className="text-xs text-accent px-2.5 py-1 rounded-full bg-accent/10">已是好友</span>
                  )}
                  {u.status === 'pending_sent' && (
                    <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted/50">已发送</span>
                  )}
                  {u.status === 'pending_received' && (
                    <span className="text-xs text-secondary px-2.5 py-1 rounded-full bg-secondary/10">待你确认</span>
                  )}
                  {u.status === 'none' && (
                    <motion.button
                      onClick={() => sendRequest(u.id)}
                      disabled={sending[u.id]}
                      className="text-xs text-primary-foreground px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                      whileTap={{ scale: 0.93 }}
                    >
                      {sending[u.id] ? '...' : '加好友'}
                    </motion.button>
                  )}
                </div>
              ))}
              {searchResults.length === 0 && query && !loading && (
                <p className="text-xs text-muted-foreground text-center py-4">没有找到用户</p>
              )}
            </>
          )}

          {/* 待确认 tab */}
          {tab === 'pending' && (
            <>
              {pendingIn.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">暂无待确认的好友申请</p>
              ) : pendingIn.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary/70" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" /></svg>
                  </div>
                  <p className="flex-1 text-sm font-medium text-foreground">{u.username ?? '花间用户'}</p>
                  <div className="flex gap-1.5">
                    <motion.button onClick={() => respond(u.friendship_id, true)}
                      className="text-xs text-primary-foreground px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                      whileTap={{ scale: 0.93 }}>接受</motion.button>
                    <motion.button onClick={() => respond(u.friendship_id, false)}
                      className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-muted/60"
                      whileTap={{ scale: 0.93 }}>拒绝</motion.button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 好友列表 tab */}
          {tab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">🌸</p>
                  <p className="text-sm text-foreground mb-1">还没有好友</p>
                  <p className="text-xs text-muted-foreground mb-3">去搜索用户添加好友吧</p>
                  <button onClick={() => setTab('search')} className="text-xs text-primary">去搜索 →</button>
                </div>
              ) : friends.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary/70" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" /></svg>
                  </div>
                  <p className="flex-1 text-sm font-medium text-foreground">{u.username ?? '花间用户'}</p>
                  <motion.button onClick={() => removeFriend(u.friendship_id!, u.id)}
                    className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-muted/40"
                    whileTap={{ scale: 0.93 }}>删除</motion.button>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── 关于花间塑 ────────────────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="text-center mb-5">
          <span className="font-brand text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">花间塑</span>
          <p className="text-xs text-muted-foreground mt-1">FloraMotion · v1.0.0</p>
        </div>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
          为每一位女性打造的 AI 闺蜜健身教练<br />
          让蜕变成为一种温柔的习惯
        </p>
        <div className="glass rounded-2xl p-4 space-y-3">
          {[
            { label: '版本', value: '1.0.0' },
            { label: '开发团队', value: 'FloraMotion Studio' },
            { label: '技术栈', value: 'Next.js · Supabase · Framer Motion' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-2xl bg-muted/60 text-sm text-muted-foreground">关闭</button>
      </motion.div>
    </>
  )
}

export default function ProfilePage() {
  const { user, profile, openAuthModal } = useAuth()
  const { totalPoints, streak, totalMinutes, todayCheckedIn, recordCheckin, refreshStats, unlockedAchievements } = usePoints()
  const [mounted, setMounted] = useState(false)
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [showDimModal, setShowDimModal] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInSuccess, setCheckInSuccess] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('dimensions').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(7)
      .then(({ data }) => { if (data) setDimensions(data) })
    // 待确认好友请求数
    supabase.from('friendships').select('id', { count: 'exact' })
      .eq('addressee_id', user.id).eq('status', 'pending')
      .then(({ count }) => { if (count) setPendingCount(count) })
  }, [user])

  const handleCheckin = async () => {
    if (!user) { openAuthModal(); return }
    if (todayCheckedIn || checkingIn) return
    setCheckingIn(true)
    const ok = await recordCheckin()
    if (ok) setCheckInSuccess(true)
    setCheckingIn(false)
    setTimeout(() => setCheckInSuccess(false), 3000)
  }

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />

  // 未登录状态
  if (!user) {
    return (
      <main className="relative min-h-screen pb-32">
        <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-xl font-medium text-foreground mb-2">登录后查看镜心</h2>
            <p className="text-sm text-muted-foreground mb-8">记录你的身体变化，解锁专属成就</p>
            <motion.button
              className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium"
              onClick={openAuthModal} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              登录 / 注册
            </motion.button>
          </motion.div>
        </div>
      </main>
    )
  }

  // 维度数据处理（取最近7条组成趋势）
  const dimData = {
    weight: dimensions.map(d => d.weight ?? 0).filter(Boolean).reverse(),
    flexibility: dimensions.map(d => d.flexibility ?? 0).filter(Boolean).reverse(),
    strength: dimensions.map(d => d.strength ?? 0).filter(Boolean).reverse(),
    endurance: dimensions.map(d => d.endurance ?? 0).filter(Boolean).reverse(),
  }
  const latestDim = dimensions[0]

  return (
    <main className="relative min-h-screen pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
      <BackgroundEffects density="light" />

      <Navigation />

      <div className="relative z-10 pt-16 px-3">
        <div className="max-w-2xl mx-auto">

          {/* 个人头部 — 紧凑+清爽 */}
          <motion.div className="mb-5" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/8 to-lilac/15 border border-white/30">
              <div className="p-4">
                <div className="flex items-center gap-3.5">
                  <motion.div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center flex-shrink-0 shadow-lg" whileTap={{ scale: 0.95 }}>
                    <svg className="w-8 h-8 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4" /><path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
                    </svg>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-semibold text-foreground truncate">{profile?.username ?? '花间仙子'}</h2>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Lv.{Math.floor(totalPoints / 100) + 1} · 还差 {100 - (totalPoints % 100)} 分</p>
                    <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totalPoints % 100), 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 统计 — 横向数字 */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: "连续打卡", value: streak.toString(), unit: "天" },
                    { label: "运动时长", value: totalMinutes.toString(), unit: "分" },
                    { label: "运动分", value: totalPoints.toString(), unit: "" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/30 backdrop-blur-sm rounded-xl py-2.5 text-center">
                      <p className="text-[18px] font-semibold text-foreground leading-tight">
                        {stat.value}<span className="text-[11px] font-normal text-muted-foreground ml-0.5">{stat.unit}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* 打卡按钮 */}
                <motion.button
                  onClick={handleCheckin}
                  disabled={todayCheckedIn || checkingIn}
                  className={`w-full py-2.5 mt-3 rounded-xl font-medium text-[13px] transition-all ${
                    todayCheckedIn || checkInSuccess
                      ? 'bg-accent/15 text-accent'
                      : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
                  }`}
                  whileTap={!todayCheckedIn ? { scale: 0.98 } : {}}
                  style={!todayCheckedIn ? { boxShadow: "0 4px 16px rgba(255,182,193,0.3)" } : {}}
                >
                  {checkInSuccess ? '✓ 打卡成功！+10 运动分' : todayCheckedIn ? '✓ 今日已打卡' : checkingIn ? '打卡中...' : '今日打卡'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* 维度数据 */}
          <motion.div className="mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="text-[15px] font-semibold text-foreground">身体维度</h3>
              <motion.button
                className="text-xs text-primary flex items-center gap-1"
                onClick={() => setShowDimModal(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                录入今日数据
              </motion.button>
            </div>

            {dimensions.length === 0 ? (
              <motion.div
                className="glass rounded-2xl p-6 text-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm text-foreground mb-1">还没有维度记录</p>
                <p className="text-xs text-muted-foreground mb-4">开始记录身体变化，见证你的蜕变</p>
                <motion.button
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm"
                  onClick={() => setShowDimModal(true)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  录入第一条数据
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {latestDim?.weight != null && dimData.weight.length > 1 && (
                  <motion.div className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
                    <p className="text-xs text-muted-foreground mb-1">体重</p>
                    <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-medium text-foreground">{latestDim.weight}</span><span className="text-xs text-muted-foreground">kg</span></div>
                    <BezierChart data={dimData.weight} />
                  </motion.div>
                )}
                {latestDim?.flexibility != null && dimData.flexibility.length > 1 && (
                  <motion.div className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.02 }}>
                    <p className="text-xs text-muted-foreground mb-1">柔韧度</p>
                    <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-medium text-foreground">{latestDim.flexibility}</span><span className="text-xs text-muted-foreground">分</span></div>
                    <BezierChart data={dimData.flexibility} color="secondary" />
                  </motion.div>
                )}
                {latestDim?.strength != null && dimData.strength.length > 1 && (
                  <motion.div className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ scale: 1.02 }}>
                    <p className="text-xs text-muted-foreground mb-1">力量感</p>
                    <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-medium text-foreground">{latestDim.strength}</span><span className="text-xs text-muted-foreground">分</span></div>
                    <BezierChart data={dimData.strength} />
                  </motion.div>
                )}
                {latestDim?.endurance != null && dimData.endurance.length > 1 && (
                  <motion.div className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.02 }}>
                    <p className="text-xs text-muted-foreground mb-1">耐力</p>
                    <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-medium text-foreground">{latestDim.endurance}</span><span className="text-xs text-muted-foreground">分</span></div>
                    <BezierChart data={dimData.endurance} color="secondary" />
                  </motion.div>
                )}
                {/* 数据少于2条时提示 */}
                {dimData.weight.length <= 1 && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-xs text-muted-foreground">已记录 {dimensions.length} 条数据，再记录 {Math.max(0, 2 - dimensions.length)} 条后可显示趋势图</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* 成就徽章 */}
          <motion.div className="mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="text-[15px] font-semibold text-foreground">成就徽章</h3>
              <span className="text-[11px] text-muted-foreground">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ACHIEVEMENTS.map((ach, i) => (
                <div key={ach.id} className="relative flex justify-center">
                  <AchievementBadge ach={ach} unlocked={unlockedAchievements.includes(ach.id)} index={i} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* 社交快捷区 — 好友 + 私信并列 */}
          <motion.div className="mb-4 grid grid-cols-2 gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <motion.button
              onClick={() => setShowFriends(true)}
              className="relative bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl p-3.5 flex flex-col items-start gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-foreground">我的好友</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">搜索 · 管理</p>
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-medium">
                  {pendingCount}
                </span>
              )}
            </motion.button>

            <Link href="/messages">
              <motion.div
                className="bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl p-3.5 flex flex-col items-start gap-2 h-full"
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-foreground">私信箱</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">好友私信</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* 设置 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
              {[
                { label: "消息通知", icon: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />, onClick: () => setShowNotif(true) },
                { label: "隐私设置", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, onClick: () => setShowPrivacy(true) },
                { label: "帮助中心", icon: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>, onClick: () => setShowHelp(true) },
                { label: "关于花间塑", icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, onClick: () => setShowAbout(true) },
              ].map((item, i, arr) => (
                <motion.button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between px-4 py-3 active:bg-muted/40 transition-colors ${i !== arr.length - 1 ? 'border-b border-border/30' : ''}`}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{item.icon}</svg>
                    </div>
                    <span className="text-[14px] text-foreground">{item.label}</span>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 弹窗层 */}
      <AnimatePresence>
        {showDimModal && (
          <DimensionModal
            onClose={() => setShowDimModal(false)}
            onSaved={() => {
              supabase.from('dimensions').select('*').eq('user_id', user!.id).order('recorded_at', { ascending: false }).limit(7)
                .then(({ data }) => { if (data) setDimensions(data) })
              refreshStats()
            }}
          />
        )}
        {showNotif && <NotifModal onClose={() => setShowNotif(false)} />}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        {showFriends && <FriendsModal onClose={() => { setShowFriends(false); setPendingCount(0) }} />}
      </AnimatePresence>

    </main>
  )
}
