import { db } from "@/lib/db"
import { bookings, passengers, seats, notifications, auditLogs, flights } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { getFlightById } from "@/lib/bookings"

async function getOwnedBooking(userId: string, bookingId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .limit(1)
  if (!booking) throw new Error("Booking not found")
  return booking
}

/** Refund policy: >72h = 90%, 24–72h = 50%, <24h = 10% */
export function computeRefundPercent(departure: Date): number {
  const hours = (departure.getTime() - Date.now()) / 36e5
  if (hours > 72) return 0.9
  if (hours > 24) return 0.5
  return 0.1
}

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await getOwnedBooking(userId, bookingId)
  if (booking.status !== "confirmed") throw new Error("Only confirmed bookings can be cancelled")

  const flight = await getFlightById(booking.flightId)
  if (!flight) throw new Error("Flight not found")

  const pct = computeRefundPercent(flight.departureTime)
  const refund = Number(booking.totalAmount) * pct

  await db.delete(seats).where(eq(seats.bookingId, booking.id))
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      refundAmount: refund.toFixed(2),
      refundStatus: "processed",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id))

  await db.insert(notifications).values({
    userId,
    type: "refund",
    title: "Booking cancelled",
    body: `Booking ${booking.pnr} cancelled. Refund of ₹${refund.toFixed(0)} (${Math.round(pct * 100)}%) initiated to your original payment method.`,
  })

  await db.insert(auditLogs).values({
    userId,
    action: "booking.cancelled",
    entity: "booking",
    entityId: booking.id,
    details: { pnr: booking.pnr, refund, refundPercent: pct },
  })

  return { refund, refundPercent: pct }
}

export async function changeSeat(userId: string, bookingId: string, passengerId: number, newSeat: string) {
  const booking = await getOwnedBooking(userId, bookingId)
  if (booking.status !== "confirmed") throw new Error("Booking is not active")

  const [pax] = await db
    .select()
    .from(passengers)
    .where(and(eq(passengers.id, passengerId), eq(passengers.bookingId, booking.id)))
    .limit(1)
  if (!pax) throw new Error("Passenger not found")

  const [taken] = await db
    .select()
    .from(seats)
    .where(and(eq(seats.flightId, booking.flightId), eq(seats.seatNumber, newSeat)))
    .limit(1)
  if (taken) throw new Error(`Seat ${newSeat} is already taken`)

  if (pax.seatNumber) {
    await db
      .delete(seats)
      .where(
        and(eq(seats.flightId, booking.flightId), eq(seats.seatNumber, pax.seatNumber), eq(seats.bookingId, booking.id)),
      )
  }

  await db.insert(seats).values({
    flightId: booking.flightId,
    seatNumber: newSeat,
    cabin: booking.cabin,
    status: "booked",
    bookingId: booking.id,
  })
  await db.update(passengers).set({ seatNumber: newSeat }).where(eq(passengers.id, pax.id))

  await db.insert(auditLogs).values({
    userId,
    action: "booking.seat_changed",
    entity: "booking",
    entityId: booking.id,
    details: { passengerId, from: pax.seatNumber, to: newSeat },
  })

  return { seatNumber: newSeat }
}

export async function updateAncillaries(
  userId: string,
  bookingId: string,
  passengerId: number,
  updates: { meal?: string; extraBaggageKg?: number },
) {
  const booking = await getOwnedBooking(userId, bookingId)
  if (booking.status !== "confirmed") throw new Error("Booking is not active")

  const [pax] = await db
    .select()
    .from(passengers)
    .where(and(eq(passengers.id, passengerId), eq(passengers.bookingId, booking.id)))
    .limit(1)
  if (!pax) throw new Error("Passenger not found")

  await db
    .update(passengers)
    .set({
      ...(updates.meal !== undefined ? { meal: updates.meal } : {}),
      ...(updates.extraBaggageKg !== undefined ? { extraBaggageKg: updates.extraBaggageKg } : {}),
    })
    .where(eq(passengers.id, pax.id))

  await db.insert(auditLogs).values({
    userId,
    action: "booking.ancillaries_updated",
    entity: "booking",
    entityId: booking.id,
    details: { passengerId, ...updates },
  })

  return { ok: true }
}

export async function rescheduleBooking(userId: string, bookingId: string, newFlightId: string) {
  const booking = await getOwnedBooking(userId, bookingId)
  if (booking.status !== "confirmed") throw new Error("Booking is not active")

  const [oldFlight, newFlight] = await Promise.all([getFlightById(booking.flightId), getFlightById(newFlightId)])
  if (!newFlight) throw new Error("New flight not found")
  if (!oldFlight) throw new Error("Original flight not found")
  if (newFlight.origin !== oldFlight.origin || newFlight.destination !== oldFlight.destination) {
    throw new Error("Reschedule must be on the same route")
  }

  const paxRows = await db.select().from(passengers).where(eq(passengers.bookingId, booking.id))
  const perSeatNew =
    booking.cabin === "business"
      ? Number(newFlight.businessPrice)
      : booking.cabin === "premium"
        ? Number(newFlight.premiumPrice)
        : Number(newFlight.economyPrice)
  const newTotal = perSeatNew * paxRows.length
  const fareDifference = newTotal - Number(booking.totalAmount)

  // Release old seats; seats on the new flight are auto-assigned at check-in
  await db.delete(seats).where(eq(seats.bookingId, booking.id))
  for (const p of paxRows) {
    await db.update(passengers).set({ seatNumber: null }).where(eq(passengers.id, p.id))
  }

  await db
    .update(bookings)
    .set({ flightId: newFlightId, totalAmount: newTotal.toFixed(2), updatedAt: new Date() })
    .where(eq(bookings.id, booking.id))

  await db.insert(notifications).values({
    userId,
    type: "booking",
    title: "Flight rescheduled",
    body: `Booking ${booking.pnr} moved to ${newFlight.flightNumber}. ${
      fareDifference > 0
        ? `Fare difference of ₹${fareDifference.toFixed(0)} charged.`
        : fareDifference < 0
          ? `₹${Math.abs(fareDifference).toFixed(0)} refunded as fare difference.`
          : "No fare difference."
    }`,
  })

  await db.insert(auditLogs).values({
    userId,
    action: "booking.rescheduled",
    entity: "booking",
    entityId: booking.id,
    details: { from: booking.flightId, to: newFlightId, fareDifference },
  })

  return { fareDifference, newFlight }
}

export async function getAlternativeFlights(userId: string, bookingId: string) {
  const booking = await getOwnedBooking(userId, bookingId)
  const flight = await getFlightById(booking.flightId)
  if (!flight) return []

  const alternatives = await db
    .select()
    .from(flights)
    .where(and(eq(flights.origin, flight.origin), eq(flights.destination, flight.destination)))

  return alternatives
    .filter((f) => f.id !== flight.id && f.departureTime.getTime() > Date.now())
    .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime())
    .slice(0, 10)
}
