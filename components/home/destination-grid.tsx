import Image from 'next/image'
import Link from 'next/link'
import { formatINR } from '@/lib/format'

const destinations = [
  {
    city: 'Goa',
    code: 'GOI',
    from: 'BOM',
    fromCity: 'Mumbai',
    image: '/images/dest-goa.png',
    tag: 'Guest favorite',
  },
  {
    city: 'New Delhi',
    code: 'DEL',
    from: 'BOM',
    fromCity: 'Mumbai',
    image: '/images/dest-delhi.png',
    tag: null,
  },
  {
    city: 'Mumbai',
    code: 'BOM',
    from: 'DEL',
    fromCity: 'New Delhi',
    image: '/images/dest-mumbai.png',
    tag: 'Popular',
  },
  {
    city: 'Bengaluru',
    code: 'BLR',
    from: 'DEL',
    fromCity: 'New Delhi',
    image: '/images/dest-bengaluru.png',
    tag: null,
  },
  {
    city: 'Dubai',
    code: 'DXB',
    from: 'DEL',
    fromCity: 'New Delhi',
    image: '/images/dest-dubai.png',
    tag: 'International',
  },
  {
    city: 'Singapore',
    code: 'SIN',
    from: 'BOM',
    fromCity: 'Mumbai',
    image: '/images/dest-singapore.png',
    tag: 'International',
  },
  {
    city: 'Jaipur',
    code: 'JAI',
    from: 'DEL',
    fromCity: 'New Delhi',
    image: '/images/dest-jaipur.png',
    tag: null,
  },
]

export function DestinationGrid({
  prices,
}: {
  prices: Record<string, number>
}) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return (
    <section
      aria-labelledby="destinations-heading"
      className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10"
    >
      <h2
        id="destinations-heading"
        className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-ink"
      >
        Popular with travelers from India
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {destinations.map((d) => {
          const price = prices[`${d.from}-${d.code}`]
          return (
            <Link
              key={`${d.from}-${d.code}`}
              href={`/flights?origin=${d.from}&destination=${d.code}&date=${tomorrow}&travelers=1`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={d.image || "/placeholder.svg"}
                  alt={`${d.city} destination`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {d.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-ink shadow-tier">
                    {d.tag}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-ink">
                  {d.city} ({d.code})
                </p>
                <p className="text-sm text-muted-foreground">
                  from {d.fromCity}
                </p>
                {price ? (
                  <p className="mt-0.5 text-sm text-body">
                    <span className="font-semibold text-ink">
                      {formatINR(price)}
                    </span>{' '}
                    one way
                  </p>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
