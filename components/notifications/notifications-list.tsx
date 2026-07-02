"use client"

import useSWR from "swr"
import { useEffect } from "react"
import { Bell, Plane, ReceiptIndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ICONS: Record<string, typeof Bell> = {
  booking: Plane,
  refund: ReceiptIndianRupee,
}

export function NotificationsList() {
  const { data, mutate } = useSWR<{ notifications: Notification[] }>("/api/notifications", fetcher)

  useEffect(() => {
    if (data?.notifications.some((n) => !n.read)) {
      fetch("/api/notifications", { method: "PATCH" }).then(() => mutate())
    }
  }, [data, mutate])

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading notifications…</p>
  }

  if (data.notifications.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-8">
        <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          You&apos;re all caught up. Booking updates and refund alerts will appear here.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.notifications.map((n) => {
        const Icon = ICONS[n.type] ?? Bell
        return (
          <li
            key={n.id}
            className={cn(
              "flex items-start gap-4 rounded-2xl border border-border p-5",
              n.read ? "bg-card" : "bg-secondary",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
