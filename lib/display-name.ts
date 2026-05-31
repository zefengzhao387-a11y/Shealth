type NameLike = {
  username?: string | null
  displayname?: string | null
  display_name?: string | null
}

export function getDisplayName(value: NameLike | null | undefined, fallback = '花间用户'): string {
  const candidates = [value?.displayname, value?.display_name, value?.username]
  for (const name of candidates) {
    const normalized = typeof name === 'string' ? name.trim() : ''
    if (normalized) return normalized
  }
  return fallback
}

