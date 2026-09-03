"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { COACH_OUTFITS, type CoachOutfitId } from '@/lib/coach-outfit'
import {
  DEFAULT_COMPANION_PREFERENCES,
  type CompanionFocus,
  type CompanionPreferences,
  type CompanionTone,
  readCompanionPreferences,
  storeCompanionPreferences,
} from '@/lib/companion-preferences'
import { getFriendlyNetworkError, withTimeout } from '@/lib/async-utils'
import { supabase } from '@/lib/supabase'

const FOCUS_OPTIONS: Array<{ id: CompanionFocus; label: string; detail: string; symbol: string }> = [
  { id: 'movement', label: '舒缓运动', detail: '拉伸、训练与身体状态', symbol: '◌' },
  { id: 'cycle', label: '经期照护', detail: '记录感受，温和应对不适', symbol: '☾' },
  { id: 'emotion', label: '情绪陪伴', detail: '倾听、安放与自我关怀', symbol: '◇' },
  { id: 'sleep', label: '睡眠恢复', detail: '放松、休息与作息节奏', symbol: '≈' },
]

const TONE_OPTIONS: Array<{ id: CompanionTone; label: string; detail: string }> = [
  { id: 'gentle', label: '温柔倾听', detail: '先理解感受，再慢慢给建议' },
  { id: 'cheerful', label: '明亮鼓励', detail: '轻快一点，陪你找到行动动力' },
  { id: 'calm', label: '冷静清晰', detail: '简洁、有条理，不过度打扰' },
]

