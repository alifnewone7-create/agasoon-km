import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { clearTgLionCreds, getTgLionCreds, maskKey, saveTgLionCreds } from "@/lib/api-config"

// Buy Api credentials (tg-lion). Stored in Neon, editable + deletable from the
// panel. The raw key is never sent back to the browser — only a masked preview.
export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { apiKey, userId } = await getTgLionCreds()
    return NextResponse.json({
      configured: Boolean(apiKey && userId),
      apiKeyMasked: maskKey(apiKey),
      userId,
      baseUrl: (process.env.TGLION_BASE_URL || "https://tg-lion.net").replace(/\/+$/, ""),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load settings." }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const apiKey = String(body?.apiKey ?? "").trim()
  const userId = String(body?.userId ?? "").trim()
  if (!apiKey || !userId) {
    return NextResponse.json({ error: "Both the tg-lion API key and user ID are required." }, { status: 400 })
  }
  try {
    await saveTgLionCreds(apiKey, userId)
    return NextResponse.json({ ok: true, apiKeyMasked: maskKey(apiKey), userId, configured: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to save." }, { status: 500 })
  }
}

export async function DELETE() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await clearTgLionCreds()
    return NextResponse.json({ ok: true, configured: false })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to delete." }, { status: 500 })
  }
}
