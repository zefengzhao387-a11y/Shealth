import RPCClient from '@alicloud/pop-core'

type CachedToken = {
  id: string
  expireAt: number
}

let cachedToken: CachedToken | null = null

const REGION_META: Record<string, string> = {
  'cn-shanghai': 'nls-meta.cn-shanghai.aliyuncs.com',
  'cn-beijing': 'nls-meta.cn-beijing.aliyuncs.com',
  'cn-shenzhen': 'nls-meta.cn-shenzhen.aliyuncs.com',
}

const REGION_GATEWAY: Record<string, string> = {
  'cn-shanghai': 'nls-gateway-cn-shanghai.aliyuncs.com',
  'cn-beijing': 'nls-gateway-cn-beijing.aliyuncs.com',
  'cn-shenzhen': 'nls-gateway-cn-shenzhen.aliyuncs.com',
}

function getAccessKeys() {
  const accessKeyId =
    process.env.ALIYUN_AK_ID ||
    process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ||
    process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret =
    process.env.ALIYUN_AK_SECRET ||
    process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ||
    process.env.ALIYUN_ACCESS_KEY_SECRET
  return { accessKeyId, accessKeySecret }
}

function getRegion() {
  return process.env.ALIYUN_NLS_REGION || 'cn-shanghai'
}

function getGatewayHost() {
  return process.env.ALIYUN_NLS_GATEWAY || REGION_GATEWAY[getRegion()] || REGION_GATEWAY['cn-shanghai']
}

function getMetaHost() {
  const region = getRegion()
  return process.env.ALIYUN_NLS_META || REGION_META[region] || REGION_META['cn-shanghai']
}

/** 阿里云 NLS Token（缓存至过期前 5 分钟） */
export async function getAliyunNlsToken(): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const preset = process.env.ALIYUN_NLS_TOKEN?.trim()
  if (preset) return { ok: true, token: preset }

  const now = Date.now()
  if (cachedToken && cachedToken.expireAt - now > 5 * 60 * 1000) {
    return { ok: true, token: cachedToken.id }
  }

  const { accessKeyId, accessKeySecret } = getAccessKeys()
  if (!accessKeyId || !accessKeySecret) {
    return {
      ok: false,
      error: '缺少 ALIYUN_AK_ID / ALIYUN_AK_SECRET（或 ALIYUN_NLS_TOKEN）',
    }
  }

  try {
    const client = new RPCClient({
      accessKeyId,
      accessKeySecret,
      endpoint: `https://${getMetaHost()}`,
      apiVersion: '2019-02-28',
    })
    const result = (await client.request('CreateToken', {})) as {
      Token?: { Id?: string; ExpireTime?: number }
    }
    const id = result.Token?.Id
    const expireTime = result.Token?.ExpireTime
    if (!id) return { ok: false, error: 'CreateToken 未返回 Token' }

    cachedToken = {
      id,
      expireAt: typeof expireTime === 'number' ? expireTime * 1000 : now + 23 * 60 * 60 * 1000,
    }
    return { ok: true, token: id }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'CreateToken 失败',
    }
  }
}

/** 单次合成上限 300 字，超出时在句号/逗号处智能截断 */
export function clipAliyunNlsText(text: string): string {
  if (text.length <= 300) return text
  const clipped = text.slice(0, 300)
  const lastPunct = Math.max(
    clipped.lastIndexOf('。'),
    clipped.lastIndexOf('！'),
    clipped.lastIndexOf('？'),
    clipped.lastIndexOf('，'),
    clipped.lastIndexOf('；'),
  )
  if (lastPunct >= 80) return clipped.slice(0, lastPunct + 1)
  return clipped
}

export async function synthesizeAliyunNls(text: string): Promise<
  | { ok: true; audioBase64: string; contentType: string; voice: string; clipped: boolean }
  | { ok: false; status: number; error: string; detail?: string }
> {
  const appkey = process.env.ALIYUN_NLS_APPKEY?.trim()
  if (!appkey) {
    return { ok: false, status: 500, error: '缺少 ALIYUN_NLS_APPKEY' }
  }

  const tokenResult = await getAliyunNlsToken()
  if (!tokenResult.ok) {
    return { ok: false, status: 500, error: tokenResult.error }
  }

  const clippedText = clipAliyunNlsText(text)

  const gateway = getGatewayHost()
  const url = `https://${gateway}/stream/v1/tts`

  // REST API 不会自动继承控制台项目配置，必须显式指定发音人与格式；
  // 控制台为「知小妹 / 16k / wav」→ API 用 zhixiaomei；浏览器播放用 mp3 兼容性更好。
  const voice = process.env.ALIYUN_NLS_VOICE?.trim() || 'zhixiaomei'
  const format = process.env.ALIYUN_NLS_FORMAT?.trim() || 'mp3'
  const sampleRate = Number(process.env.ALIYUN_NLS_SAMPLE_RATE?.trim() || '16000')

  const body: Record<string, unknown> = {
    appkey,
    token: tokenResult.token,
    text: clippedText,
    voice,
    format,
    sample_rate: sampleRate,
  }

  const volume = process.env.ALIYUN_NLS_VOLUME?.trim()
  if (volume) body.volume = Number(volume)

  const speechRate = process.env.ALIYUN_NLS_SPEECH_RATE?.trim()
  if (speechRate) body.speech_rate = Number(speechRate)

  const pitchRate = process.env.ALIYUN_NLS_PITCH_RATE?.trim()
  if (pitchRate) body.pitch_rate = Number(pitchRate)

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const contentType = upstream.headers.get('content-type') || ''
  const buffer = Buffer.from(await upstream.arrayBuffer())

  if (!upstream.ok || !contentType.includes('audio')) {
    const detail = buffer.toString('utf8')
    return {
      ok: false,
      status: 502,
      error: '阿里云 TTS 合成失败',
      detail: detail.slice(0, 500),
    }
  }

  return {
    ok: true,
    audioBase64: buffer.toString('base64'),
    contentType: contentType.split(';')[0]?.trim() || 'audio/wav',
    voice,
    clipped: clippedText.length < text.length,
  }
}
