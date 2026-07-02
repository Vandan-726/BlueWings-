'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'

type Step = 'phone' | 'otp'

export function PhoneAuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate } = useUser()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [demoOtp, setDemoOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const redirectTo = searchParams.get('next') || '/'

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setNormalizedPhone(data.phone)
      if (data.mode === 'demo') setDemoOtp(data.demoOtp)
      setStep('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(code: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, otp: code, name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        return
      }
      await mutate()
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '')
    if (value && !digits) return
    const next = [...otp]
    if (digits.length > 1) {
      // Paste or multi-char input: distribute digits from this index
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        next[index + i] = digits[i]
      }
    } else {
      next[index] = digits
    }
    setOtp(next)
    const lastFilled = Math.min(index + Math.max(digits.length, 1), 5)
    if (digits) otpRefs.current[lastFilled]?.focus()
    const code = next.join('')
    if (code.length === 6) verifyOtp(code)
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-md border border-hairline bg-background shadow-tier">
      <div className="flex items-center justify-center border-b border-hairline-soft px-6 py-5">
        <h1 className="text-base font-semibold text-ink">
          {step === 'phone' ? 'Log in or sign up' : 'Confirm your number'}
        </h1>
      </div>

      <div className="flex flex-col gap-4 p-6">
        {step === 'phone' ? (
          <>
            <h2 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-ink text-balance">
              Welcome to BlueWings
            </h2>
            <form onSubmit={requestOtp} className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-sm border border-border-strong focus-within:border-ink">
                <div className="border-b border-border-strong px-3 pb-1 pt-2">
                  <label
                    htmlFor="country"
                    className="block text-xs text-muted-foreground"
                  >
                    Country/Region
                  </label>
                  <select
                    id="country"
                    className="w-full bg-transparent text-base text-ink outline-none"
                    defaultValue="+91"
                  >
                    <option value="+91">India (+91)</option>
                    <option value="+1">United States (+1)</option>
                    <option value="+44">United Kingdom (+44)</option>
                    <option value="+971">UAE (+971)</option>
                    <option value="+65">Singapore (+65)</option>
                  </select>
                </div>
                <div className="border-b border-border-strong px-3 pb-2 pt-1">
                  <label
                    htmlFor="phone"
                    className="block text-xs text-muted-foreground"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-soft"
                  />
                </div>
                <div className="border-b border-border-strong px-3 pb-2 pt-1">
                  <label
                    htmlFor="name"
                    className="block text-xs text-muted-foreground"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-soft"
                  />
                </div>
                <div className="px-3 pb-2 pt-1">
                  <label
                    htmlFor="email"
                    className="block text-xs text-muted-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-soft"
                  />
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                We&apos;ll send you a one-time code to confirm your number.
                Standard message rates may apply.
              </p>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 10 || !name.trim() || !email.trim()}
                className="h-12 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-active disabled:bg-primary-disabled"
              >
                {loading ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-body">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-ink">{normalizedPhone}</span>
            </p>

            {demoOtp && (
              <div className="rounded-sm bg-surface-soft px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Demo mode
                </p>
                <p className="mt-1 text-sm text-body">
                  Your one-time code is{' '}
                  <span className="font-mono text-base font-bold text-ink">
                    {demoOtp}
                  </span>
                </p>
              </div>
            )}

            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-full rounded-sm border border-border-strong text-center text-xl font-semibold text-ink outline-none focus:border-ink"
                />
              ))}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setOtp(['', '', '', '', '', ''])
                setDemoOtp(null)
                setError(null)
              }}
              className="self-start text-sm font-semibold text-ink underline"
            >
              Use a different number
            </button>
          </>
        )}
      </div>
    </div>
  )
}
