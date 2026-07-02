"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SeatMap } from "@/components/booking/seat-map"
import { formatINR, formatTime, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowLeft, CreditCard, Loader2, Lock, Plane } from "lucide-react"

type Flight = {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  aircraft: string
  economyPrice: string
  premiumPrice: string
  businessPrice: string
}

type Pax = { firstName: string; lastName: string; gender: string; age: string }

const STEPS = ["Seats", "Passengers", "Payment"] as const

export function BookingFlow({
  flight,
  occupied,
  cabin,
  paxCount,
}: {
  flight: Flight
  occupied: string[]
  cabin: "economy" | "premium" | "business"
  paxCount: number
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [seats, setSeats] = useState<string[]>([])
  const [pax, setPax] = useState<Pax[]>(
    Array.from({ length: paxCount }, () => ({ firstName: "", lastName: "", gender: "", age: "" })),
  )
  const [email, setEmail] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const perSeat =
    cabin === "business"
      ? Number(flight.businessPrice)
      : cabin === "premium"
        ? Number(flight.premiumPrice)
        : Number(flight.economyPrice)
  const total = perSeat * paxCount

  function toggleSeat(seat: string) {
    setSeats((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]))
  }

  const paxValid = pax.every((p) => p.firstName.trim() && p.lastName.trim()) && /\S+@\S+\.\S+/.test(email)
  const cardDigits = cardNumber.replace(/\s/g, "")
  const payValid = cardDigits.length === 16 && cardName.trim().length > 1 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length === 3

  async function handlePay() {
    setProcessing(true)
    setError(null)
    try {
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId: flight.id,
          cabin,
          contactEmail: email,
          passengers: pax.map((p, i) => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            gender: p.gender || undefined,
            age: p.age ? Number(p.age) : undefined,
            seatNumber: seats[i],
          })),
        }),
      })
      const bookingData = await bookingRes.json()
      if (!bookingRes.ok) throw new Error(bookingData.error || "Could not create booking")

      // Mock gateway: card ending in 0000 simulates a declined payment
      const outcome = cardDigits.endsWith("0000") ? "failure" : "success"
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          method: "card",
          cardLast4: cardDigits.slice(-4),
          outcome,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || "Payment failed")
      if (payData.status === "failed") {
        throw new Error("Your card was declined. Please try a different card. (Cards ending in 0000 always fail in this demo.)")
      }

      router.push(`/trips/${bookingData.booking.pnr}?new=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <nav aria-label="Booking steps" className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-border" aria-hidden="true" />}
            </div>
          ))}
        </nav>

        {step === 0 && (
          <section aria-label="Choose seats">
            <h1 className="mb-1 text-2xl font-semibold text-foreground">Choose your seats</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Select up to {paxCount} seat{paxCount > 1 ? "s" : ""} in the {cabin} cabin, or skip to get seats assigned
              at check-in.
            </p>
            <SeatMap occupied={occupied} selected={seats} cabin={cabin} maxSelectable={paxCount} onToggle={toggleSeat} />
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
              >
                Skip seat selection
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-label="Passenger details">
            <h1 className="mb-1 text-2xl font-semibold text-foreground">Who&apos;s flying?</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Names must match government-issued ID exactly.
            </p>
            <div className="flex flex-col gap-6">
              {pax.map((p, i) => (
                <fieldset key={i} className="rounded-2xl border border-border bg-card p-5">
                  <legend className="px-1 text-sm font-semibold text-foreground">
                    Passenger {i + 1}
                    {seats[i] ? ` · Seat ${seats[i]}` : ""}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                      First name
                      <input
                        required
                        value={p.firstName}
                        onChange={(e) => setPax((prev) => prev.map((x, j) => (j === i ? { ...x, firstName: e.target.value } : x)))}
                        className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                      Last name
                      <input
                        required
                        value={p.lastName}
                        onChange={(e) => setPax((prev) => prev.map((x, j) => (j === i ? { ...x, lastName: e.target.value } : x)))}
                        className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                      Gender
                      <select
                        value={p.gender}
                        onChange={(e) => setPax((prev) => prev.map((x, j) => (j === i ? { ...x, gender: e.target.value } : x)))}
                        className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                      Age
                      <input
                        inputMode="numeric"
                        value={p.age}
                        onChange={(e) => setPax((prev) => prev.map((x, j) => (j === i ? { ...x, age: e.target.value.replace(/\D/g, "").slice(0, 3) } : x)))}
                        className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                        placeholder="Age"
                      />
                    </label>
                  </div>
                </fieldset>
              ))}

              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Contact email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Your ticket and boarding pass will be sent here.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                disabled={!paxValid}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to payment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-label="Payment">
            <h1 className="mb-1 text-2xl font-semibold text-foreground">Pay and confirm</h1>
            <p className="mb-6 flex items-center gap-1.5 text-sm leading-relaxed text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              This is a simulated payment. No real money moves. Use any card number — ending in 0000 simulates a
              decline.
            </p>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Credit or debit card
              </div>
              <div className="grid gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Card number
                  <input
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16)
                      setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 "))
                    }}
                    className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                    placeholder="4242 4242 4242 4242"
                    autoComplete="cc-number"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Name on card
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                    placeholder="Name on card"
                    autoComplete="cc-name"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Expiry
                    <input
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                        setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                      }}
                      className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    CVV
                    <input
                      inputMode="numeric"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground"
                      placeholder="123"
                      autoComplete="cc-csc"
                    />
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={processing}
                className="flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                disabled={!payValid || processing}
                onClick={handlePay}
                className="flex min-w-44 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  <>Pay {formatINR(total)}</>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      <aside aria-label="Trip summary" className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Plane className="h-4 w-4" aria-hidden="true" />
          {flight.airline} {flight.flightNumber}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold text-foreground">{formatTime(flight.departureTime)}</p>
            <p className="text-sm text-muted-foreground">{flight.origin}</p>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>{formatShortDate(flight.departureTime)}</p>
            <p aria-hidden="true">→</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-foreground">{formatTime(flight.arrivalTime)}</p>
            <p className="text-sm text-muted-foreground">{flight.destination}</p>
          </div>
        </div>
        <hr className="my-4 border-border" />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Cabin</dt>
            <dd className="font-medium capitalize text-foreground">{cabin}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Travellers</dt>
            <dd className="font-medium text-foreground">{paxCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Seats</dt>
            <dd className="font-medium text-foreground">{seats.length > 0 ? seats.join(", ") : "Auto-assign"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Fare × {paxCount}</dt>
            <dd className="font-medium text-foreground">{formatINR(perSeat)}</dd>
          </div>
        </dl>
        <hr className="my-4 border-border" />
        <div className="flex justify-between text-base font-semibold text-foreground">
          <span>Total (incl. taxes)</span>
          <span>{formatINR(total)}</span>
        </div>
      </aside>
    </div>
  )
}
