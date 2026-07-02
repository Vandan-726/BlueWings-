"use client"

import QRCode from "react-qr-code"
import { formatTime, formatShortDate } from "@/lib/format"
import { Plane } from "lucide-react"

export function BoardingPass({
  pnr,
  flightNumber,
  origin,
  destination,
  departureIso,
  arrivalIso,
  cabin,
  passengerName,
  seat,
}: {
  pnr: string
  flightNumber: string
  origin: string
  destination: string
  departureIso: string
  arrivalIso: string
  cabin: string
  passengerName: string
  seat: string | null
}) {
  const qrValue = JSON.stringify({ pnr, flight: flightNumber, name: passengerName, seat })

  return (
    <article
      aria-label={`Boarding pass for ${passengerName}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-md"
    >
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Plane className="h-4 w-4" aria-hidden="true" />
          BlueWings · {flightNumber}
        </span>
        <span className="text-sm font-semibold tracking-widest">{pnr}</span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-3xl font-semibold text-foreground">{origin}</p>
              <p className="text-sm text-muted-foreground">{formatTime(departureIso)}</p>
            </div>
            <div className="flex flex-1 items-center gap-1 text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <Plane className="h-4 w-4" />
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-foreground">{destination}</p>
              <p className="text-sm text-muted-foreground">{formatTime(arrivalIso)}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Passenger</dt>
              <dd className="font-semibold text-foreground">{passengerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Date</dt>
              <dd className="font-semibold text-foreground">{formatShortDate(departureIso)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Seat</dt>
              <dd className="font-semibold text-foreground">{seat ?? "At check-in"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cabin</dt>
              <dd className="font-semibold capitalize text-foreground">{cabin}</dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center justify-center border-t border-dashed border-border pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="rounded-lg bg-white p-2">
            <QRCode value={qrValue} size={96} aria-label={`Boarding QR code for ${passengerName}`} />
          </div>
        </div>
      </div>
    </article>
  )
}
