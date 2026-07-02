import { redirect, notFound } from "next/navigation"
import { getSessionUser } from "@/lib/auth/session"
import { getBookingWithDetails } from "@/lib/bookings"
import { SiteHeader } from "@/components/layout/site-header"
import { BoardingPass } from "@/components/trips/boarding-pass"
import { ManageBooking } from "@/components/trips/manage-booking"
import { formatINR } from "@/lib/format"
import { CheckCircle2 } from "lucide-react"

export const metadata = { title: "Trip details – BlueWings" }

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pnr: string }>
  searchParams: Promise<{ new?: string }>
}) {
  const [{ pnr }, sp, user] = await Promise.all([params, searchParams, getSessionUser()])
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${pnr}`)}`)

  const details = await getBookingWithDetails(user.id, pnr)
  if (!details || !details.flight) notFound()
  const { booking, flight, passengers } = details

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {sp.new === "1" && booking.status === "confirmed" && (
          <div
            role="status"
            className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-secondary px-5 py-4"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold">Booking confirmed.</span> Your e-ticket has been sent to{" "}
              {booking.contactEmail ?? "your email"}. PNR{" "}
              <span className="font-semibold tracking-widest">{booking.pnr}</span>.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {flight.origin} → {flight.destination}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              PNR <span className="font-semibold tracking-widest text-foreground">{booking.pnr}</span> · Total paid{" "}
              <span className="font-semibold text-foreground">{formatINR(Number(booking.totalAmount))}</span>
              {booking.status === "cancelled" && booking.refundAmount && (
                <>
                  {" "}
                  · Refunded{" "}
                  <span className="font-semibold text-foreground">{formatINR(Number(booking.refundAmount))}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {booking.status === "confirmed" && (
          <section aria-label="Boarding passes" className="mb-10 flex flex-col gap-4">
            {passengers.map((p) => (
              <BoardingPass
                key={p.id}
                pnr={booking.pnr}
                flightNumber={flight.flightNumber}
                origin={flight.origin}
                destination={flight.destination}
                departureIso={flight.departureTime.toISOString()}
                arrivalIso={flight.arrivalTime.toISOString()}
                cabin={booking.cabin}
                passengerName={`${p.firstName} ${p.lastName}`}
                seat={p.seatNumber}
              />
            ))}
          </section>
        )}

        <section aria-label="Manage booking">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Manage booking</h2>
          <ManageBooking
            pnr={booking.pnr}
            bookingStatus={booking.status}
            passengers={passengers.map((p) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              seatNumber: p.seatNumber,
              meal: p.meal,
              extraBaggageKg: p.extraBaggageKg,
            }))}
            departureIso={flight.departureTime.toISOString()}
          />
        </section>
      </main>
    </>
  )
}
