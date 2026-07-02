import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth/session"
import { confirmPayment } from "@/lib/bookings"

const schema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["card", "upi", "netbanking"]),
  cardLast4: z.string().length(4).optional(),
  // Mock payment: card number ending in 0000 simulates a failure
  outcome: z.enum(["success", "failure"]),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // Simulate gateway latency
    await new Promise((r) => setTimeout(r, 1200))
    const result = await confirmPayment({ userId: user.id, ...parsed.data })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment failed"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
