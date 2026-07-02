import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { bookings, flights } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { SiteHeader } from "@/components/layout/site-header"
import { formatINR, formatTime, formatShortDate } from "@/lib/format"
import { Plane, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Your trips – BlueWings" }

const statusStyles: Record<string, string> = {
  confirmed: "bg-foreground text-background",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-primary/10 text-primary",
  payment_failed: "bg-primary/10 text-primary",
}

export default async function TripsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=/trips")

  const rows = await db
    .select({ booking: bookings, flight: flights })
    .from(bookings)
    .leftJoin(flights, eq(bookings.flightId, flights.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.createdAt))

  const upcoming = rows.filter(
    (r) => r.booking.status === "confirmed" && r.flight && r.flight.departureTime.getTime() > Date.now(),
  )
  const past = rows.filter((r) => !upcoming.includes(r))

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-semibold text-foreground">Trips</h1>

        {rows.length === 0 && (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-8">
            <Plane className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">No trips yet</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                When you book a flight, it will show up here.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start searching
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <section aria-label="Upcoming trips" className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Upcoming</h2>
            <div className="flex flex-col gap-4">
              {upcoming.map(({ booking, flight }) => (
                <TripCard key={booking.id} booking={booking} flight={flight} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section aria-label="Past and other bookings">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Past and other bookings</h2>
            <div className="flex flex-col gap-4">
              {past.map(({ booking, flight }) => (
                <TripCard key={booking.id} booking={booking} flight={flight} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}

function TripCard({
  booking,
  flight,
}: {
  booking: typeof bookings.$inferSelect
  flight: typeof flights.$inferSelect | null
}) {
  return (
    <Link
      href={`/trips/${booking.pnr}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              statusStyles[booking.status] ?? "bg-muted text-muted-foreground",
            )}
          >
            {booking.status.replace("_", " ")}
          </span>
          <span className="text-xs font-medium text-muted-foreground">PNR {booking.pnr}</span>
        </div>
        {flight ? (
          <>
            <p className="truncate text-base font-semibold text-foreground">
              {flight.origin} → {flight.destination}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatShortDate(flight.departureTime.toISOString())} · {formatTime(flight.departureTime.toISOString())} ·{" "}
              {flight.flightNumber} · <span className="capitalize">{booking.cabin}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Flight details unavailable</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-base font-semibold text-foreground">{formatINR(Number(booking.totalAmount))}</span>
        <ArrowRight
          className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
