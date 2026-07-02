import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth/session"
import { getBookingWithDetails } from "@/lib/bookings"
import { cancelBooking, changeSeat, updateAncillaries, rescheduleBooking } from "@/lib/servicing"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const details = await getBookingWithDetails(user.id, id)
  if (!details) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  return NextResponse.json(details)
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("change_seat"), passengerId: z.number().int(), seatNumber: z.string().min(2).max(4) }),
  z.object({
    action: z.literal("update_ancillaries"),
    passengerId: z.number().int(),
    meal: z.string().max(30).optional(),
    extraBaggageKg: z.number().int().min(0).max(30).optional(),
  }),
  z.object({ action: z.literal("reschedule"), newFlightId: z.string().min(1) }),
])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const details = await getBookingWithDetails(user.id, id)
  if (!details) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  const bookingId = details.booking.id

  const body = await req.json().catch(() => null)
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const input = parsed.data
    switch (input.action) {
      case "cancel":
        return NextResponse.json(await cancelBooking(user.id, bookingId))
      case "change_seat":
        return NextResponse.json(await changeSeat(user.id, bookingId, input.passengerId, input.seatNumber.toUpperCase()))
      case "update_ancillaries":
        return NextResponse.json(
          await updateAncillaries(user.id, bookingId, input.passengerId, {
            meal: input.meal,
            extraBaggageKg: input.extraBaggageKg,
          }),
        )
      case "reschedule":
        return NextResponse.json(await rescheduleBooking(user.id, bookingId, input.newFlightId))
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Action failed"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
