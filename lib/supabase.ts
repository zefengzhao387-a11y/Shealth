import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aymcfhmrgfitbyavpnfp.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWNmaG1yZ2ZpdGJ5YXZwbmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDY4ODMsImV4cCI6MjA5NDcyMjg4M30.n_RPHIkTmZH-yHW1Ta8j4K6MY57U5u5Dh6dQP2OQQcs'

function getClient(): SupabaseClient {
  if (_client) return _client
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _client
}

// When env vars are missing, return a recursive no-op proxy so the app
// degrades gracefully instead of crashing (all calls resolve to { data: null, error })
function noopProxy(): unknown {
  const stub = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  return new Proxy(Object.assign(stub, {}), {
    get: () => noopProxy(),
    apply: (_t, _this, _args) =>
      Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
  })
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ── 类型定义 ──────────────────────────────────────────────
export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Dimension {
  id: string
  user_id: string
  weight: number | null
  height: number | null
  flexibility: number | null
  strength: number | null
  endurance: number | null
  recorded_at: string
}

export interface Workout {
  id: string
  user_id: string
  course_id: string
  course_title: string
  duration_minutes: number
  points_earned: number
  completed_at: string
}

export interface Checkin {
  id: string
  user_id: string
  checked_in_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  created_at: string
  profiles?: Profile
  liked?: boolean
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}
