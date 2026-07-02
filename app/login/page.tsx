import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth/session'
import { PhoneAuthForm } from '@/components/auth/phone-auth-form'
import { BlueWingsLogo } from '@/components/brand/logo'

export const metadata = {
  title: 'Log in — BlueWings',
}

export default async function LoginPage() {
  const userId = await getUserId()
  if (userId) redirect('/')

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex h-20 items-center border-b border-hairline-soft px-6 md:px-10">
        <Link href="/" aria-label="BlueWings home">
          <BlueWingsLogo />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense>
          <PhoneAuthForm />
        </Suspense>
      </div>
    </main>
  )
}
