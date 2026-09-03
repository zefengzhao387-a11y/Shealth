"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircleHeart, Send, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"
import { FormEvent, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { getFriendlyNetworkError, withTimeout } from "@/lib/async-utils"
import { TAP_SPRING } from "@/lib/motion-presets"
import { supabase } from "@/lib/supabase"

const feedbackKinds = ["使用体验", "功能建议", "内容反馈", "问题报告"] as const
const ratingLabels = ["需要努力", "还可以", "感觉不错", "很喜欢", "特别喜欢"] as const

export function FeedbackDialog() {
  const pathname = usePathname()
  const { user, openAuthModal } = useAuth()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [kind, setKind] = useState<(typeof feedbackKinds)[number]>("使用体验")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  if (pathname === "/") return null

  const reset = () => {
    setRating(0)
    setKind("使用体验")
    setMessage("")
    setError("")
    setSent(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) window.setTimeout(reset, 180)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!user) {
      setOpen(false)
      openAuthModal(pathname)
      return
    }
    if (!rating) {
      setError("请先点亮一瓣满意度")
      return
    }
    const trimmedMessage = message.trim()
    if (trimmedMessage.length < 4) {
      setError("再多说一点吧，至少需要 4 个字")
      return
    }

    setSubmitting(true)
    try {
      const { error: submitError } = await withTimeout(
        supabase.from("feedback").insert({
          user_id: user.id,
          rating,
          category: kind,
          message: trimmedMessage,
          page_path: pathname,
        }),
      )
      if (submitError) {
        if (submitError.code === "42P01") {
          setError("反馈服务还未初始化，请先运行 Supabase 配置脚本")
        } else {
          setError(submitError.message || "反馈未能送达，请稍后重试")
        }
        return
      }
      setSent(true)
    } catch (submitError) {
      setError(getFriendlyNetworkError(submitError, "反馈未能送达，请稍后重试"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          whileTap={TAP_SPRING}
          className="app-chip fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.8rem)] left-4 z-[46] flex min-h-11 items-center gap-2 px-3 text-sm text-foreground shadow-[0_10px_30px_rgba(27,10,23,0.2)] md:bottom-6 md:left-6"
          aria-label="评价与建议"
        >
          <MessageCircleHeart className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">评价与建议</span>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[2rem] border-white/15 bg-[oklch(0.32_0.036_346_/_0.97)] p-0 text-foreground shadow-[0_28px_90px_rgba(20,8,18,0.46)] backdrop-blur-2xl sm:max-w-[34rem]">
        {sent ? (
          <div className="flex min-h-[28rem] flex-col items-center justify-center px-7 py-10 text-center">
            <motion.div
              initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-primary/25 bg-primary/12"
            >
              <Sparkles className="h-9 w-9 text-primary" strokeWidth={1.4} />
            </motion.div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-primary">Feedback received</p>
            <h2 className="mt-2 font-serif text-3xl">这一瓣心意，我们收到了</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              谢谢你认真告诉我们真实感受。每一条建议，都会帮助她健康更懂用户一点。
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-7 min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              完成
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="border-b border-white/10 px-6 pb-5 pt-7 sm:px-8">
              <DialogHeader>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary">A note for Shealth</p>
                <DialogTitle className="font-serif text-2xl font-normal sm:text-3xl">给她健康留一瓣心意</DialogTitle>
                <DialogDescription className="leading-6">
                  好用或不好用，都请真实告诉我们。你的感受会直接影响下一次改进。
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              <fieldset>
                <legend className="text-sm font-medium">这次体验感觉怎么样？</legend>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-[1.5rem] border border-white/10 bg-black/8 p-3">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= rating
                    return (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        whileTap={{ scale: 0.88 }}
                        className={`flex h-11 flex-1 items-center justify-center rounded-2xl transition-colors ${active ? "bg-primary/14 text-primary" : "text-muted-foreground/55 hover:bg-white/5 hover:text-muted-foreground"}`}
                        aria-label={`${value}分，${ratingLabels[value - 1]}`}
                        aria-pressed={rating === value}
                      >
                        <Heart className={`h-6 w-6 ${active ? "fill-current" : ""}`} strokeWidth={1.35} />
                      </motion.button>
                    )
                  })}
                </div>
                <p className="mt-2 min-h-5 text-center text-xs text-primary/85" aria-live="polite">
                  {rating ? ratingLabels[rating - 1] : "点亮一瓣，告诉我们你的感受"}
                </p>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">想说哪一方面？</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {feedbackKinds.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setKind(item)}
                      className={`min-h-10 rounded-full border px-4 text-xs transition-colors ${kind === item ? "border-primary/45 bg-primary/15 text-primary" : "border-white/12 bg-white/5 text-muted-foreground hover:text-foreground"}`}
                      aria-pressed={kind === item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-medium">具体评价或建议</span>
                <div className="mt-3 rounded-[1.5rem] border border-white/12 bg-black/10 p-4 transition-colors focus-within:border-primary/45">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, 500))}
                    placeholder="例如：希望经期记录里可以增加疼痛程度……"
                    rows={5}
                    className="w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/65"
                  />
                  <p className="mt-2 text-right text-[11px] text-muted-foreground">{message.length}/500</p>
                </div>
              </label>

              {error ? <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground" role="alert">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-wait disabled:opacity-55"
              >
                <Send className="h-4 w-4" />
                {submitting ? "正在送达……" : user ? "送出这瓣心意" : "登录后送出"}
              </button>
              <p className="text-center text-[11px] leading-5 text-muted-foreground">反馈仅用于产品改进，不会公开展示</p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
