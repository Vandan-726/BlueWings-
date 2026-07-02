"use client"

import { useState } from "react"
import { X, User, CreditCard, AlertOctagon, Plane } from "lucide-react"
import { formatINR } from "@/lib/format"

type BookingDetail = {
  id: string
  pnr: string
  status: string
  totalAmount: string
  createdAt: Date | string
  flightNumber: string | null
  origin: string | null
  destination: string | null
  userName: string | null
  userPhone: string | null
}

type UserDetail = {
  id: string
  name: string | null
  email: string | null
  phone: string
  createdAt: Date | string
}

type PaymentDetail = {
  id: string
  bookingId: string
  amount: string
  method: string
  cardLast4: string | null
  createdAt: Date | string
  pnr: string | null
}

type EscalationDetail = {
  id: number
  reason: string
  channel: string
  status: string
  createdAt: Date | string
  bookingId: string | null
}

type StatsCardsProps = {
  bookingCount: number
  userCount: number
  revenue: number
  openEscalationsCount: number
  bookings: BookingDetail[]
  users: UserDetail[]
  payments: PaymentDetail[]
  escalations: EscalationDetail[]
}

export function StatsCards({
  bookingCount,
  userCount,
  revenue,
  openEscalationsCount,
  bookings,
  users,
  payments,
  escalations,
}: StatsCardsProps) {
  const [activeModal, setActiveModal] = useState<"bookings" | "users" | "revenue" | "escalations" | null>(null)

  const stats = [
    {
      id: "bookings" as const,
      label: "Total bookings",
      value: String(bookingCount),
      icon: Plane,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      id: "users" as const,
      label: "Registered users",
      value: String(userCount),
      icon: User,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      id: "revenue" as const,
      label: "Revenue (mock)",
      value: formatINR(revenue),
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      id: "escalations" as const,
      label: "Open escalations",
      value: String(openEscalationsCount),
      icon: AlertOctagon,
      color: "text-primary bg-primary/5 border-primary/10",
    },
  ]

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => setActiveModal(s.id)}
              className="group text-left w-full rounded-xl border border-hairline bg-card p-5 shadow-tier transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer flex justify-between items-start outline-none"
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-ink transition-colors">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-ink">{s.value}</p>
                <span className="mt-1.5 inline-block text-[10px] font-semibold text-primary group-hover:underline">
                  Click to view details &rarr;
                </span>
              </div>
              <div className={`p-2.5 rounded-lg border ${s.color} shrink-0`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-tier border border-hairline animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                {activeModal === "bookings" && "Total Bookings History"}
                {activeModal === "users" && "Registered User Profiles"}
                {activeModal === "revenue" && "Successful Payments Ledger"}
                {activeModal === "escalations" && "Open Escalations Queue"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-full p-1.5 hover:bg-surface-soft text-muted-foreground hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-auto flex-1 pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-ink/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* BOOKINGS MODAL */}
              {activeModal === "bookings" && (
                <div className="min-w-full inline-block align-middle">
                  {bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No bookings found.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-hairline bg-surface-soft/60 text-muted-foreground">
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">PNR</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Passenger</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Route / Flight</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Class</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-surface-soft/20 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-ink">{b.pnr}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-ink">{b.userName || "Guest"}</div>
                              <div className="text-xs text-muted-foreground">{b.userPhone || ""}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-ink">
                                {b.origin} &rarr; {b.destination}
                              </div>
                              <div className="text-xs text-muted-foreground">{b.flightNumber || "Direct"}</div>
                            </td>
                            <td className="px-4 py-3 capitalize text-xs font-semibold text-muted-foreground">{b.cabin}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                b.status === "confirmed" || b.status === "success"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : b.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-ink">{formatINR(Number(b.totalAmount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* USERS MODAL */}
              {activeModal === "users" && (
                <div className="min-w-full inline-block align-middle">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No registered users found.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-hairline bg-surface-soft/60 text-muted-foreground">
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">User Details</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Phone Number</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Registered At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-surface-soft/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-ink">{u.name || "Unnamed User"}</div>
                              <div className="text-xs text-muted-foreground">{u.email || "No email linked"}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-ink">{u.phone}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {new Date(u.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* REVENUE MODAL */}
              {activeModal === "revenue" && (
                <div className="min-w-full inline-block align-middle">
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No payment records found.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-hairline bg-surface-soft/60 text-muted-foreground">
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Transaction ID</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">PNR</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Method</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Processed On</th>
                          <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-surface-soft/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-ink">{p.pnr || "N/A"}</td>
                            <td className="px-4 py-3 text-ink">
                              <span className="capitalize">{p.method}</span>
                              {p.cardLast4 && <span className="text-xs text-muted-foreground"> (•••• {p.cardLast4})</span>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {new Date(p.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatINR(Number(p.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ESCALATIONS MODAL */}
              {activeModal === "escalations" && (
                <div className="flex flex-col gap-3">
                  {escalations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No open escalations.</p>
                  ) : (
                    escalations.map((e) => (
                      <div key={e.id} className="rounded-xl border border-hairline p-4 bg-surface-soft/20">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <p className="text-sm font-semibold text-ink">{e.reason}</p>
                          <span className="shrink-0 rounded-full bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                            {e.status}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Channel: <span className="font-semibold text-ink capitalize">{e.channel}</span></span>
                          {e.bookingId && <span>• Booking PNR: <span className="font-mono text-ink">{e.bookingId.slice(0, 8).toUpperCase()}</span></span>}
                          <span>• Logged: {new Date(e.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-hairline pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-full bg-ink text-white hover:bg-ink/90 px-5 py-2 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
