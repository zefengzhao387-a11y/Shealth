"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/shared/navigation"
import { BloomAnimation, BackgroundEffects } from "@/components/shared/effects"
import { supabase } from "@/lib/supabase"
import type { Post, Comment } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

const TOPICS = [
  { id: "1", name: "21天戒糖", count: "2.3k", gradient: "from-peach/40 to-primary/30" },
  { id: "2", name: "晨间唤醒", count: "1.8k", gradient: "from-lilac/40 to-secondary/30" },
  { id: "3", name: "经期舒缓", count: "3.1k", gradient: "from-primary/40 to-peach/30" },
  { id: "4", name: "冥想日记", count: "1.5k", gradient: "from-sage/40 to-accent/30" },
]

// 格式化时间
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

// 渐变头像
const AVATARS = [
  "from-primary/40 to-peach/40", "from-lilac/40 to-secondary/40",
  "from-sage/40 to-accent/40", "from-primary/40 to-secondary/40",
  "from-peach/40 to-lilac/40",
]

function UserAvatar({ seed, size = 10 }: { seed: string; size?: number }) {
  const idx = seed.charCodeAt(0) % AVATARS.length
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${AVATARS[idx]} flex items-center justify-center flex-shrink-0`}>
      <svg className={`w-${size / 2} h-${size / 2} text-primary-foreground/80`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
      </svg>
    </div>
  )
}

// 帖子卡片
interface PostWithMeta extends Post {
  username?: string | null
  comments_count?: number
}

function PostCard({ post, index, onRequireAuth }: { post: PostWithMeta; index: number; onRequireAuth: () => void }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
  const [showBloom, setShowBloom] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<(Comment & { username?: string | null })[]>([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [showDM, setShowDM] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [addingFriend, setAddingFriend] = useState(false)

  useEffect(() => {
    if (!user || user.id === post.user_id) return
    supabase.from('friendships')
      .select('status, requester_id, addressee_id')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${post.user_id}),and(requester_id.eq.${post.user_id},addressee_id.eq.${user.id})`)
      .then(({ data }) => {
        if (!data || data.length === 0) { setFriendStatus('none'); return }
        const f = data[0]
        if (f.status === 'accepted') setFriendStatus('accepted')
        else setFriendStatus('pending')
      })
  }, [user, post.user_id])

  const [friendError, setFriendError] = useState('')
  const addFriend = async () => {
    if (!user) { onRequireAuth(); return }
    setAddingFriend(true)
    setFriendError('')
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: post.user_id })
    if (error) {
      console.error('[community] addFriend error:', error.code, error.message)
      if (error.code === '42P01') setFriendError('好友功能未启用')
      else if (error.code === '23505') { setFriendStatus('pending'); /* duplicate */ }
      else setFriendError('申请失败')
    } else {
      setFriendStatus('pending')
    }
    setAddingFriend(false)
    setTimeout(() => setFriendError(''), 2500)
  }

  const handleLike = async () => {
    if (!user) { onRequireAuth(); return }
    if (liked) {
      setLiked(false)
      const next = Math.max(0, likesCount - 1)
      setLikesCount(next)
      await supabase.from('post_likes').delete().match({ user_id: user.id, post_id: post.id })
      await supabase.from('posts').update({ likes_count: next }).eq('id', post.id)
    } else {
      setLiked(true)
      const next = likesCount + 1
      setLikesCount(next)
      setShowBloom(true)
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id })
      await supabase.from('posts').update({ likes_count: next }).eq('id', post.id)
    }
  }

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return }
    setShowComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data && data.length > 0) {
      const { data: profs } = await supabase
        .from('profiles').select('id, username').in('id', data.map((c: any) => c.user_id))
      const map = new Map(profs?.map((p: any) => [p.id, p.username]) ?? [])
      setComments(data.map((c: any) => ({ ...c, username: map.get(c.user_id) ?? null })))
      setCommentsCount(data.length)
    } else {
      setComments([])
    }
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { onRequireAuth(); return }
    if (!commentText.trim() || posting) return
    setPosting(true)
    const { data } = await supabase.from('comments').insert({
      user_id: user.id, post_id: post.id, content: commentText.trim(),
    }).select('*').single()
    if (data) {
      setComments(prev => [...prev, { ...(data as any), username: (data as any).user_id === user.id ? null : null }])
      setCommentsCount(c => c + 1)
    }
    setCommentText('')
    setPosting(false)
  }

  const username = post.username ?? '花间用户'
  const authorSeed = post.user_id

  return (
    <motion.div
      className="bg-card/70 backdrop-blur-sm rounded-2xl overflow-hidden mb-3 border border-border/40"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      {/* 作者栏 */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-3">
        <UserAvatar seed={authorSeed} size={9} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-[15px] truncate">{username}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
        {user && user.id !== post.user_id && friendStatus !== 'accepted' && (
          <div className="flex flex-col items-end gap-1">
            <motion.button
              onClick={addFriend} disabled={addingFriend || friendStatus === 'pending'}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                friendStatus === 'pending'
                  ? 'bg-muted/60 text-muted-foreground'
                  : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
              }`}
              whileTap={{ scale: 0.93 }}
            >
              {friendStatus === 'pending' ? '已申请' : '+ 好友'}
            </motion.button>
            {friendError && <span className="text-[10px] text-destructive">{friendError}</span>}
          </div>
        )}
        {user && user.id !== post.user_id && friendStatus === 'accepted' && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent">好友</span>
        )}
      </div>

      {/* 内容 */}
      <div className="px-4 pb-3">
        <p className="text-foreground text-[15px] leading-[1.55] whitespace-pre-wrap break-words">{post.content}</p>
      </div>

      {/* 图片 */}
      {post.image_url && (
        <div className="aspect-[4/3] bg-gradient-to-br from-primary/15 to-secondary/10">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* 互动栏 */}
      <div className="px-2 pt-2 pb-1 flex items-center border-t border-border/30">
        <motion.button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl relative active:bg-muted/40 transition-colors"
          onClick={handleLike} whileTap={{ scale: 0.96 }}
        >
          <motion.div animate={liked ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
            {liked ? (
              <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6 2 2 6 2 10c0 2 1 4 3 5.5L12 22l7-6.5c2-1.5 3-3.5 3-5.5 0-4-4-8-10-8z" /></svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6 2 2 6 2 10c0 2 1 4 3 5.5L12 22l7-6.5c2-1.5 3-3.5 3-5.5 0-4-4-8-10-8z" /></svg>
            )}
          </motion.div>
          <span className={`text-[13px] ${liked ? "text-primary font-medium" : "text-muted-foreground"}`}>{likesCount}</span>
          <BloomAnimation isActive={showBloom} onComplete={() => setShowBloom(false)} />
        </motion.button>

        <motion.button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:bg-muted/40 transition-colors"
          onClick={loadComments} whileTap={{ scale: 0.96 }}
        >
          <svg className="w-[18px] h-[18px] text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <span className="text-[13px] text-muted-foreground">{commentsCount}</span>
        </motion.button>

        {user && user.id !== post.user_id && (
          <motion.button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:bg-muted/40 transition-colors"
            onClick={() => setShowDM(true)} whileTap={{ scale: 0.96 }}
          >
            <svg className="w-[18px] h-[18px] text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            <span className="text-[13px] text-muted-foreground">私信</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showDM && (
          <SendDMModal toUserId={post.user_id} toUsername={username} onClose={() => setShowDM(false)} />
        )}
      </AnimatePresence>

      {/* 评论区 */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="border-t border-border/30 px-4 py-3 space-y-2.5 bg-muted/20"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          >
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">还没有评论，来说第一句话吧</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <UserAvatar seed={c.user_id} size={6} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground mb-0.5">{c.username ?? '花间用户'}</p>
                  <p className="text-[13px] text-foreground/85 leading-snug break-words">{c.content}</p>
                </div>
              </div>
            ))}
            <form onSubmit={submitComment} className="flex gap-2 pt-2">
              <UserAvatar seed={user?.id ?? 'anon'} size={7} />
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={user ? "说点什么..." : "登录后发表评论"}
                onClick={!user ? onRequireAuth : undefined}
                readOnly={!user}
                className="flex-1 px-3.5 py-2 rounded-full bg-card text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-border/40 focus:border-primary/40 transition-colors min-w-0"
              />
              {user && (
                <motion.button type="submit" disabled={posting || !commentText.trim()} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-40" whileTap={{ scale: 0.9 }}>
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </motion.button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 私信弹窗
function SendDMModal({ toUserId, toUsername, onClose }: { toUserId: string; toUsername: string; onClose: () => void }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const [sendError, setSendError] = useState('')
  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim() || sending) return
    setSending(true)
    setSendError('')
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: toUserId, content: content.trim() })
    if (error) {
      console.error('[DM] insert error:', error.code, error.message)
      setSendError(error.code === '42P01' ? '私信功能未启用，请联系管理员' : '发送失败：' + error.message)
      setSending(false)
      return
    }
    setSent(true)
    setTimeout(onClose, 1400)
  }

  return (
    <>
      <motion.div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed inset-x-4 bottom-4 z-[71] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {sent ? (
          <motion.div className="text-center py-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-4xl mb-2">✉️</div>
            <p className="font-medium text-foreground">私信已发送</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">私信 <span className="text-primary">{toUsername}</span></h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={send}>
              <textarea
                value={content} onChange={e => setContent(e.target.value)}
                placeholder={`发私信给 ${toUsername}...`} rows={3} autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/40 transition-colors"
              />
              {sendError && <p className="text-xs text-destructive mt-1">{sendError}</p>}
              <div className="flex justify-end mt-3">
                <motion.button
                  type="submit" disabled={sending || !content.trim()}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {sending ? '发送中...' : '发送'}
                </motion.button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </>
  )
}

// 发帖弹窗
function CreatePostModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user || posting) return
    setPosting(true)
    const { error } = await supabase.from('posts').insert({
      user_id: user.id, content: content.trim(), likes_count: 0,
    })
    if (error) { setError('发布失败，请重试'); setPosting(false); return }
    onPosted()
    onClose()
  }

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed inset-x-4 bottom-4 z-[61] bg-card/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-border/30"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground">发布动态</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="分享你的蜕变故事、健康食谱、运动心得..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/30 outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/40 transition-colors"
            autoFocus
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{content.length}/500</span>
            <motion.button
              type="submit"
              disabled={posting || !content.trim()}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {posting ? '发布中...' : '发布'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

const PAGE_SIZE = 8

export default function CommunityPage() {
  const { user, openAuthModal } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)

  const fetchPage = async (offset: number, replace: boolean) => {
    if (offset === 0) setLoading(true); else setLoadingMore(true)

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) console.error('[community] fetchPosts error:', error.code, error.message)

    const newPosts = (data ?? []) as any[]
    setHasMore(newPosts.length === PAGE_SIZE)

    if (newPosts.length > 0) {
      const postIds = newPosts.map(p => p.id)
      const userIds = Array.from(new Set(newPosts.map(p => p.user_id)))

      // 并行查 用户名、评论数、当前用户点赞
      const [profilesRes, commentsRes, likesRes] = await Promise.all([
        supabase.from('profiles').select('id, username').in('id', userIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        user
          ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
          : Promise.resolve({ data: [] as { post_id: string }[] }),
      ])

      const nameMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.username]))
      const commentCount: Record<string, number> = {}
      ;(commentsRes.data ?? []).forEach((c: any) => {
        commentCount[c.post_id] = (commentCount[c.post_id] ?? 0) + 1
      })
      const likedSet = new Set((likesRes.data ?? []).map((l: any) => l.post_id))

      const enriched = newPosts.map(p => ({
        ...p,
        username: nameMap.get(p.user_id) ?? null,
        comments_count: commentCount[p.id] ?? 0,
        liked: likedSet.has(p.id),
      }))
      setPosts(prev => replace ? enriched : [...prev, ...enriched])
    } else {
      if (replace) setPosts([])
    }

    setLoading(false)
    setLoadingMore(false)
  }

  const fetchPosts = () => fetchPage(0, true)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted) fetchPosts() }, [mounted, user])

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-cream via-peach/10 to-lilac/20" />

  const handleCreatePost = () => {
    if (!user) { openAuthModal(); return }
    setShowCreatePost(true)
  }

  return (
    <main className="relative min-h-screen pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-peach/10 to-lilac/20 -z-10" />
      <BackgroundEffects density="light" />
      <Navigation />

      <div className="relative z-10 pt-16 px-3">
        <div className="max-w-2xl mx-auto">
          <motion.div className="mb-4 px-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-[26px] font-semibold text-foreground tracking-tight">繁花社区</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">分享你的蜕变，与闺蜜一起成长</p>
          </motion.div>

          {/* 话题频道 — 横滚胶囊 */}
          <motion.div className="mb-3 -mx-3 px-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TOPICS.map((topic, i) => (
                <motion.button
                  key={topic.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-full bg-gradient-to-r ${topic.gradient} text-[13px] font-medium text-foreground/90 border border-white/30`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                >
                  #{topic.name}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 发帖入口（已登录用户显示） */}
          {user && (
            <motion.button
              className="w-full bg-card/70 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-2.5 mb-4 text-left border border-border/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              onClick={handleCreatePost}
              whileTap={{ scale: 0.99 }}
            >
              <UserAvatar seed={user.id} size={7} />
              <span className="text-[13px] text-muted-foreground flex-1">分享今天的心情...</span>
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </motion.button>
          )}

          {/* 帖子列表 */}
          {loading && posts.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/70 border border-border/40 rounded-2xl p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="flex-1"><div className="h-3 bg-muted rounded w-24 mb-2" /><div className="h-2 bg-muted rounded w-16" /></div>
                  </div>
                  <div className="space-y-2"><div className="h-3 bg-muted rounded" /><div className="h-3 bg-muted rounded w-4/5" /></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-5xl mb-4">🌸</div>
              <p className="text-foreground font-medium mb-2">社区还很安静</p>
              <p className="text-sm text-muted-foreground mb-6">成为第一个分享故事的人吧</p>
              <motion.button
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium"
                onClick={handleCreatePost}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                {user ? '发布第一条动态' : '登录后发布'}
              </motion.button>
            </motion.div>
          ) : (
            <div>
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post as any} index={i} onRequireAuth={openAuthModal} />
              ))}
              {/* 加载更多 */}
              {hasMore && (
                <div className="flex justify-center mt-2 mb-4">
                  <motion.button
                    onClick={() => fetchPage(posts.length, false)}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-full glass text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loadingMore ? "加载中..." : "加载更多"}
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 发帖悬浮按钮 */}
      <motion.button
        className="fixed bottom-8 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg"
        onClick={handleCreatePost}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.5 }}
        style={{ boxShadow: "0 4px 20px rgba(255,182,193,0.5)" }}
      >
        <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      {/* 发帖弹窗 */}
      <AnimatePresence>
        {showCreatePost && (
          <CreatePostModal onClose={() => setShowCreatePost(false)} onPosted={fetchPosts} />
        )}
      </AnimatePresence>

    </main>
  )
}
