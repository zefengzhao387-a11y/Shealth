type NameLike = {
  displayname?: string | null
  display_name?: string | null
}

export function getDisplayName(value: NameLike | null | undefined, fallback = '花间用户'): string {
  const name = value?.displayname ?? value?.display_name
  const normalized = typeof name === 'string' ? name.trim() : ''
  return normalized || fallback
}

