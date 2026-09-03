import { DEFAULT_OUTFIT_ID, type CoachOutfitId } from '@/lib/coach-outfit'

export type CompanionTone = 'gentle' | 'cheerful' | 'calm'
export type CompanionFocus = 'movement' | 'cycle' | 'emotion' | 'sleep'

export type CompanionPreferences = {
  version: 1
  completed: boolean
  name: string
  tone: CompanionTone
  focuses: CompanionFocus[]
  outfitId: CoachOutfitId
}

export const DEFAULT_COMPANION_PREFERENCES: CompanionPreferences = {
  version: 1,
  completed: false,
  name: '灵息',
  tone: 'gentle',
  focuses: ['movement', 'emotion'],
  outfitId: DEFAULT_OUTFIT_ID,
}

const OUTFITS = new Set<CoachOutfitId>(['classic-black', 'peach-sport', 'lilac-set', 'sage-active'])
const TONES = new Set<CompanionTone>(['gentle', 'cheerful', 'calm'])
const FOCUSES = new Set<CompanionFocus>(['movement', 'cycle', 'emotion', 'sleep'])

export function companionStorageKey(userId: string) {
  return `shealth_companion_preferences_v1:${userId}`
}

export function normalizeCompanionPreferences(value: unknown): CompanionPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_COMPANION_PREFERENCES
  const raw = value as Partial<CompanionPreferences>
  const focuses = Array.isArray(raw.focuses)
    ? raw.focuses.filter((focus): focus is CompanionFocus => FOCUSES.has(focus as CompanionFocus))
    : []

  return {
    version: 1,
    completed: raw.completed === true,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 12) : '灵息',
    tone: TONES.has(raw.tone as CompanionTone) ? raw.tone as CompanionTone : 'gentle',
    focuses: focuses.length ? focuses : ['movement', 'emotion'],
    outfitId: OUTFITS.has(raw.outfitId as CoachOutfitId) ? raw.outfitId as CoachOutfitId : DEFAULT_OUTFIT_ID,
  }
}

export function readCompanionPreferences(userId: string, metadata?: Record<string, unknown>) {
  const remote = normalizeCompanionPreferences(metadata?.companion_preferences)
  if (remote.completed) return remote
  if (typeof window === 'undefined') return remote
  try {
    return normalizeCompanionPreferences(JSON.parse(window.localStorage.getItem(companionStorageKey(userId)) ?? 'null'))
  } catch {
    return remote
  }
}

export function storeCompanionPreferences(userId: string, preferences: CompanionPreferences) {
  window.localStorage.setItem(companionStorageKey(userId), JSON.stringify(preferences))
}
