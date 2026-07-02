import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth/session"
import { createBooking } from "@/lib/bookings"
import { db } from "@/lib/db"
import { bookings, flights } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

const createSchema = z.object({
  flightId: z.string().min(1),
  cabin: z.enum(["economy", "premium", "business"]),
  contactEmail: z.string().email().optional(),
  passengers: z
    .array(
      z.object({
        firstName: z.string().min(1).max(60),
        lastName: z.string().min(1).max(60),
        gender: z.string().optional(),
        age: z.number().int().min(0).max(120).optional(),
        seatNumber: z.string().max(4).optional(),
      }),
    )
    .min(1)
    .max(9),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const booking = await createBooking({ userId: user.id, ...parsed.data })
    return NextResponse.json({ booking }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking failed"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({ booking: bookings, flight: flights })
    .from(bookings)
    .leftJoin(flights, eq(bookings.flightId, flights.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.createdAt))

  return NextResponse.json({ bookings: rows })
}
