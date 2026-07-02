import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoOtpMode, issueDemoOtp, normalizePhone } from '@/lib/auth/otp'

const schema = z.object({ phone: z.string().min(10).max(20) })

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid phone number' },
      { status: 400 }
    )
  }

  const phone = normalizePhone(parsed.data.phone)
  if (!phone) {
    return NextResponse.json(
      { error: 'Enter a valid phone number' },
      { status: 400 }
    )
  }

  if (!isDemoOtpMode()) {
    // Real Firebase mode: OTP is sent client-side via Firebase SDK
    return NextResponse.json({ mode: 'firebase', phone })
  }

  const otp = await issueDemoOtp(phone)
  // Demo mode: return the OTP so it can be displayed on screen
  return NextResponse.json({ mode: 'demo', phone, demoOtp: otp })
}
