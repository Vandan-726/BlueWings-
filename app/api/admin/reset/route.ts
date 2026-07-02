import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import {
  bookings,
  passengers,
  seats,
  payments,
  messages,
  conversations,
  escalations,
  notifications,
  auditLogs,
} from "@/lib/db/schema"

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Reset transactional records
    await db.delete(auditLogs)
    await db.delete(escalations)
    await db.delete(messages)
    await db.delete(conversations)
    await db.delete(notifications)
    await db.delete(payments)
    await db.delete(passengers)
    await db.delete(seats)
    await db.delete(bookings)

    return NextResponse.json({ success: true, message: "Transactional data reset successfully" })
  } catch (err: any) {
    console.error("Error resetting system data:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
