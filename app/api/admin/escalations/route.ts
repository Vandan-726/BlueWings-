import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { escalations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updated = await db
      .update(escalations)
      .set({ status })
      .where(eq(escalations.id, Number(id)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Escalation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, escalation: updated[0] })
  } catch (err: any) {
    console.error("Error updating escalation:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
