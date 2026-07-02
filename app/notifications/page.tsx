import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth/session"
import { SiteHeader } from "@/components/layout/site-header"
import { NotificationsList } from "@/components/notifications/notifications-list"

export const metadata = { title: "Notifications – BlueWings" }

export default async function NotificationsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=/notifications")

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-semibold text-foreground">Notifications</h1>
        <NotificationsList />
      </main>
    </>
  )
}
