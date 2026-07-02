import Link from 'next/link'
import {
  formatDuration,
  formatINR,
  formatTime,
} from '@/lib/format'

export type FlightRow = {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  departureTime: string | Date
  arrivalTime: string | Date
  durationMinutes: number
  aircraft: string
  stops: number
  economyPrice: string
  premiumPrice: string
  businessPrice: string
}

export function FlightCard({
  flight,
  travelers,
  date,
}: {
  flight: FlightRow
  travelers: number
  date: string
}) {
  return (
    <article className="rounded-md border border-hairline bg-background p-5 transition-shadow hover:shadow-tier md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Route + times */}
        <div className="flex flex-1 items-center gap-4 md:gap-8">
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-ink">
              {formatTime(flight.departureTime)}
            </span>
            <span className="text-sm text-muted-foreground">
              {flight.origin}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center px-2">
            <span className="text-xs text-muted-foreground">
              {formatDuration(flight.durationMinutes)}
            </span>
            <div className="relative my-1 h-px w-full min-w-16 bg-border-strong">
              <span className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-ink" />
              <span className="absolute -top-1 left-0 h-2 w-2 rounded-full border border-ink bg-background" />
            </div>
            <span className="text-xs text-muted-foreground">
              {flight.stops === 0
                ? 'Non-stop'
                : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-semibold text-ink">
              {formatTime(flight.arrivalTime)}
            </span>
            <span className="text-sm text-muted-foreground">
              {flight.destination}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-col lg:w-32 lg:items-center">
          <span className="text-sm font-medium text-ink">
            {flight.flightNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            {flight.aircraft}
          </span>
        </div>

        {/* Price + CTA options */}
        <div className="flex flex-col gap-2.5 border-t border-hairline-soft pt-4 w-full lg:w-auto lg:border-t-0 lg:pt-0 sm:flex-row sm:justify-between lg:flex-row lg:items-center">
          {/* Economy */}
          <div className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-surface-soft p-3 sm:flex-1 lg:flex-initial lg:flex-col lg:items-center lg:p-3 lg:w-28 lg:justify-center">
            <div className="flex flex-col lg:items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Economy</span>
              <span className="text-sm font-bold text-ink mt-0.5">{formatINR(flight.economyPrice)}</span>
            </div>
            <Link
              href={`/book/${flight.id}?travelers=${travelers}&date=${date}&cabin=economy`}
              className="flex h-7 items-center justify-center rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
            >
              Select
            </Link>
          </div>

          {/* Premium */}
          <div className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-surface-soft p-3 sm:flex-1 lg:flex-initial lg:flex-col lg:items-center lg:p-3 lg:w-28 lg:justify-center">
            <div className="flex flex-col lg:items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Premium</span>
              <span className="text-sm font-bold text-ink mt-0.5">{formatINR(flight.premiumPrice)}</span>
            </div>
            <Link
              href={`/book/${flight.id}?travelers=${travelers}&date=${date}&cabin=premium`}
              className="flex h-7 items-center justify-center rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
            >
              Select
            </Link>
          </div>

          {/* Business */}
          <div className="flex items-center justify-between gap-4 rounded-md border border-primary/20 bg-primary/[0.03] p-3 sm:flex-1 lg:flex-initial lg:flex-col lg:items-center lg:p-3 lg:w-28 lg:justify-center">
            <div className="flex flex-col lg:items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Business</span>
              <span className="text-sm font-bold text-ink mt-0.5">{formatINR(flight.businessPrice)}</span>
            </div>
            <Link
              href={`/book/${flight.id}?travelers=${travelers}&date=${date}&cabin=business`}
              className="flex h-7 items-center justify-center rounded-sm bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
            >
              Select
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
