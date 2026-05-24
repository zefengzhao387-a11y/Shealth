import { NextResponse } from "next/server"
import { synthesizeAliyunNls } from "@/lib/aliyun-nls"

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"

const COACH_TTS_INSTRUCTIONS =
  process.env.OPENAI_TTS_INSTRUCTIONS ||
  "用温柔、自然、像面对面数字人闺蜜一样的语气说普通话，语速适中，有轻微情感起伏，不要播音腔。"

async function synthesizeOpenAI(text: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "缺少 OPENAI_API_KEY" }
  }

  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts"
  const voice = process.env.OPENAI_TTS_VOICE || "shimmer"
  const speed = Number(process.env.OPENAI_TTS_SPEED || "0.96")
  const useInstructions = model.includes("gpt-4o") || model.includes("gpt-4o-mini-tts")

  const body: Record<string, unknown> = {
    model,
    voice,
    input: text.slice(0, 4096),
    response_format: "mp3",
    speed: Number.isFinite(speed) ? Math.min(Math.max(speed, 0.85), 1.1) : 0.96,
  }
  if (useInstructions) {
    body.instructions = COACH_TTS_INSTRUCTIONS
  }

  const upstream = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    const detail = await upstream.text()
    return { ok: false as const, status: 502, error: "TTS 合成失败", detail }
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())
  return {
    ok: true as const,
    provider: "openai" as const,
    model,
    voice,
    contentType: "audio/mpeg",
    audioBase64: buffer.toString("base64"),
  }
}

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string }
    const content = text?.trim()

    if (!content) {
      return NextResponse.json({ error: "缺少 text" }, { status: 400 })
    }

    const provider = (process.env.TTS_PROVIDER || "aliyun").trim().toLowerCase()

    if (provider === "aliyun") {
      const result = await synthesizeAliyunNls(content)
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, detail: result.detail },
          { status: result.status },
        )
      }
      return NextResponse.json({
        provider: "aliyun",
        voice: result.voice,
        contentType: result.contentType,
        audioBase64: result.audioBase64,
        clipped: result.clipped,
      })
    }

    if (provider === "openai") {
      const result = await synthesizeOpenAI(content)
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, detail: "detail" in result ? result.detail : undefined },
          { status: result.status },
        )
      }
      return NextResponse.json({
        provider: result.provider,
        model: result.model,
        voice: result.voice,
        contentType: result.contentType,
        audioBase64: result.audioBase64,
      })
    }

    return NextResponse.json(
      {
        error: "未配置 TTS 服务",
        detail: "请在 .env.local 设置 TTS_PROVIDER=aliyun 或 openai",
      },
      { status: 501 },
    )
  } catch (error) {
    console.error("[tts] error:", error)
    return NextResponse.json({ error: "TTS 服务异常" }, { status: 500 })
  }
}
