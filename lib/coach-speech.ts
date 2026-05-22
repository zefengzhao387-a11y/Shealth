/** 口型与说话时长（配合 TTS audio.currentTime 或纯文本估算） */

const VISEME_KEYS = ['aa', 'ih', 'ou', 'ee', 'oh'] as const
export type VisemeKey = (typeof VISEME_KEYS)[number]

const VOWEL_HINT: Record<string, VisemeKey> = {
  a: 'aa',
  e: 'ee',
  i: 'ih',
  o: 'ou',
  u: 'ou',
  v: 'ou',
  ai: 'aa',
  ei: 'ee',
  ao: 'ou',
  ou: 'ou',
  // 中文常见开口字
  啊: 'aa',
  哦: 'oh',
  喔: 'oh',
  嗯: 'oh',
  一: 'ih',
  衣: 'ih',
  你: 'ih',
  呢: 'ee',
  的: 'ee',
  好: 'ou',
  我: 'ou',
  么: 'ou',
  吗: 'aa',
  吧: 'aa',
  哈: 'aa',
}

/** 按字数估算说话时长（秒）— 无 TTS 时使用 */
export function estimateSpeechDuration(text: string): number {
  const len = text.replace(/\s/g, '').length
  return Math.min(Math.max(len * 0.16, 2.2), 28)
}

function pickVisemeForChar(char: string): VisemeKey {
  if (VOWEL_HINT[char]) return VOWEL_HINT[char]
  const lower = char.toLowerCase()
  for (const key of Object.keys(VOWEL_HINT)) {
    if (lower.includes(key)) return VOWEL_HINT[key]
  }
  const code = char.charCodeAt(0)
  return VISEME_KEYS[code % VISEME_KEYS.length]
}

/** 返回当前帧各 viseme 权重（VRM expressionManager） */
export function getVisemeWeights(text: string, elapsedSec: number): Partial<Record<VisemeKey, number>> {
  if (!text) return {}

  const chars = [...text.replace(/\s/g, '')]
  const len = Math.max(chars.length, 1)
  const charIndex = Math.floor(elapsedSec * 8.2) % len
  const char = chars[charIndex] ?? ' '
  const active = pickVisemeForChar(char)

  // 基础张嘴 + 元音脉冲，让 AvatarSample_A 的 aa/ih/ou 更明显
  const jawPulse = 0.38 + Math.abs(Math.sin(elapsedSec * 14.5)) * 0.52
  const vowelPulse = 0.55 + Math.abs(Math.sin(elapsedSec * 11 + charIndex * 0.4)) * 0.42

  const weights: Partial<Record<VisemeKey, number>> = {}
  VISEME_KEYS.forEach((k) => {
    weights[k] = k === active ? Math.min(1, vowelPulse) : Math.min(0.22, jawPulse * 0.15)
  })
  weights.aa = Math.max(weights.aa ?? 0, jawPulse * 0.72)
  weights.oh = Math.max(weights.oh ?? 0, jawPulse * 0.18)

  return weights
}

export function resetVisemeWeights(): Partial<Record<VisemeKey, number>> {
  return Object.fromEntries(VISEME_KEYS.map((k) => [k, 0])) as Partial<Record<VisemeKey, number>>
}
