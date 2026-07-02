import Link from 'next/link'

const columns = [
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/assistant' },
      { label: 'Manage booking', href: '/trips' },
      { label: 'Cancellation options', href: '/trips' },
      { label: 'Talk to our AI assistant', href: '/assistant' },
    ],
  },
  {
    title: 'Booking',
    links: [
      { label: 'Search flights', href: '/' },
      { label: 'Your trips', href: '/trips' },
      { label: 'Check-in', href: '/trips' },
      { label: 'WhatsApp booking', href: '/whatsapp' },
    ],
  },
  {
    title: 'BlueWings',
    links: [
      { label: 'Notifications', href: '/notifications' },
      { label: 'Profile', href: '/profile' },
      { label: 'Operations dashboard', href: '/admin' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline-soft bg-surface-soft">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3 md:px-10">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-body hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-hairline px-6 py-6 text-sm text-body sm:flex-row sm:items-center sm:justify-between md:px-10">
        <p>© 2026 BlueWings Airlines. A demo project — not a real airline.</p>
        <p className="text-muted-foreground">
          Web · WhatsApp · AI-first booking
        </p>
      </div>
    </footer>
  )
}
