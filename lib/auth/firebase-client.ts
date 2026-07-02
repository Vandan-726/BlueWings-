'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'

export function isFirebaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

let app: FirebaseApp | null = null

function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
  }
  return app
}

export async function sendFirebaseOtp(
  phone: string,
  recaptchaContainerId: string
): Promise<ConfirmationResult> {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) throw new Error('Firebase is not configured')
  const auth = getAuth(firebaseApp)
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'invisible',
  })
  return signInWithPhoneNumber(auth, phone, verifier)
}
