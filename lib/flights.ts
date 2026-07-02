import 'server-only'
import { db } from '@/lib/db'
import { airports, flights } from '@/lib/db/schema'
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm'

export type CabinClass = 'economy' | 'premium' | 'business'

export async function getAirports() {
  return db.select().from(airports).orderBy(asc(airports.city))
}

export async function searchFlights(params: {
  origin: string
  destination: string
  date: string // YYYY-MM-DD
}) {
  const dayStart = new Date(`${params.date}T00:00:00.000Z`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  return db
    .select()
    .from(flights)
    .where(
      and(
        eq(flights.origin, params.origin.toUpperCase()),
        eq(flights.destination, params.destination.toUpperCase()),
        gte(flights.departureTime, dayStart),
        lt(flights.departureTime, dayEnd)
      )
    )
    .orderBy(asc(flights.departureTime))
}

export async function getFlightById(id: string) {
  const rows = await db
    .select()
    .from(flights)
    .where(eq(flights.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function getPopularRoutes() {
  return db
    .select({
      origin: flights.origin,
      destination: flights.destination,
      minPrice: sql<string>`min(${flights.economyPrice})`,
    })
    .from(flights)
    .where(gte(flights.departureTime, new Date()))
    .groupBy(flights.origin, flights.destination)
    .orderBy(sql`min(${flights.economyPrice})`)
    .limit(8)
}

export function priceForCabin(
  flight: { economyPrice: string; premiumPrice: string; businessPrice: string },
  cabin: CabinClass
) {
  if (cabin === 'business') return Number.parseFloat(flight.businessPrice)
  if (cabin === 'premium') return Number.parseFloat(flight.premiumPrice)
  return Number.parseFloat(flight.economyPrice)
}
