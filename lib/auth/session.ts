import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { refreshTokens, users } from '@/lib/db/schema'
import { and, eq, gt } from 'drizzle-orm'

const ACCESS_TOKEN_TTL = 60 * 15 // 15 minutes
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30 // 30 days

const ACCESS_COOKIE = 'bw_access'
const REFRESH_COOKIE = 'bw_refresh'

function getSecret() {
  const secret =
    process.env.SESSION_SECRET ?? process.env.DATABASE_URL ?? 'bw-dev-secret'
  return new TextEncoder().encode(
    createHash('sha256').update(secret).digest('hex')
  )
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function signAccessToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL)
    .sign(getSecret())
}

export async function createSession(userId: string) {
  const accessToken = await signAccessToken(userId)
  const refreshToken = randomBytes(32).toString('hex')

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
  })

  const cookieStore = await cookies()
  const base = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
  }
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: ACCESS_TOKEN_TTL,
  })
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: REFRESH_TOKEN_TTL,
  })
}

async function refreshSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return null

  const rows = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hashToken(refreshToken)),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const accessToken = await signAccessToken(row.userId)
  try {
    cookieStore.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL,
    })
  } catch {
    // cookies() is read-only during RSC render; token still valid for this request
  }
  return row.userId
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getSecret())
      if (typeof payload.sub === 'string') return payload.sub
    } catch {
      // expired/invalid — fall through to refresh
    }
  }
  return refreshSession()
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

export async function getCurrentUser() {
  const userId = await getUserId()
  if (!userId) return null
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0] ?? null
}

/** Alias used across API routes and pages: returns the full user row or null. */
export const getSessionUser = getCurrentUser

export async function destroySession() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
  }
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}
