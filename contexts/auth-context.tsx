"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { getDisplayName } from '@/lib/display-name'
import { getFriendlyNetworkError, withTimeout } from '@/lib/async-utils'

// 兼容最近一版哈希算法（仅用于历史账号登录回退）
function hash32(input: string, seed: number) {
  let h = seed >>> 0
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function toHashedInternalEmail(username: string) {
  const normalized = username.trim().toLowerCase()
  const safe = `u_${hash32(normalized, 0x811c9dc5)}${hash32(normalized, 0x9e3779b1)}`
  return `${safe}@floramotion.app`
}

// 当前算法：直接使用用户名作为内部邮箱 local-part
function toInternalEmail(username: string) {
  const normalized = username.trim().toLowerCase()
  return `${normalized}@floramotion.app`
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
  signUp: (username: string, displayName: string, password: string) => Promise<{
    error: string | null
    requiresEmailConfirmation?: boolean
  }>
  signOut: () => Promise<void>
  showAuthModal: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function validateUsername(username: string): string | null {
  const normalized = username.trim()
  if (!normalized) return '请输入账号'
  if (normalized.length < 2 || normalized.length > 24) return '账号需为 2-24 个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return '账号仅支持英文、数字、下划线（不支持中文）'
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
    try {
      const { data } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      )
      if (data) { setProfile(data); return }
      // profile 不存在（trigger 未配置）—— 从 user_metadata 补建
      const { data: { user: currUser } } = await withTimeout(supabase.auth.getUser())
      const meta = (currUser?.user_metadata ?? {}) as { username?: string; display_name?: string; displayname?: string }
      const accountName = meta.username?.trim() || currUser?.email?.split('@')[0] || 'user'
      const fallback = getDisplayName(meta, accountName)
      const { data: created } = await withTimeout(
        supabase
          .from('profiles')
          .upsert({
            id: userId,
            username: accountName,
            displayname: fallback,
            display_name: fallback,
          }, { onConflict: 'id' })
          .select('*')
          .single(),
      )
      if (created) setProfile(created)
    } catch (error) {
      console.error('[auth] profile load failed:', error)
    }
  }

  useEffect(() => {
    withTimeout(supabase.auth.getSession())
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) void fetchProfile(session.user.id)
      })
      .catch((error) => console.error('[auth] restore session failed:', error))
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) void fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (username: string, password: string) => {
    const normalized = username.trim()
    const usernameError = validateUsername(normalized)
    if (usernameError) return { error: usernameError }

    const primaryEmail = toInternalEmail(normalized)
    const hashedEmail = toHashedInternalEmail(normalized)
    const encodedEmail = toEncodedInternalEmail(normalized)
    const legacyEmail = toLegacyInternalEmail(normalized)

    let primaryRes
    try {
      primaryRes = await withTimeout(
        supabase.auth.signInWithPassword({ email: primaryEmail, password }),
      )
    } catch (error) {
      return { error: getFriendlyNetworkError(error, '登录失败，请稍后重试') }
    }
    if (!primaryRes.error) {
      setShowAuthModal(false)
      return { error: null }
    }

    // 兼容历史映射算法
    const fallbacks = [hashedEmail, encodedEmail, legacyEmail].filter((email, i, arr) => email !== primaryEmail && arr.indexOf(email) === i)
    for (const fallbackEmail of fallbacks) {
      let fallbackRes
      try {
        fallbackRes = await withTimeout(
          supabase.auth.signInWithPassword({ email: fallbackEmail, password }),
        )
      } catch (error) {
        return { error: getFriendlyNetworkError(error, '登录失败，请稍后重试') }
      }
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

    if (primaryRes.error?.message.includes('Invalid login credentials')) return { error: '账号或密码错误' }
    if (primaryRes.error?.message.includes('Email address') && primaryRes.error?.message.includes('invalid')) {
      return { error: '账号系统映射异常，请稍后重试' }
    }
    return { error: primaryRes.error?.message ?? null }
  }

  const signUp = async (username: string, displayName: string, password: string) => {
    const normalized = username.trim()
    const usernameError = validateUsername(normalized)
    if (usernameError) return { error: usernameError }
    const normalizedDisplayName = displayName.trim()
    if (!normalizedDisplayName) return { error: '请输入昵称' }
    if (password.length < 6) return { error: '密码至少需要 6 位' }

    const email = toInternalEmail(normalized)
    let result
    try {
      result = await withTimeout(supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: normalized,
            display_name: normalizedDisplayName,
            displayname: normalizedDisplayName,
          },
        },
      }))
    } catch (requestError) {
      return { error: getFriendlyNetworkError(requestError, '注册失败，请稍后重试') }
    }

    const { error, data } = result
    if (!error && data.user && data.session) {
      // 登录账号和展示昵称分列保存；已有数据库 trigger 时仍可安全 upsert。
      let upErr
      try {
        const profileResult = await withTimeout(
          supabase.from('profiles').upsert({
            id: data.user.id,
            username: normalized,
            displayname: normalizedDisplayName,
            display_name: normalizedDisplayName,
          }, { onConflict: 'id' }),
        )
        upErr = profileResult.error
      } catch (profileError) {
        console.error('[signUp] profile upsert failed:', profileError)
        return { error: '账号已创建，但个人资料初始化超时，请重新登录后再试' }
      }
      if (upErr) {
        console.error('[signUp] profile upsert error:', upErr.code, upErr.message)
        return { error: '账号已创建，但个人资料初始化失败，请重新登录后再试' }
      }
      await fetchProfile(data.user.id)
      setShowAuthModal(false)
    }
    if (!error && data.user && !data.session) {
      return { error: null, requiresEmailConfirmation: true }
    }
    if (error?.message.includes('User already registered')) return { error: '该账号已被注册' }
    if (error?.message.includes('Email address') && error?.message.includes('invalid')) {
      return { error: '账号系统映射异常，请更换账号后重试' }
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
