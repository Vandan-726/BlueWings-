"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Escalation = {
  id: number
  userId: string
  bookingId: string | null
  reason: string
  status: string
  channel: string
  createdAt: Date | string
}

export function EscalationList({
  initialEscalations,
}: {
  initialEscalations: Escalation[]
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolveEscalation(id: number) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch("/api/admin/escalations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resolve escalation")
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Failed to resolve escalation")
    } finally {
      setBusyId(null)
    }
  }

  if (initialEscalations.length === 0) {
    return (
      <div className="rounded-xl border border-hairline p-6 bg-card shadow-tier text-center py-10">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-3" />
        <p className="text-sm font-medium text-ink">All quiet here!</p>
        <p className="text-xs text-muted-foreground mt-1">No pending escalations. The AI assistant is handling all queries.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-ink/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-ink/20">
        {initialEscalations.map((e) => (
          <div
            key={e.id}
            className="rounded-xl border border-hairline p-5 shadow-tier bg-card transition-all duration-200 hover:border-ink/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink leading-relaxed">{e.reason}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Channel: <span className="font-semibold text-ink capitalize">{e.channel}</span>
                  </span>
                  {e.bookingId && (
                    <>
                      <span>•</span>
                      <span>
                        Booking:{" "}
                        <span className="font-mono bg-surface-soft px-1.5 py-0.5 rounded text-[11px] font-semibold text-ink">
                          {e.bookingId.slice(0, 8).toUpperCase()}
                        </span>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(e.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                {e.status === "open" ? (
                  <button
                    onClick={() => resolveEscalation(e.id)}
                    disabled={busyId !== null}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-active text-white px-4 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 disabled:opacity-50"
                  >
                    {busyId === e.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Resolve
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft border border-hairline px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
