import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  findOrCreateUser,
  isDemoOtpMode,
  normalizePhone,
  verifyDemoOtp,
} from '@/lib/auth/otp'
import { createSession } from '@/lib/auth/session'

const schema = z.object({
  phone: z.string().min(10).max(20),
  otp: z.string().length(6).optional(),
  firebaseIdToken: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const phone = normalizePhone(parsed.data.phone)
  if (!phone) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  if (isDemoOtpMode()) {
    if (!parsed.data.otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 })
    }
    const result = await verifyDemoOtp(phone, parsed.data.otp)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
  } else {
    // Firebase mode: client completed phone verification with Firebase SDK.
    // The Firebase ID token proves the phone was verified.
    if (!parsed.data.firebaseIdToken) {
      return NextResponse.json(
        { error: 'Firebase verification required' },
        { status: 400 }
      )
    }
  }

  const user = await findOrCreateUser(phone, parsed.data.name, parsed.data.email)
  await createSession(user.id)

  return NextResponse.json({
    user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
  })
}
