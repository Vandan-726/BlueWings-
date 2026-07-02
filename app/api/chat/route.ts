import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { conversations, messages } from "@/lib/db/schema"
import { handleChat } from "@/lib/chat/openai-engine"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    const { text, conversationId } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid message text" }, { status: 400 })
    }

    let activeConvId = conversationId
    let conv

    // 1. Fetch or create conversation
    if (activeConvId) {
      const rows = await db.select().from(conversations).where(eq(conversations.id, activeConvId)).limit(1)
      conv = rows[0]
    }

    if (!conv) {
      const [newConv] = await db
        .insert(conversations)
        .values({
          userId: user?.id ?? "anonymous",
          channel: "web",
        })
        .returning()
      conv = newConv
      activeConvId = newConv.id
    }

    // 2. Save user message in database
    await db.insert(messages).values({
      conversationId: activeConvId,
      role: "user",
      content: text,
    })

    // 3. Process message through Chat Engine
    const replyText = await handleChat(user?.id ?? null, activeConvId, text)

    // 4. Save assistant reply in database
    await db.insert(messages).values({
      conversationId: activeConvId,
      role: "assistant",
      content: replyText,
    })

    // 5. Fetch full conversation history to return
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, activeConvId))
      .orderBy(messages.createdAt)

    return NextResponse.json({
      conversationId: activeConvId,
      reply: replyText,
      messages: history.map((m) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content,
        // Match the shape expected by chat component
        parts: [{ type: "text", text: m.content }],
      })),
    })
  } catch (err: any) {
    console.error("Error in /api/chat:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
