'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BlueWingsLogo } from '@/components/brand/logo'
import { useUser } from '@/lib/hooks/use-user'
import { Bell, Plane, ReceiptIndianRupee, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Flights' },
  { href: '/trips', label: 'Trips' },
  { href: '/assistant', label: 'Assistant' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, mutate } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Real-time Toast Notification State
  const [activeToast, setActiveToast] = useState<{ id: number; title: string; body: string; type: string } | null>(null)
  const [showToast, setShowToast] = useState(false)
  const lastSeenIdRef = useRef<number>(-1)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Poll Notifications logic
  useEffect(() => {
    if (!user) {
      setActiveToast(null)
      setShowToast(false)
      lastSeenIdRef.current = -1
      return
    }

    let active = true

    // Fetch baseline max ID
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        if (data.notifications && data.notifications.length > 0) {
          const maxId = Math.max(...data.notifications.map((n: any) => n.id))
          lastSeenIdRef.current = maxId
        } else {
          lastSeenIdRef.current = 0
        }
      })
      .catch((err) => console.error("Baseline fetch error:", err))

    // Check for new notifications every 4 seconds
    const interval = setInterval(() => {
      if (lastSeenIdRef.current === -1) return

      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (!active) return
          if (data.notifications && data.notifications.length > 0) {
            const newNotifs = data.notifications.filter((n: any) => n.id > lastSeenIdRef.current)
            if (newNotifs.length > 0) {
              // Trigger the toast for the most recent one
              const latest = newNotifs[0]
              setActiveToast({
                id: latest.id,
                title: latest.title,
                body: latest.body,
                type: latest.type,
              })
              setShowToast(true)

              // Update baseline to the new max ID
              const maxId = Math.max(...data.notifications.map((n: any) => n.id))
              lastSeenIdRef.current = maxId
            }
          }
        })
        .catch((err) => console.error("Polling error:", err))
    }, 4000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user])

  // Toast Auto-Dismiss
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
        // Clear active toast after transition out
        setTimeout(() => setActiveToast(null), 300)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [activeToast])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    await mutate()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline-soft bg-background">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
          <Link href="/" aria-label="BlueWings home" className="shrink-0">
            <BlueWingsLogo />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href)
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`rounded-full px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? 'font-semibold text-ink'
                          : 'font-medium text-muted-foreground hover:bg-surface-soft hover:text-ink'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="relative flex items-center gap-3" ref={menuRef}>
            <Link
              href="/whatsapp"
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft lg:block"
            >
              Try on WhatsApp
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex items-center gap-3 rounded-full border border-hairline bg-background py-1.5 pl-3.5 pr-1.5 transition-shadow hover:shadow-tier"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="text-ink"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M2 16h28M2 24h28M2 8h28" />
                </g>
              </svg>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-background">
                {user ? (user.name?.[0] ?? user.phone.slice(-2)) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d="M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28zm0 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 20.4a11.4 11.4 0 0 1-8-3.3 8.5 8.5 0 0 1 16 0 11.4 11.4 0 0 1-8 3.3z" />
                  </svg>
                )}
              </span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-14 w-60 overflow-hidden rounded-md border border-hairline-soft bg-background py-2 shadow-tier"
              >
                {user ? (
                  <>
                    <div className="border-b border-hairline-soft px-4 pb-2 pt-1">
                      <p className="text-sm font-semibold text-ink">
                        {user.name || 'Traveler'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.phone}
                      </p>
                    </div>
                    {[
                      { href: '/trips', label: 'Trips' },
                      { href: '/notifications', label: 'Notifications' },
                      { href: '/profile', label: 'Profile' },
                      { href: '/assistant', label: 'AI Assistant' },
                      { href: '/whatsapp', label: 'WhatsApp demo' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-body hover:bg-surface-soft"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="block w-full border-t border-hairline-soft px-4 py-2.5 text-left text-sm text-body hover:bg-surface-soft"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-soft"
                    >
                      Log in or sign up
                    </Link>
                    <div className="my-1 border-t border-hairline-soft" />
                    <Link
                      href="/assistant"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-body hover:bg-surface-soft"
                    >
                      AI Assistant
                    </Link>
                    <Link
                      href="/whatsapp"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-body hover:bg-surface-soft"
                    >
                      WhatsApp demo
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast Notification Container */}
      <div
        className={`fixed bottom-5 right-5 z-50 flex max-w-sm gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xl transition-all duration-300 transform ${
          showToast && activeToast
            ? 'translate-y-0 opacity-100'
            : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        {activeToast && (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {activeToast.type === 'booking' ? (
                <Plane className="h-4 w-4" aria-hidden="true" />
              ) : activeToast.type === 'refund' ? (
                <ReceiptIndianRupee className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bell className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{activeToast.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{activeToast.body}</p>
              <Link
                href="/notifications"
                onClick={() => {
                  setShowToast(false)
                  setTimeout(() => setActiveToast(null), 300)
                }}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowToast(false)
                setTimeout(() => setActiveToast(null), 300)
              }}
              className="text-muted-foreground hover:text-foreground shrink-0 self-start ml-2"
              aria-label="Close notification toast"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </>
  )
}
