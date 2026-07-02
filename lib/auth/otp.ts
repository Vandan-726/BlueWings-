import 'server-only'
import { db } from '@/lib/db'
import { otpCodes, users, auditLogs } from '@/lib/db/schema'
import { and, eq, gt, lt, desc } from 'drizzle-orm'
import { hashToken } from './session'

const OTP_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

/** Demo mode is active unless real Firebase server verification is configured */
export function isDemoOtpMode() {
  return !process.env.FIREBASE_PROJECT_ID
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '')
  const withPlus = digits.startsWith('+') ? digits : `+91${digits}`
  if (!/^\+\d{10,15}$/.test(withPlus)) return null
  return withPlus
}

export async function issueDemoOtp(phone: string): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  // clean stale codes for this phone
  await db
    .delete(otpCodes)
    .where(and(eq(otpCodes.phone, phone), lt(otpCodes.expiresAt, new Date())))
  await db.insert(otpCodes).values({
    phone,
    otpHash: hashToken(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  })
  return otp
}

export async function verifyDemoOtp(
  phone: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1)

  const record = rows[0]
  if (!record) return { ok: false, error: 'OTP expired. Request a new code.' }
  if (record.attempts >= MAX_ATTEMPTS)
    return { ok: false, error: 'Too many attempts. Request a new code.' }

  if (record.otpHash !== hashToken(otp)) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id))
    return { ok: false, error: 'Incorrect code. Please try again.' }
  }

  await db.delete(otpCodes).where(eq(otpCodes.id, record.id))
  return { ok: true }
}

export async function findOrCreateUser(phone: string, name?: string, email?: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1)
  
  if (existing[0]) {
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email

    if (Object.keys(updateData).length > 0) {
      const updated = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existing[0].id))
        .returning()
      return updated[0]
    }
    return existing[0]
  }

  const inserted = await db.insert(users).values({
    phone,
    name: name || null,
    email: email || null
  }).returning()

  await db.insert(auditLogs).values({
    userId: inserted[0].id,
    action: 'user.created',
    entity: 'user',
    entityId: inserted[0].id,
  })
  return inserted[0]
}
