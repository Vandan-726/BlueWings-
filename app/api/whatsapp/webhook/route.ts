import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, messages, users } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { handleChat } from "@/lib/chat/openai-engine"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null)
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // 1. Check if the payload is a WhatsApp message status/delivery or an actual text message
    const entry = payload.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]

    // If there is no message object (e.g. status updates, reads, deliveries), acknowledge and return
    if (!message || message.type !== "text") {
      return NextResponse.json({ received: true })
    }

    const fromNumber = message.from // e.g. "919876543210" or "+14155552671"
    const messageText = message.text?.body

    if (!fromNumber || !messageText) {
      return NextResponse.json({ received: true })
    }

    // Standardize phone number format for lookup/matching
    let cleanedPhone = fromNumber.trim()
    if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`
    }

    // 2. Fetch or register user by phone number
    let userRow = await db.select().from(users).where(eq(users.phone, cleanedPhone)).limit(1).then(r => r[0])
    if (!userRow) {
      // Fallback: try looking up without the "+" prefix
      userRow = await db.select().from(users).where(eq(users.phone, fromNumber.trim())).limit(1).then(r => r[0])
    }

    if (!userRow) {
      // Create guest user if they don't exist
      const [newGuest] = await db
        .insert(users)
        .values({
          phone: cleanedPhone,
          name: value.contacts?.[0]?.profile?.name || "WhatsApp Traveler",
        })
        .returning()
      userRow = newGuest
    }

    // 3. Fetch or create WhatsApp conversation
    let conv = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userRow.id), eq(conversations.channel, "whatsapp")))
      .limit(1)
      .then(r => r[0])

    if (!conv) {
      const [newConv] = await db
        .insert(conversations)
        .values({
          userId: userRow.id,
          channel: "whatsapp",
        })
        .returning()
      conv = newConv
    }

    // 4. Save user message to database
    await db.insert(messages).values({
      conversationId: conv.id,
      role: "user",
      content: messageText,
    })

    // 5. Generate reply from the Chat Engine
    const replyText = await handleChat(userRow.id, conv.id, messageText)

    // 6. Save assistant reply to database
    await db.insert(messages).values({
      conversationId: conv.id,
      role: "assistant",
      content: replyText,
    })

    // 7. Post the message back to user via Meta WhatsApp Graph API
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const token = process.env.WHATSAPP_ACCESS_TOKEN

    if (phoneId && token) {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: fromNumber,
          type: "text",
          text: { body: replyText },
        }),
      })

      if (!response.ok) {
        console.error("Meta Graph API error response:", await response.text())
      }
    } else {
      console.warn("WhatsApp Webhook: message received, but WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is missing in env.")
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Error in WhatsApp POST Webhook:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
