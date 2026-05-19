import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

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
