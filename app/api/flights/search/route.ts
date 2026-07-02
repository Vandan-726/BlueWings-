import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchFlights } from '@/lib/flights'

const schema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = schema.safeParse({
    origin: searchParams.get('origin'),
    destination: searchParams.get('destination'),
    date: searchParams.get('date'),
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'origin, destination, and date (YYYY-MM-DD) are required' },
      { status: 400 }
    )
  }
  const results = await searchFlights(parsed.data)
  return NextResponse.json({ flights: results })
}
