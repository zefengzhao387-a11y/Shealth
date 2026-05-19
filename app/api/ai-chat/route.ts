import { NextResponse } from "next/server"

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
const GEMINI_FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"]

function getErrorMessage(raw: string) {
  let detail = raw
  try {
    const parsed = JSON.parse(raw)
    detail = parsed?.error?.message || parsed?.message || raw
  } catch {
    // keep raw text
  }
  return detail
}

async function callOpenAI(userMessage: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "缺少 OPENAI_API_KEY" }
  }

  const upstream = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "你是花间塑的灵息数字人教练。回答温柔、简洁、鼓励式，尽量结合女性健身、情绪陪伴和生活节奏给出可执行建议。",
        },
        { role: "user", content: userMessage },
      ],
    }),
  })

  if (!upstream.ok) {
    const detail = getErrorMessage(await upstream.text())
    return { ok: false as const, status: 502, error: "AI 服务调用失败", detail }
  }

  const data = await upstream.json()
  const reply = data?.choices?.[0]?.message?.content?.trim()
  if (!reply) {
    return { ok: false as const, status: 502, error: "AI 暂无回复" }
  }

  return { ok: true as const, reply }
}

async function requestGemini(model: string, apiKey: string, userMessage: string) {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "你是花间塑的灵息数字人教练。回答温柔、简洁、鼓励式，尽量结合女性健身、情绪陪伴和生活节奏给出可执行建议。",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  })

  if (!upstream.ok) {
    const detail = getErrorMessage(await upstream.text())
    return { ok: false as const, status: upstream.status || 502, error: "AI 服务调用失败", detail }
  }

  const data = await upstream.json()
  const reply = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text || "").join("").trim()
  if (!reply) {
    return { ok: false as const, status: 502, error: "AI 暂无回复" }
  }

  return { ok: true as const, reply }
}

async function callGemini(userMessage: string, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "缺少 GEMINI_API_KEY" }
  }

  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.0-flash"
  const modelCandidates = [configuredModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== configuredModel)]

  let lastError: { ok: false; status: number; error: string; detail?: string } | null = null
  for (const model of modelCandidates) {
    const result = await requestGemini(model, apiKey, userMessage)
    if (result.ok) return result

    const detail = result.detail || ""
    const shouldTryNextModel =
      detail.includes("is not found for API version") ||
      detail.includes("not supported for generateContent") ||
      detail.includes("permission")

    lastError = result
    if (!shouldTryNextModel) break
  }

  return lastError || { ok: false as const, status: 502, error: "AI 服务调用失败" }
}

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message?: string }
    const userMessage = message?.trim()

    if (!userMessage) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
    }

    const provider = (process.env.AI_PROVIDER || "").trim().toLowerCase()
    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const openaiKeyLooksLikeGemini = !!openaiKey?.startsWith("AIza")

    const useGemini = provider === "gemini" || !!geminiKey || (!provider && openaiKeyLooksLikeGemini)
    const result = useGemini
      ? await callGemini(userMessage, !geminiKey && openaiKeyLooksLikeGemini ? openaiKey : undefined)
      : await callOpenAI(userMessage)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: "detail" in result ? result.detail : undefined },
        { status: result.status },
      )
    }

    return NextResponse.json({ reply: result.reply })
  } catch (error) {
    return NextResponse.json(
      {
        error: "服务异常",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    )
  }
}
