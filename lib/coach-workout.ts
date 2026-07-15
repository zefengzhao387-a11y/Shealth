export type WorkoutState = 'idle' | 'training' | 'tired'

export type WorkoutKind = 'dumbbell' | 'yoga'

export type CoachWorkoutCue = {
  state: WorkoutState
  kind: WorkoutKind | null
  token: number
  /** 进入 tired 时的 performance.now() */
  tiredStartedAt?: number
}

export const WORKOUT_TRAINING_SEC = 5
export const WORKOUT_TIRED_SEC = 15

export const WORKOUT_TIRED_BUBBLE =
  '呼……这组我们一起慢慢来，你也辛苦了～记得喝点水，休息一下，身体最重要。'

export const WORKOUT_CARDS: Array<{
  kind: WorkoutKind
  emoji: string
  title: string
  duration: string
}> = [
  { kind: 'dumbbell', emoji: '🏋️‍♀️', title: '哑铃塑形', duration: '5分钟' },
  { kind: 'yoga', emoji: '🧘‍♀️', title: '舒缓瑜伽', duration: '10分钟' },
]

/** tired 阶段 0~1，末 5 秒淡出 */
export function computeTiredBlend(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  const fadeStart = (WORKOUT_TIRED_SEC - 5) * 1000
  if (elapsedMs < fadeStart) return 1
  return Math.max(0, 1 - (elapsedMs - fadeStart) / 5000)
}
