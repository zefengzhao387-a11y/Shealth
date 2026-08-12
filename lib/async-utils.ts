export class TimeoutError extends Error {
  constructor(message = '请求超时') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export function withTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = 12_000,
  message = '请求超时，请检查网络后重试',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  return Promise.race([
    Promise.resolve(request),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new TimeoutError(message)), timeoutMs)
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export function getFriendlyNetworkError(error: unknown, fallback: string) {
  if (error instanceof TimeoutError) return error.message
  if (error instanceof TypeError && /fetch|network|load/i.test(error.message)) {
    return '网络连接失败，请检查网络后重试'
  }
  return fallback
}