const STEP_COPY = [
  { eyebrow: '先从称呼开始', title: '她叫什么名字？', body: '这是只属于你的数字人，你随时可以换一个更亲近的称呼。' },
  { eyebrow: '选择陪伴重点', title: '最近更想照顾什么？', body: '可以多选。她会优先理解这些方向，不评判，也不催促。' },
  { eyebrow: '找到舒服的距离', title: '希望她怎样回应你？', body: '没有标准答案，只选此刻让你觉得自在的方式。' },
  { eyebrow: '最后一点风格', title: '为她选一套初见装扮', body: '进入首页后仍可在衣橱里随时更换。' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState<CompanionPreferences>(DEFAULT_COMPANION_PREFERENCES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/')
      return
    }
    const existing = readCompanionPreferences(user.id, user.user_metadata)
    if (existing.completed) {
      router.replace('/home')
      return
    }
    setPreferences(existing)
  }, [loading, router, user])

  const toggleFocus = (focus: CompanionFocus) => {
    setPreferences((current) => {
      const selected = current.focuses.includes(focus)
      const focuses = selected
        ? current.focuses.filter((item) => item !== focus)
        : [...current.focuses, focus]
      return { ...current, focuses }
    })
  }

  const finish = async () => {
    if (!user || saving) return
    const completed = { ...preferences, name: preferences.name.trim() || '灵息', completed: true } as CompanionPreferences
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ data: { companion_preferences: completed } }),
      )
      if (updateError) throw updateError
      storeCompanionPreferences(user.id, completed)
      router.replace('/home')
    } catch (saveError) {
      setError(getFriendlyNetworkError(saveError, '暂时没有保存成功，请再试一次'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return <div className="min-h-dvh app-shell" />

  const copy = STEP_COPY[step]
  const canContinue = step !== 1 || preferences.focuses.length > 0

  return (
    <main className="app-shell relative min-h-dvh overflow-hidden px-4 py-6 sm:px-6 md:py-10">
      <div className="app-shell__ambient fixed inset-0 pointer-events-none" aria-hidden />
      <div className="pointer-events-none fixed -left-24 top-1/4 h-64 w-64 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none fixed -right-20 bottom-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" aria-hidden />

      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col md:min-h-[calc(100dvh-5rem)]">
        <header className="flex items-center justify-between">
          <p className="font-brand text-xl tracking-wide text-foreground">Shealth</p>
          <p className="text-xs tabular-nums tracking-[0.2em] text-muted-foreground">{step + 1} / {STEP_COPY.length}</p>
        </header>

        <div className="mt-5 grid h-1 grid-cols-4 gap-2" aria-label={`定制进度，第 ${step + 1} 步，共 4 步`}>
          {STEP_COPY.map((_, index) => (
            <span key={index} className={`rounded-full transition-colors duration-300 ${index <= step ? 'bg-primary' : 'bg-foreground/10'}`} />
          ))}
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 md:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)] md:gap-14">
          <div>
            <p className="mb-4 text-xs tracking-[0.22em] text-primary">{copy.eyebrow}</p>
            <h1 className="max-w-xl text-balance font-serif text-4xl leading-tight tracking-[-0.03em] text-foreground sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-md text-pretty text-sm leading-7 text-muted-foreground sm:text-base">{copy.body}</p>

            <div className="mt-8 hidden md:block">
              <div className="relative h-40 w-32 overflow-hidden rounded-[2.5rem_2.5rem_1.5rem_1.5rem] border border-white/10 bg-card/45 shadow-[0_24px_80px_oklch(0.16_0.04_345/0.45)] backdrop-blur-xl">
                <div className="absolute left-1/2 top-5 h-14 w-14 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/80 to-secondary/70" />
                <div className="absolute bottom-0 left-1/2 h-20 w-24 -translate-x-1/2 rounded-t-[3rem]" style={{ background: COACH_OUTFITS.find((item) => item.id === preferences.outfitId)?.preview }} />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{preferences.name || '灵息'}</p>
              <p className="mt-1 text-xs text-muted-foreground">正在成为更懂你的陪伴</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-card/55 p-4 shadow-[0_28px_100px_oklch(0.16_0.04_345/0.38)] backdrop-blur-2xl sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="min-h-[20rem]"
              >
                {step === 0 ? (
                  <div className="flex min-h-[20rem] flex-col justify-center">
                    <label htmlFor="companion-name" className="mb-3 text-sm text-muted-foreground">数字人的名字</label>
                    <input
                      id="companion-name"
                      value={preferences.name}
                      onChange={(event) => setPreferences((current) => ({ ...current, name: event.target.value.slice(0, 12) }))}
                      maxLength={12}
                      autoFocus
                      className="w-full border-0 border-b border-foreground/20 bg-transparent px-0 py-4 font-serif text-4xl text-foreground outline-none transition-colors placeholder:text-foreground/20 focus:border-primary sm:text-5xl"
                      placeholder="灵息"
                    />
                    <p className="mt-4 text-xs text-muted-foreground">最多 12 个字符，可以是昵称，也可以是你喜欢的意象。</p>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {FOCUS_OPTIONS.map((option) => {
                      const selected = preferences.focuses.includes(option.id)
                      return (
                        <button key={option.id} type="button" aria-pressed={selected} onClick={() => toggleFocus(option.id)} className={`min-h-36 rounded-[1.4rem] p-5 text-left transition-all duration-200 active:scale-[0.98] ${selected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15' : 'bg-foreground/[0.055] text-foreground hover:bg-foreground/[0.09]'}`}>
                          <span className="text-2xl" aria-hidden>{option.symbol}</span>
                          <span className="mt-5 block text-base font-medium">{option.label}</span>
                          <span className={`mt-1.5 block text-xs leading-5 ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{option.detail}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-3">
                    {TONE_OPTIONS.map((option) => {
                      const selected = preferences.tone === option.id
                      return (
                        <button key={option.id} type="button" aria-pressed={selected} onClick={() => setPreferences((current) => ({ ...current, tone: option.id }))} className={`flex w-full items-center justify-between rounded-[1.35rem] px-5 py-6 text-left transition-all active:scale-[0.99] ${selected ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.055] hover:bg-foreground/[0.09]'}`}>
                          <span><span className="block font-medium">{option.label}</span><span className={`mt-1.5 block text-xs ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{option.detail}</span></span>
                          <span className={`ml-4 h-5 w-5 rounded-full border-2 ${selected ? 'border-primary-foreground bg-primary-foreground shadow-[inset_0_0_0_5px_var(--primary)]' : 'border-foreground/25'}`} aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COACH_OUTFITS.map((outfit) => {
                      const selected = preferences.outfitId === outfit.id
                      return (
                        <button key={outfit.id} type="button" aria-pressed={selected} onClick={() => setPreferences((current) => ({ ...current, outfitId: outfit.id as CoachOutfitId }))} className={`rounded-[1.4rem] p-3 text-left transition-all active:scale-[0.98] ${selected ? 'bg-primary/20 ring-2 ring-primary' : 'bg-foreground/[0.055] hover:bg-foreground/[0.09]'}`}>
                          <span className="block h-24 rounded-[1rem]" style={{ background: outfit.preview }} />
                          <span className="mt-3 block px-1 text-sm font-medium">{outfit.label}</span>
                          <span className="mt-1 block px-1 pb-1 text-xs text-muted-foreground">{outfit.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}

            <footer className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={() => step === 0 ? router.replace('/home') : setStep((current) => current - 1)} disabled={saving} className="px-2 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
                {step === 0 ? '稍后再设置' : '上一步'}
              </button>
              <button type="button" disabled={!canContinue || saving} onClick={() => step === STEP_COPY.length - 1 ? void finish() : setStep((current) => current + 1)} className="min-w-32 rounded-2xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">
                {saving ? '正在保存…' : step === STEP_COPY.length - 1 ? `和${preferences.name || '灵息'}见面` : '继续'}
              </button>
            </footer>
          </div>
        </div>
      </section>
    </main>
  )
}
