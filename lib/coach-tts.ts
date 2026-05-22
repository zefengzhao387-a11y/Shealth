/** 数字人语音播放 — 对接 /api/tts，口型由 audio.currentTime 驱动 */

export type CoachSpeechController = {
  getElapsedSec: () => number
  durationMs: number
  stop: () => void
  done: Promise<void>
  provider: 'aliyun' | 'browser'
}

let activeAudio: HTMLAudioElement | null = null
let activeRevoke: (() => void) | null = null

function stopActiveSpeech() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ""
    activeAudio = null
  }
  activeRevoke?.()
  activeRevoke = null
}

function loadAudioDuration(audio: HTMLAudioElement): Promise<number> {
  return new Promise((resolve) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      resolve(audio.duration * 1000)
      return
    }
    const onMeta = () => {
      audio.removeEventListener("loadedmetadata", onMeta)
      resolve(Number.isFinite(audio.duration) ? audio.duration * 1000 : 0)
    }
    audio.addEventListener("loadedmetadata", onMeta)
    window.setTimeout(() => resolve(0), 4000)
  })
}

/** 根据文件头修正 MIME，避免阿里云返回 PCM 却标成 audio/mpeg 导致无法播放 */
function detectAudioMime(bytes: Uint8Array, fallback = "audio/mpeg"): string {
  if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return "audio/mpeg"
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg"
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return "audio/wav"
  }
  return fallback
}

function decodeAudioBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** 浏览器 SpeechSynthesis 兜底（仅 API 完全不可用时） */
function speakWithBrowser(text: string): CoachSpeechController {
  stopActiveSpeech()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "zh-CN"
  utterance.rate = 1
  const voices = window.speechSynthesis.getVoices()
  const zhVoice = voices.find((v) => v.lang.startsWith("zh"))
  if (zhVoice) utterance.voice = zhVoice

  const startAt = performance.now()
  const durationMs = Math.min(Math.max(text.length * 180, 2200), 28000)
  let stopped = false
  let resolveDone!: () => void
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  utterance.onend = () => {
    if (!stopped) resolveDone()
  }
  utterance.onerror = () => {
    if (!stopped) resolveDone()
  }

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)

  return {
    provider: "browser",
    getElapsedSec: () => (performance.now() - startAt) / 1000,
    durationMs,
    stop: () => {
      stopped = true
      window.speechSynthesis.cancel()
      resolveDone()
    },
    done,
  }
}

async function playAudioBlob(bytes: Uint8Array, contentType: string): Promise<CoachSpeechController> {
  const mime = detectAudioMime(bytes, contentType || "audio/mpeg")
  const blob = new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  activeRevoke = () => URL.revokeObjectURL(url)

  const audio = new Audio(url)
  activeAudio = audio

  let resolveDone!: () => void
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  audio.onended = () => resolveDone()
  audio.onerror = () => resolveDone()

  await audio.play()
  const durationMs = await loadAudioDuration(audio)

  return {
    provider: "aliyun",
    getElapsedSec: () => audio.currentTime,
    durationMs: durationMs || Math.min(Math.max(bytes.length / 32, 2200), 28000),
    stop: () => {
      stopActiveSpeech()
      resolveDone()
    },
    done,
  }
}

/** 请求 TTS 并播放；失败时回退到浏览器朗读 */
export async function playCoachSpeech(text: string): Promise<CoachSpeechController> {
  stopActiveSpeech()

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
      console.warn("[coach-tts] 阿里云 TTS 失败，回退浏览器朗读:", errBody.error || res.status, errBody.detail || "")
      return speakWithBrowser(text)
    }

    const data = (await res.json()) as {
      audioBase64: string
      contentType?: string
      provider?: string
    }
    const bytes = decodeAudioBase64(data.audioBase64)
    return await playAudioBlob(bytes, data.contentType || "audio/mpeg")
  } catch (e) {
    console.warn("[coach-tts] 阿里云音频播放失败，回退浏览器朗读:", e)
    return speakWithBrowser(text)
  }
}

export function stopCoachSpeech() {
  stopActiveSpeech()
  window.speechSynthesis?.cancel()
}
