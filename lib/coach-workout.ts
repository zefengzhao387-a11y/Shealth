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
  '呼……（擦汗）宝贝，这组练完我也好热呀～不过你真的太棒了，陪你一起变优秀的感觉真好！快喝口水歇歇～'

export const WORKOUT_CARDS: Array<{
  kind: WorkoutKind
  emoji: string
  title: string
  duration: string
}> = [
  { kind: 'dumbbell', emoji: '🏋️‍♀️', title: '哑铃塑形', duration: '5分钟' },
  { kind: 'yoga', emoji: '🧘‍♀️', title: '减脂瑜伽', duration: '10分钟' },
]

/** tired 阶段 0~1，末 5 秒淡出 */
export function computeTiredBlend(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  const fadeStart = (WORKOUT_TIRED_SEC - 5) * 1000
  if (elapsedMs < fadeStart) return 1
  return Math.max(0, 1 - (elapsedMs - fadeStart) / 5000)
}
