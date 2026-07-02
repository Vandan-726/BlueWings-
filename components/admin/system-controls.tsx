"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export function SystemControls() {
  const router = useRouter()
  const [busy, setBusy] = useState<"reset" | "purge" | null>(null)
  const [showConfirm, setShowConfirm] = useState<"reset" | "purge" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAction(type: "reset" | "purge") {
    setBusy(type)
    setError(null)
    setSuccess(null)
    try {
      const endpoint = type === "reset" ? "/api/admin/reset" : "/api/admin/purge"
      const res = await fetch(endpoint, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")

      setSuccess(
        type === "reset"
          ? "System transactional data successfully reset!"
          : "Database completely purged. Logging you out..."
      )

      setShowConfirm(null)

      if (type === "purge") {
        // Redirect to login page after a short delay since session is purged
        setTimeout(() => {
          window.location.href = "/login"
        }, 1500)
      } else {
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || "Failed to execute action")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-xl border border-hairline p-6 bg-card shadow-tier">
      <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
        <ShieldAlert className="h-5 w-5 text-primary" />
        System Administration Controls
      </h3>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        Destructive operations for development and testing. Use with caution as these changes are immediate and irreversible.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 font-semibold">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Reset Transactional Data Option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-hairline bg-surface-soft/30 hover:bg-surface-soft/60 transition-colors">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-ink">Reset transactions & chats</h4>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Deletes all bookings, payments, flight assignments, chat logs, messages, and escalation history.
              Keeps registered users intact so your admin session remains active.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm("reset")}
            disabled={busy !== null}
            className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-full border border-hairline bg-white hover:bg-surface-soft px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Data
          </button>
        </div>

        {/* Purge Everything Option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/10 bg-destructive/5 hover:bg-destructive/10 transition-colors">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive">Complete database purge</h4>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Resets the entire database. Deletes all transactional data, sessions, AND all registered user accounts.
              You will be automatically logged out.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm("purge")}
            disabled={busy !== null}
            className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Purge All
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-tier border border-hairline animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {showConfirm === "reset"
                ? "This will permanently delete all bookings, flight allocations, and active chat logs. You will stay logged in, but all transaction histories will be wiped."
                : "This will completely wipe out the database, including your user profile and active credentials. You will be logged out and must register again."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={busy !== null}
                className="rounded-full border border-hairline bg-white hover:bg-surface-soft px-4 py-2 text-sm font-semibold text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showConfirm)}
                disabled={busy !== null}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors flex items-center gap-1.5",
                  showConfirm === "reset" ? "bg-primary hover:bg-primary-active" : "bg-destructive hover:bg-destructive/90"
                )}
              >
                {busy === showConfirm && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
