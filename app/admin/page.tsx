import { db } from "@/lib/db"
import { bookings, escalations, payments, users, flights } from "@/lib/db/schema"
import { count, desc, eq, sum } from "drizzle-orm"
import { requireUserId } from "@/lib/auth/session"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { formatINR } from "@/lib/format"
import { EscalationList } from "@/components/admin/escalation-list"
import { SystemControls } from "@/components/admin/system-controls"
import { StatsCards } from "@/components/admin/stats-cards"

export const dynamic = "force-dynamic"

export const metadata = { title: "Admin · BlueWings" }

export default async function AdminPage() {
  await requireUserId()

  const [
    [bookingCount],
    [userCount],
    [revenue],
    [openEscalations],
    recentBookings,
    recentEscalations,
    allBookingsDetails,
    allUsersDetails,
    allPaymentsDetails,
    allOpenEscalationsDetails
  ] = await Promise.all([
    db.select({ value: count() }).from(bookings),
    db.select({ value: count() }).from(users),
    db
      .select({ value: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "success")),
    db.select({ value: count() }).from(escalations).where(eq(escalations.status, "open")),
    db
      .select({
        pnr: bookings.pnr,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        createdAt: bookings.createdAt,
        flightNumber: flights.flightNumber,
        origin: flights.origin,
        destination: flights.destination,
      })
      .from(bookings)
      .leftJoin(flights, eq(bookings.flightId, flights.id))
      .orderBy(desc(bookings.createdAt))
      .limit(8),
    db.select().from(escalations).orderBy(desc(escalations.createdAt)).limit(8),
    db
      .select({
        id: bookings.id,
        pnr: bookings.pnr,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        createdAt: bookings.createdAt,
        flightNumber: flights.flightNumber,
        origin: flights.origin,
        destination: flights.destination,
        userName: users.name,
        userPhone: users.phone,
      })
      .from(bookings)
      .leftJoin(flights, eq(bookings.flightId, flights.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(50),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50),
    db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        amount: payments.amount,
        method: payments.method,
        cardLast4: payments.cardLast4,
        createdAt: payments.createdAt,
        pnr: bookings.pnr,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.status, "success"))
      .orderBy(desc(payments.createdAt))
      .limit(50),
    db
      .select({
        id: escalations.id,
        reason: escalations.reason,
        channel: escalations.channel,
        status: escalations.status,
        createdAt: escalations.createdAt,
        bookingId: escalations.bookingId,
      })
      .from(escalations)
      .where(eq(escalations.status, "open"))
      .orderBy(desc(escalations.createdAt))
      .limit(50),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold text-foreground text-balance">Operations overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bookings, revenue and escalations at a glance.</p>

        <StatsCards
          bookingCount={bookingCount?.value ?? 0}
          userCount={userCount?.value ?? 0}
          revenue={Number(revenue?.value ?? 0)}
          openEscalationsCount={openEscalations?.value ?? 0}
          bookings={allBookingsDetails}
          users={allUsersDetails}
          payments={allPaymentsDetails}
          escalations={allOpenEscalationsDetails}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="recent-bookings">
            <h2 id="recent-bookings" className="text-lg font-semibold text-foreground">
              Recent bookings
            </h2>
            <div className="mt-4 overflow-hidden rounded-card border border-border shadow-card">
              {recentBookings.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary text-muted-foreground">
                      <th scope="col" className="px-4 py-3 font-medium">
                        PNR
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Route
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.pnr} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono font-medium text-foreground">{b.pnr}</td>
                        <td className="px-4 py-3 text-foreground">
                          {b.origin} → {b.destination}{" "}
                          <span className="text-muted-foreground">{b.flightNumber}</span>
                        </td>
                        <td className="px-4 py-3 capitalize text-foreground">{b.status}</td>
                        <td className="px-4 py-3 text-foreground">{formatINR(Number(b.totalAmount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section aria-labelledby="escalations-heading" className="flex flex-col">
            <h2 id="escalations-heading" className="text-lg font-semibold text-foreground mb-4">
              Escalations
            </h2>
            <EscalationList initialEscalations={recentEscalations} />
          </section>
        </div>

        <div className="mt-10">
          <SystemControls />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
