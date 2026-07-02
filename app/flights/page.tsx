import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FlightSearchBar } from '@/components/search/flight-search-bar'
import { FlightCard } from '@/components/search/flight-card'
import { getAirports, searchFlights } from '@/lib/flights'
import { formatDateLong } from '@/lib/format'

export const metadata = {
  title: 'Flight results — BlueWings',
}

export default async function FlightResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    origin?: string
    destination?: string
    date?: string
    travelers?: string
  }>
}) {
  const params = await searchParams
  const origin = params.origin?.toUpperCase() ?? ''
  const destination = params.destination?.toUpperCase() ?? ''
  const date = params.date ?? ''
  const travelers = Math.max(1, Number(params.travelers) || 1)

  const airportList = await getAirports()
  const validSearch =
    origin.length === 3 && destination.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(date)

  const results = validSearch
    ? await searchFlights({ origin, destination, date })
    : []

  const originCity =
    airportList.find((a) => a.code === origin)?.city ?? origin
  const destinationCity =
    airportList.find((a) => a.code === destination)?.city ?? destination

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <div className="border-b border-hairline-soft">
          <div className="mx-auto w-full max-w-7xl px-6 py-5 md:px-10">
            <FlightSearchBar
              airports={airportList}
              defaultOrigin={origin}
              defaultDestination={destination}
              defaultDate={date}
              defaultTravelers={travelers}
              compact
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          {validSearch ? (
            <>
              <h1 className="text-xl font-semibold text-ink">
                {originCity} to {destinationCity}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateLong(`${date}T00:00:00.000Z`)} · {travelers}{' '}
                {travelers === 1 ? 'traveler' : 'travelers'} ·{' '}
                {results.length} {results.length === 1 ? 'flight' : 'flights'}{' '}
                found
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {results.length > 0 ? (
                  results.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      travelers={travelers}
                      date={date}
                    />
                  ))
                ) : (
                  <div className="rounded-md border border-hairline bg-surface-soft p-10 text-center">
                    <p className="text-lg font-semibold text-ink">
                      No flights on this route for that date
                    </p>
                    <p className="mt-1 text-sm text-body">
                      Try a nearby date, or ask our AI assistant to find
                      alternatives.
                    </p>
                    <Link
                      href="/assistant"
                      className="mt-4 inline-flex h-11 items-center rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-active"
                    >
                      Ask the assistant
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-hairline bg-surface-soft p-10 text-center">
              <p className="text-lg font-semibold text-ink">
                Start your search
              </p>
              <p className="mt-1 text-sm text-body">
                Choose where you&apos;re flying from, your destination, and a
                date.
              </p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
