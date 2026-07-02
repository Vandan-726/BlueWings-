import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth/session"
import { SiteHeader } from "@/components/layout/site-header"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata = { title: "Profile – BlueWings" }

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=/profile")

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-semibold text-foreground">Profile</h1>
        <p className="mb-8 text-sm text-muted-foreground">Signed in with {user.phone}</p>
        <ProfileForm initialName={user.name ?? ""} initialEmail={user.email ?? ""} />
      </main>
    </>
  )
}
