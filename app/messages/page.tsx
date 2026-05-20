"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BackgroundEffects } from "@/components/shared/effects"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import type { Message } from "@/lib/supabase"

interface Conversation {
  otherId: string
  otherUsername: string
  lastMsg: string
  lastTime: string
  unread: number
  senderId: string
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

const AVATARS = [
  "from-primary/40 to-peach/40", "from-lilac/40 to-secondary/40",
  "from-sage/40 to-accent/40", "from-primary/40 to-secondary/40",
]
function UserAvatar({ seed, size = 10 }: { seed: string; size?: number }) {
  const idx = seed.charCodeAt(0) % AVATARS.length
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${AVATARS[idx]} flex items-center justify-center flex-shrink-0`}>
      <svg className={`w-${Math.floor(size / 2)} h-${Math.floor(size / 2)} text-primary-foreground/80`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
      </svg>
    </div>
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [chatMsgs, setChatMsgs] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('[messages] fetch error:', error.code, error.message)
      setLoading(false)
      return
    }
    if (!data) { setLoading(false); return }

    const otherIds = [...new Set(data.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', otherIds)
    const profileMap = new Map(profiles?.map(p => [p.id, p.username || '花间用户']) ?? [])

    const convMap = new Map<string, Conversation>()
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          otherId,
          otherUsername: profileMap.get(otherId) ?? '花间用户',
          lastMsg: msg.content,
          lastTime: msg.created_at,
          unread: 0,
          senderId: msg.sender_id,
        })
      }
      if (!msg.read && msg.receiver_id === user.id) {
        convMap.get(otherId)!.unread++
      }
    }
    setConversations([...convMap.values()])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (mounted && user) fetchConversations()
  }, [mounted, user, fetchConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  const openConversation = async (conv: Conversation) => {
    setSelected(conv)
    setChatLoading(true)

    // PostgREST doesn't support nested and() inside or(), so fetch both directions separately
    const [sentRes, receivedRes] = await Promise.all([
      supabase.from('messages').select('*').eq('sender_id', user!.id).eq('receiver_id', conv.otherId).limit(100),
      supabase.from('messages').select('*').eq('sender_id', conv.otherId).eq('receiver_id', user!.id).limit(100),
    ])
    const merged = [...(sentRes.data ?? []), ...(receivedRes.data ?? [])]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    setChatMsgs(merged as Message[])
    setChatLoading(false)

    // mark received messages as read
    await supabase.from('messages').update({ read: true })
      .eq('receiver_id', user!.id).eq('sender_id', conv.otherId).eq('read', false)
    setConversations(prev => prev.map(c => c.otherId === conv.otherId ? { ...c, unread: 0 } : c))
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selected || !input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    const { data, error } = await supabase.from('messages')
      .insert({ sender_id: user.id, receiver_id: selected.otherId, content })
      .select().single()
    if (error) {
      console.error('[messages] send error:', error.code, error.message)
      setInput(content) // restore input so user doesn't lose the message
    } else if (data) {
      setChatMsgs(prev => [...prev, data as Message])
      // update conversation list preview
      setConversations(prev => prev.map(c =>
        c.otherId === selected.otherId ? { ...c, lastMsg: content, lastTime: data.created_at, senderId: user.id } : c
      ))
    }
    setSending(false)
  }

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/home')
  }

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />

  if (!user) {
    return (
      <main className="relative min-h-screen pb-32">
        <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-4">💌</div>
            <h2 className="text-xl font-medium text-foreground mb-2">登录后查看私信</h2>
            <p className="text-sm text-muted-foreground mb-8">与花间好友互相鼓励、分享进步</p>
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

  return (
    <main className="relative min-h-screen pb-20">
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
      <BackgroundEffects density="light" />

      <div className="relative z-10 pt-3 h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {selected ? (
            /* ── 聊天界面 ── */
            <motion.div
              key="chat"
              className="flex flex-col flex-1 min-h-0"
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* 顶部栏 */}
              <div className="flex items-center gap-3 px-4 py-3 glass border-b border-border/30">
                <motion.button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full glass flex items-center justify-center" whileTap={{ scale: 0.9 }}>
                  <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </motion.button>
                <UserAvatar seed={selected.otherId} size={9} />
                <div>
                  <p className="font-medium text-foreground text-sm">{selected.otherUsername}</p>
                  <p className="text-xs text-muted-foreground">花间好友</p>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {chatLoading ? (
                  <div className="flex justify-center pt-8">
                    <motion.div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  </div>
                ) : chatMsgs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">💌</div>
                    <p className="text-sm text-muted-foreground">发送第一条消息吧</p>
                  </div>
                ) : (
                  chatMsgs.map((msg, i) => {
                    const isMine = msg.sender_id === user.id
                    return (
                      <motion.div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        {!isMine && <UserAvatar seed={selected.otherId} size={7} />}
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-sm'
                            : 'glass text-foreground rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {isMine && <UserAvatar seed={user.id} size={7} />}
                      </motion.div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* 输入框 */}
              <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 glass border-t border-border/30">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="说点什么..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
                />
                <motion.button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </motion.button>
              </form>
            </motion.div>
          ) : (
            /* ── 会话列表 ── */
            <motion.div
              key="list"
              className="flex-1 overflow-y-auto"
              initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="px-4 pb-4">
                <div className="mb-5 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.button
                      onClick={goBack}
                      className="w-9 h-9 rounded-full glass flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </motion.button>
                    <h1 className="text-2xl font-medium text-foreground">私信箱</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">与花间好友互相鼓励</p>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="glass rounded-2xl p-4 flex gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-5xl mb-4">💌</div>
                    <p className="text-foreground font-medium mb-2">还没有私信</p>
                    <p className="text-sm text-muted-foreground">在社区帖子下点击信封图标，开始与好友对话吧</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conv, i) => (
                      <motion.button
                        key={conv.otherId}
                        className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => openConversation(conv)}
                        whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative">
                          <UserAvatar seed={conv.otherId} size={12} />
                          {conv.unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                              {conv.unread > 9 ? '9+' : conv.unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${conv.unread > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                              {conv.otherUsername}
                            </p>
                            <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{timeAgo(conv.lastTime)}</p>
                          </div>
                          <p className={`text-xs truncate ${conv.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {conv.senderId === user.id ? '你：' : ''}{conv.lastMsg}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  )
}
