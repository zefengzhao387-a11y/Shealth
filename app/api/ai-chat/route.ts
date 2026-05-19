import { NextResponse } from "next/server"

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message?: string }
    const userMessage = message?.trim()

    if (!userMessage) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "缺少 OPENAI_API_KEY" }, { status: 500 })
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
      const detail = await upstream.text()
      return NextResponse.json({ error: "AI 服务调用失败", detail }, { status: 502 })
    }

    const data = await upstream.json()
    const reply = data?.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json({ error: "AI 暂无回复" }, { status: 502 })
    }

    return NextResponse.json({ reply })
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
