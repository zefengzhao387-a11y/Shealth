"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

// 用用户名构造内部邮箱，绕过邮件发送
function toInternalEmail(username: string) {
  const safe = username.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return `${safe}@floramotion.app`
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
    const email = toInternalEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) setShowAuthModal(false)
    if (error?.message.includes('Invalid login credentials')) return { error: '账号或密码错误' }
    return { error: error?.message ?? null }
  }

  const signUp = async (username: string, password: string) => {
    if (!username.trim()) return { error: '请输入账号名' }
    if (password.length < 6) return { error: '密码至少需要 6 位' }
    const email = toInternalEmail(username)
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.trim() } },
    })
    if (!error && data.user) {
      // upsert 确保 profile 存在，不依赖 trigger
      const { error: upErr } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, username: username.trim() }, { onConflict: 'id' })
      if (upErr) console.error('[signUp] profile upsert error:', upErr.code, upErr.message)
      await fetchProfile(data.user.id)
    }
    if (!error) setShowAuthModal(false)
    if (error?.message.includes('User already registered')) return { error: '该账号名已被注册' }
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
