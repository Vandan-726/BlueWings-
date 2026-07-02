import { NextResponse } from "next/server"
import { getSeatMap, getFlightById } from "@/lib/bookings"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const flight = await getFlightById(id)
  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 })
  }
  const occupied = await getSeatMap(id)
  return NextResponse.json({ flight, occupied })
}
