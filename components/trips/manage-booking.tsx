"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { formatINR, formatTime, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Loader2, Armchair, Luggage, UtensilsCrossed, CalendarClock, XCircle } from "lucide-react"

type Passenger = {
  id: number
  firstName: string
  lastName: string
  seatNumber: string | null
  meal: string | null
  extraBaggageKg: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const MEALS = ["standard", "vegetarian", "vegan", "jain", "gluten-free", "diabetic"]

export function ManageBooking({
  pnr,
  bookingStatus,
  passengers,
  departureIso,
}: {
  pnr: string
  bookingStatus: string
  passengers: Passenger[]
  departureIso: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seatInputs, setSeatInputs] = useState<Record<number, string>>({})
  const [showReschedule, setShowReschedule] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("reschedule") === "true") {
        setShowReschedule(true)
      }
    }
  }, [])

  const { data: altData } = useSWR<{ alternatives: any[] }>(
    showReschedule ? `/api/bookings/${pnr}/alternatives` : null,
    fetcher,
  )

  const active = bookingStatus === "confirmed"
  const hoursToDeparture = (new Date(departureIso).getTime() - Date.now()) / 36e5
  const refundPct = hoursToDeparture > 72 ? 90 : hoursToDeparture > 24 ? 50 : 10

  async function patch(body: object, key: string) {
    setBusy(key)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${pnr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  if (!active) {
    return (
      <p className="rounded-2xl border border-border bg-secondary p-5 text-sm leading-relaxed text-muted-foreground">
        This booking is {bookingStatus.replace("_", " ")} and can no longer be modified.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {error}
        </p>
      )}

      <section aria-label="Seats and extras" className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Armchair className="h-4 w-4" aria-hidden="true" />
          Seats and extras
        </h3>
        <div className="flex flex-col gap-5">
          {passengers.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 border-b border-border pb-5 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">
                {p.firstName} {p.lastName}
                <span className="ml-2 font-normal text-muted-foreground">
                  {p.seatNumber ? `Seat ${p.seatNumber}` : "No seat assigned"}
                </span>
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Change seat
                  <div className="flex gap-2">
                    <input
                      value={seatInputs[p.id] ?? ""}
                      onChange={(e) =>
                        setSeatInputs((prev) => ({ ...prev, [p.id]: e.target.value.toUpperCase().slice(0, 3) }))
                      }
                      placeholder="12A"
                      className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                      aria-label={`New seat for ${p.firstName}`}
                    />
                    <button
                      type="button"
                      disabled={!seatInputs[p.id] || busy !== null}
                      onClick={() =>
                        patch({ action: "change_seat", passengerId: p.id, seatNumber: seatInputs[p.id] }, `seat-${p.id}`)
                      }
                      className="rounded-lg border border-foreground px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                    >
                      {busy === `seat-${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Update"}
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed className="h-3 w-3" aria-hidden="true" />
                    Meal
                  </span>
                  <select
                    value={p.meal ?? "standard"}
                    disabled={busy !== null}
                    onChange={(e) =>
                      patch({ action: "update_ancillaries", passengerId: p.id, meal: e.target.value }, `meal-${p.id}`)
                    }
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize text-foreground outline-none focus:border-foreground"
                  >
                    {MEALS.map((m) => (
                      <option key={m} value={m} className="capitalize">
                        {m}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Luggage className="h-3 w-3" aria-hidden="true" />
                    Extra baggage
                  </span>
                  <select
                    value={p.extraBaggageKg}
                    disabled={busy !== null}
                    onChange={(e) =>
                      patch(
                        { action: "update_ancillaries", passengerId: p.id, extraBaggageKg: Number(e.target.value) },
                        `bag-${p.id}`,
                      )
                    }
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  >
                    {[0, 5, 10, 15, 20, 30].map((kg) => (
                      <option key={kg} value={kg}>
                        {kg === 0 ? "None" : `+${kg} kg`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Reschedule flight" className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Reschedule
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Move this booking to another flight on the same route. Fare difference applies; seats are reassigned at
          check-in.
        </p>
        {!showReschedule ? (
          <button
            type="button"
            onClick={() => setShowReschedule(true)}
            className="rounded-lg border border-foreground px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            View alternative flights
          </button>
        ) : !altData ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading alternatives…
          </p>
        ) : altData.alternatives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alternative flights available on this route.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {altData.alternatives.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-foreground">
                    {f.flightNumber} · {formatShortDate(f.departureTime)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatTime(f.departureTime)} → {formatTime(f.arrivalTime)} · {formatINR(Number(f.economyPrice))}{" "}
                    economy
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => patch({ action: "reschedule", newFlightId: f.id }, `resch-${f.id}`)}
                  className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {busy === `resch-${f.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Select"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Cancel booking" className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel booking
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Cancelling now refunds {refundPct}% of your fare based on time to departure ({">"}72h: 90%, 24–72h: 50%,
          {"<"}24h: 10%).
        </p>
        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Cancel this booking
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => patch({ action: "cancel" }, "cancel")}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40",
              )}
            >
              {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Yes, cancel and refund {refundPct}%
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="text-sm font-medium text-foreground underline underline-offset-2"
            >
              Keep booking
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
