"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

function getUsernameHint(username: string): string {
  const normalized = username.trim()
  if (!normalized) return "账号用于登录（仅英文、数字、下划线）"
  if (normalized.length < 2 || normalized.length > 24) return "账号需为 2-24 个字符"
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) return "仅支持英文、数字、下划线（不支持中文）"
  return "账号格式可用"
}

export function AuthModal() {
  const { showAuthModal, closeAuthModal, signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameHint = getUsernameHint(username)
  const usernameValid = username.trim() !== '' && usernameHint === "账号格式可用"

  const reset = () => { setError(''); setUsername(''); setDisplayName(''); setPassword(''); setConfirmPassword('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (tab === 'register' && !displayName.trim()) { setError('请填写昵称'); return }
    if (!username.trim()) { setError('请输入账号'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setError('账号仅支持英文、数字、下划线（不支持中文）'); return }
    if (username.trim().length < 2 || username.trim().length > 24) { setError('账号需为 2-24 个字符'); return }
    if (!password) { setError('请输入密码'); return }
    if (tab === 'register' && password !== confirmPassword) { setError('两次输入的密码不一致'); return }
    setLoading(true)

    if (tab === 'login') {
      const { error } = await signIn(username, password)
      if (error) setError(error)
    } else {
      const { error } = await signUp(username, displayName, password)
      if (error) setError(error)
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="w-full max-w-sm bg-card/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/30 relative">
              {/* Logo */}
              <div className="text-center mb-6">
                <span className="font-brand text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  花间塑
                </span>
                <p className="text-xs text-muted-foreground mt-1">你的专属 AI 闺蜜教练</p>
              </div>

              {/* 标签切换 */}
              <div className="flex rounded-2xl bg-muted p-1 mb-6">
                {(['login', 'register'] as const).map(t => (
                  <button
                    key={t}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                    onClick={() => { setTab(t); reset() }}
                  >
                    {t === 'login' ? '登录' : '注册'}
                  </button>
                ))}
              </div>

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {tab === 'register' && (
                  <input
                    type="text"
                    placeholder="昵称（必填，可用中文和任意字符）"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                  />
                )}
                <input
                  type="text"
                  placeholder="账号（登录用，仅英文/数字/下划线）"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                />
                <p className={`-mt-1 px-1 text-xs ${usernameValid ? "text-accent" : "text-muted-foreground"}`}>
                  {usernameHint}
                </p>
                <input
                  type="password"
                  placeholder={tab === 'register' ? '密码（至少 6 位）' : '密码'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                />
                {tab === 'register' && (
                  <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                  />
                )}

                {error && (
                  <motion.p
                    className="text-xs text-destructive text-center px-2"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (tab === 'login' ? '登录' : '注册账号')}
                </motion.button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {tab === 'login' ? '还没有账号？' : '已有账号？'}
                <button className="text-primary ml-1" onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); reset() }}>
                  {tab === 'login' ? '立即注册' : '去登录'}
                </button>
              </p>

              {/* 关闭 */}
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
