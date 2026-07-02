import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { FlightSearchBar } from '@/components/search/flight-search-bar'
import { DestinationGrid } from '@/components/home/destination-grid'
import { getAirports, getPopularRoutes } from '@/lib/flights'

export default async function HomePage() {
  const [airportList, popularRoutes] = await Promise.all([
    getAirports(),
    getPopularRoutes(),
  ])

  const prices: Record<string, number> = {}
  for (const r of popularRoutes) {
    prices[`${r.origin}-${r.destination}`] = Number.parseFloat(r.minPrice)
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero + search */}
        <section
          aria-labelledby="hero-heading"
          className="mx-auto w-full max-w-7xl px-6 pb-4 pt-10 md:px-10 md:pt-14"
        >
          <h1
            id="hero-heading"
            className="max-w-xl text-[28px] font-bold leading-[1.14] text-ink text-balance md:text-[36px]"
          >
            Where will your wings take you?
          </h1>
          <p className="mt-2 max-w-lg text-base leading-relaxed text-body">
            Search, book, and manage flights in minutes — on the web or over
            WhatsApp, with an AI assistant that speaks your language.
          </p>
          <div className="mt-6 md:mt-8">
            <FlightSearchBar airports={airportList} defaultDate={tomorrow} />
          </div>
        </section>

        {/* Hero image band */}
        <section
          aria-hidden="true"
          className="mx-auto w-full max-w-7xl px-6 pt-8 md:px-10"
        >
          <div className="relative h-56 overflow-hidden rounded-lg md:h-80">
            <Image
              src="/images/hero-wing.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-6 md:p-10">
              <p className="max-w-md text-lg font-semibold text-white text-pretty md:text-2xl">
                Every seat window-worthy. Every fare transparent.
              </p>
            </div>
          </div>
        </section>

        <DestinationGrid prices={prices} />

        {/* AI assistant banner */}
        <section
          aria-labelledby="assistant-heading"
          className="mx-auto w-full max-w-7xl px-6 pb-16 md:px-10"
        >
          <div className="flex flex-col items-start gap-6 rounded-lg border border-hairline bg-surface-soft p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex flex-col gap-2">
              <h2
                id="assistant-heading"
                className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-ink"
              >
                Book by chatting. Seriously.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-body">
                Tell our AI assistant &quot;Book me a flight to Goa on
                Friday&quot; and it searches, holds seats, and completes
                payment — on the web or WhatsApp.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href="/assistant"
                className="flex h-12 items-center rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-active"
              >
                Chat now
              </Link>
              <Link
                href="/whatsapp"
                className="flex h-12 items-center rounded-sm border border-ink bg-background px-6 text-base font-semibold text-ink transition-colors hover:bg-surface-soft"
              >
                WhatsApp demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
