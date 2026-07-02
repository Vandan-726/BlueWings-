import { db } from "@/lib/db"
import { bookings, passengers, payments, seats, flights, notifications, auditLogs } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"

export function generatePnr(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let pnr = ""
  for (let i = 0; i < 6; i++) {
    pnr += chars[Math.floor(Math.random() * chars.length)]
  }
  return pnr
}

export type PassengerInput = {
  firstName: string
  lastName: string
  gender?: string
  age?: number
  seatNumber?: string
}

export async function getFlightById(flightId: string) {
  const rows = await db.select().from(flights).where(eq(flights.id, flightId)).limit(1)
  return rows[0] ?? null
}

export async function getSeatMap(flightId: string) {
  const occupied = await db
    .select({ seatNumber: seats.seatNumber, status: seats.status })
    .from(seats)
    .where(eq(seats.flightId, flightId))
  return occupied
}

export async function createBooking(params: {
  userId: string
  flightId: string
  cabin: string
  passengers: PassengerInput[]
  contactEmail?: string
}) {
  const flight = await getFlightById(params.flightId)
  if (!flight) throw new Error("Flight not found")

  const requestedSeats = params.passengers.map((p) => p.seatNumber).filter(Boolean) as string[]

  if (requestedSeats.length > 0) {
    const taken = await db
      .select({ seatNumber: seats.seatNumber })
      .from(seats)
      .where(and(eq(seats.flightId, params.flightId), inArray(seats.seatNumber, requestedSeats)))
    if (taken.length > 0) {
      throw new Error(`Seat(s) no longer available: ${taken.map((t) => t.seatNumber).join(", ")}`)
    }
  }

  const perSeatPrice =
    params.cabin === "business"
      ? Number(flight.businessPrice)
      : params.cabin === "premium"
        ? Number(flight.premiumPrice)
        : Number(flight.economyPrice)

  const totalAmount = perSeatPrice * params.passengers.length

  const pnr = generatePnr()
  const [booking] = await db
    .insert(bookings)
    .values({
      pnr,
      userId: params.userId,
      flightId: params.flightId,
      status: "pending",
      cabin: params.cabin,
      totalAmount: totalAmount.toFixed(2),
      contactEmail: params.contactEmail,
    })
    .returning()

  for (const p of params.passengers) {
    await db.insert(passengers).values({
      bookingId: booking.id,
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.gender,
      age: p.age,
      seatNumber: p.seatNumber,
    })
  }

  if (requestedSeats.length > 0) {
    for (const s of requestedSeats) {
      await db
        .insert(seats)
        .values({
          flightId: params.flightId,
          seatNumber: s,
          cabin: params.cabin,
          status: "booked",
          bookingId: booking.id,
        })
        .onConflictDoNothing()
    }
  }

  await db.insert(auditLogs).values({
    userId: params.userId,
    action: "booking.created",
    entity: "booking",
    entityId: booking.id,
    details: { pnr, flightId: params.flightId, totalAmount },
  })

  return booking
}

export async function confirmPayment(params: {
  userId: string
  bookingId: string
  method: string
  cardLast4?: string
  outcome: "success" | "failure"
}) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, params.bookingId), eq(bookings.userId, params.userId)))
    .limit(1)
  if (!booking) throw new Error("Booking not found")
  if (booking.status !== "pending") throw new Error("Booking is not awaiting payment")

  const status = params.outcome === "success" ? "success" : "failed"

  const [payment] = await db
    .insert(payments)
    .values({
      bookingId: booking.id,
      userId: params.userId,
      amount: booking.totalAmount,
      method: params.method,
      status,
      cardLast4: params.cardLast4,
    })
    .returning()

  if (params.outcome === "success") {
    await db
      .update(bookings)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))

    await db.insert(notifications).values({
      userId: params.userId,
      type: "booking",
      title: "Booking confirmed",
      body: `Your booking ${booking.pnr} is confirmed. Have a great trip!`,
    })
  } else {
    // release held seats on failure
    await db.delete(seats).where(eq(seats.bookingId, booking.id))
    await db
      .update(bookings)
      .set({ status: "payment_failed", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))
  }

  await db.insert(auditLogs).values({
    userId: params.userId,
    action: `payment.${status}`,
    entity: "payment",
    entityId: payment.id,
    details: { bookingId: booking.id, amount: booking.totalAmount },
  })

  return { payment, status }
}

export async function getBookingWithDetails(userId: string, pnrOrId: string) {
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.userId, userId),
        pnrOrId.length === 6 ? eq(bookings.pnr, pnrOrId.toUpperCase()) : eq(bookings.id, pnrOrId),
      ),
    )
    .limit(1)
  const booking = rows[0]
  if (!booking) return null

  const [flight, pax] = await Promise.all([
    getFlightById(booking.flightId),
    db.select().from(passengers).where(eq(passengers.bookingId, booking.id)),
  ])

  return { booking, flight, passengers: pax }
}
