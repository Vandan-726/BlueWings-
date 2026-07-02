import { redirect, notFound } from "next/navigation"
import { getSessionUser } from "@/lib/auth/session"
import { getFlightById, getSeatMap } from "@/lib/bookings"
import { BookingFlow } from "@/components/booking/booking-flow"
import { SiteHeader } from "@/components/layout/site-header"

export const metadata = { title: "Complete your booking – BlueWings" }

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>
  searchParams: Promise<{ cabin?: string; pax?: string; travelers?: string }>
}) {
  const [{ flightId }, sp, user] = await Promise.all([params, searchParams, getSessionUser()])

  const travelersParam = sp.pax ?? sp.travelers ?? "1"
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/book/${flightId}?cabin=${sp.cabin ?? "economy"}&pax=${travelersParam}`)}`)
  }

  const cabin = (["economy", "premium", "business"].includes(sp.cabin ?? "") ? sp.cabin : "economy") as
    | "economy"
    | "premium"
    | "business"
  const paxCount = Math.min(Math.max(Number(travelersParam) || 1, 1), 9)

  const flight = await getFlightById(flightId)
  if (!flight) notFound()

  const occupied = (await getSeatMap(flightId)).map((s) => s.seatNumber)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <BookingFlow
          flight={{
            ...flight,
            departureTime: flight.departureTime.toISOString(),
            arrivalTime: flight.arrivalTime.toISOString(),
          }}
          occupied={occupied}
          cabin={cabin}
          paxCount={paxCount}
        />
      </main>
    </>
  )
}
