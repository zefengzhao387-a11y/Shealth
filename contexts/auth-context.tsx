"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

// 用用户名构造内部邮箱，绕过邮件发送
function hash32(input: string, seed: number) {
  let h = seed >>> 0
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function toInternalEmail(username: string) {
  const normalized = username.trim().toLowerCase()
  const safe = `u_${hash32(normalized, 0x811c9dc5)}${hash32(normalized, 0x9e3779b1)}`
  return `${safe}@floramotion.app`
}

// 兼容上一版算法（使用 encodeURIComponent + 下划线）
function toEncodedInternalEmail(username: string) {
  const normalized = username.trim().toLowerCase()
  const encoded = encodeURIComponent(normalized)
    .replace(/%/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
  const safe = encoded.slice(0, 64) || 'user'
  return `${safe}@floramotion.app`
}

// 兼容更早算法（仅保留 [a-z0-9_]）
function toLegacyInternalEmail(username: string) {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return `${safe || 'user'}@floramotion.app`
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signUp: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  showAuthModal: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function validateUsername(username: string): string | null {
  const normalized = username.trim()
  if (!normalized) return '请输入用户名'
  if (normalized.length < 2 || normalized.length > 24) return '用户名需为 2-24 个字符'
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(normalized)) {
    return '用户名仅支持中文、英文、数字、下划线'
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) { setProfile(data); return }
    // profile 不存在（trigger 未配置）—— 从 user_metadata 补建
    const { data: { user: currUser } } = await supabase.auth.getUser()
    const meta = (currUser?.user_metadata ?? {}) as { username?: string }
    const fallback = meta.username || currUser?.email?.split('@')[0] || '花间用户'
    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: userId, username: fallback }, { onConflict: 'id' })
      .select('*')
      .single()
    if (created) setProfile(created)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (username: string, password: string) => {
    const normalized = username.trim()
    const usernameError = validateUsername(normalized)
    if (usernameError) return { error: usernameError }

    const primaryEmail = toInternalEmail(normalized)
    const encodedEmail = toEncodedInternalEmail(normalized)
    const legacyEmail = toLegacyInternalEmail(normalized)

    const primaryRes = await supabase.auth.signInWithPassword({ email: primaryEmail, password })
    if (!primaryRes.error) {
      setShowAuthModal(false)
      return { error: null }
    }

    // 兼容历史映射算法
    const fallbacks = [encodedEmail, legacyEmail].filter((email, i, arr) => email !== primaryEmail && arr.indexOf(email) === i)
    for (const fallbackEmail of fallbacks) {
      const fallbackRes = await supabase.auth.signInWithPassword({ email: fallbackEmail, password })
      if (!fallbackRes.error) {
        setShowAuthModal(false)
        return { error: null }
      }
      if (!fallbackRes.error?.message.includes('Invalid login credentials')) {
        if (fallbackRes.error?.message.includes('Email address') && fallbackRes.error?.message.includes('invalid')) {
          return { error: '账号系统映射异常，请稍后重试' }
        }
        return { error: fallbackRes.error?.message ?? null }
      }
    }

    if (primaryRes.error?.message.includes('Invalid login credentials')) return { error: '用户名或密码错误' }
    if (primaryRes.error?.message.includes('Email address') && primaryRes.error?.message.includes('invalid')) {
      return { error: '账号系统映射异常，请稍后重试' }
    }
    return { error: primaryRes.error?.message ?? null }
  }

  const signUp = async (username: string, password: string) => {
    const normalized = username.trim()
    const usernameError = validateUsername(normalized)
    if (usernameError) return { error: usernameError }
    if (password.length < 6) return { error: '密码至少需要 6 位' }

    const email = toInternalEmail(normalized)
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: normalized } },
    })
    if (!error && data.user) {
      // upsert 确保 profile 存在，不依赖 trigger
      const { error: upErr } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, username: normalized }, { onConflict: 'id' })
      if (upErr) console.error('[signUp] profile upsert error:', upErr.code, upErr.message)
      await fetchProfile(data.user.id)
    }
    if (!error) setShowAuthModal(false)
    if (error?.message.includes('User already registered')) return { error: '该用户名已被注册' }
    if (error?.message.includes('Email address') && error?.message.includes('invalid')) {
      return { error: '账号系统映射异常，请更换用户名后重试' }
    }
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signIn, signUp, signOut,
      showAuthModal,
      openAuthModal: () => setShowAuthModal(true),
      closeAuthModal: () => setShowAuthModal(false),
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
