import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30)
  return NextResponse.json({ notifications: rows })
}

export async function PATCH() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
  return NextResponse.json({ ok: true })
}
