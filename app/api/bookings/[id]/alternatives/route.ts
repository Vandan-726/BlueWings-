import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { getBookingWithDetails } from "@/lib/bookings"
import { getAlternativeFlights } from "@/lib/servicing"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const details = await getBookingWithDetails(user.id, id)
  if (!details) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  const alternatives = await getAlternativeFlights(user.id, details.booking.id)
  return NextResponse.json({ alternatives })
}
