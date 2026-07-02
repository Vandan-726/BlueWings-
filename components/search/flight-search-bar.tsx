'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type AirportOption = {
  code: string
  city: string
  name: string
  country: string
}

export function FlightSearchBar({
  airports,
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = '',
  defaultTravelers = 1,
  compact = false,
}: {
  airports: AirportOption[]
  defaultOrigin?: string
  defaultDestination?: string
  defaultDate?: string
  defaultTravelers?: number
  compact?: boolean
}) {
  const router = useRouter()
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [date, setDate] = useState(defaultDate)
  const [travelers, setTravelers] = useState(defaultTravelers)

  const [isOpenOrigin, setIsOpenOrigin] = useState(false)
  const [isOpenDestination, setIsOpenDestination] = useState(false)
  const [isOpenTravelers, setIsOpenTravelers] = useState(false)
  const [isOpenDate, setIsOpenDate] = useState(false)

  const isDesktop = () => {
    return typeof window !== 'undefined' && window.innerWidth >= 768
  }

  const today = new Date().toISOString().slice(0, 10)
  const maxDate = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date(date || defaultDate || today)
    return isNaN(d.getTime()) ? new Date() : d
  })

  const handleOpenDate = () => {
    if (date) {
      const d = new Date(date)
      if (!isNaN(d.getTime())) {
        setCalendarDate(d)
      }
    }
    setIsOpenDate(true)
  }

  const calendarYear = calendarDate.getFullYear()
  const calendarMonth = calendarDate.getMonth()

  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay()
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate()

  const days = []
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(calendarYear, calendarMonth, d))
  }

  const prevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))
  }

  const nextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination || !date) return
    router.push(
      `/flights?origin=${origin}&destination=${destination}&date=${date}&travelers=${travelers}`
    )
  }

  const segmentBase =
    'flex min-w-0 flex-1 flex-col justify-center rounded-xl md:rounded-full px-4 md:px-6 py-2 transition-colors hover:bg-surface-strong focus-within:bg-background focus-within:shadow-tier select-none'

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search flights"
      className={`flex flex-col sm:grid sm:grid-cols-2 md:flex md:flex-row md:items-center w-full rounded-2xl md:rounded-full border border-hairline bg-background p-3 md:p-0 shadow-tier gap-2 md:gap-0 ${
        compact ? 'h-auto md:h-14' : 'h-auto md:h-16 md:h-[68px]'
      }`}
    >
      {/* From (Origin) Select */}
      <div
        className={`${segmentBase} relative cursor-pointer`}
        onClick={() => { if (!isDesktop()) setIsOpenOrigin(true); }}
        onMouseEnter={() => { if (isDesktop()) setIsOpenOrigin(true); }}
        onMouseLeave={() => { if (isDesktop()) setIsOpenOrigin(false); }}
      >
        <span className="text-xs font-medium text-ink">
          From
        </span>
        <div className="w-full truncate text-sm text-body py-1 flex items-center justify-between">
          <span>{origin ? `${airports.find((a) => a.code === origin)?.city} (${origin})` : 'Where from?'}</span>
          <svg className="h-4 w-4 text-ink shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpenOrigin && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); setIsOpenOrigin(false); }} />
            <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-hairline rounded-2xl shadow-tier z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
              <div className="max-h-72 overflow-y-auto py-2">
                {airports.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrigin(a.code);
                      if (destination === a.code) {
                        setDestination('');
                      }
                      setIsOpenOrigin(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-surface-strong transition-colors ${
                      origin === a.code ? 'bg-surface font-semibold text-primary' : 'text-body'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{a.city}</span>
                      <span className="text-xs text-ink line-clamp-1">{a.name}</span>
                    </div>
                    <span className="text-xs font-bold text-ink bg-surface-strong px-2 py-0.5 rounded uppercase">
                      {a.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div aria-hidden="true" className="hidden md:block h-8 w-px shrink-0 bg-hairline" />

      {/* To (Destination) Select */}
      <div
        className={`${segmentBase} relative cursor-pointer`}
        onClick={() => { if (!isDesktop()) setIsOpenDestination(true); }}
        onMouseEnter={() => { if (isDesktop()) setIsOpenDestination(true); }}
        onMouseLeave={() => { if (isDesktop()) setIsOpenDestination(false); }}
      >
        <span className="text-xs font-medium text-ink">
          To
        </span>
        <div className="w-full truncate text-sm text-body py-1 flex items-center justify-between">
          <span>{destination ? `${airports.find((a) => a.code === destination)?.city} (${destination})` : 'Where to?'}</span>
          <svg className="h-4 w-4 text-ink shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpenDestination && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); setIsOpenDestination(false); }} />
            <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-hairline rounded-2xl shadow-tier z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
              <div className="max-h-72 overflow-y-auto py-2">
                {airports
                  .filter((a) => a.code !== origin)
                  .map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDestination(a.code);
                        setIsOpenDestination(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-surface-strong transition-colors ${
                        destination === a.code ? 'bg-surface font-semibold text-primary' : 'text-body'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{a.city}</span>
                        <span className="text-xs text-ink line-clamp-1">{a.name}</span>
                      </div>
                      <span className="text-xs font-bold text-ink bg-surface-strong px-2 py-0.5 rounded uppercase">
                        {a.code}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div aria-hidden="true" className="hidden md:block h-8 w-px shrink-0 bg-hairline" />

      {/* Date Picker */}
      <div
        className={`${segmentBase} relative cursor-pointer`}
        onClick={() => { if (!isDesktop()) handleOpenDate(); }}
        onMouseEnter={() => { if (isDesktop()) handleOpenDate(); }}
        onMouseLeave={() => { if (isDesktop()) setIsOpenDate(false); }}
      >
        <span className="text-xs font-medium text-ink">
          When
        </span>
        <div className="w-full truncate text-sm text-body py-1 flex items-center justify-between">
          <span>
            {date
              ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Select date'}
          </span>
          <svg className="h-4 w-4 text-ink shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {isOpenDate && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); setIsOpenDate(false); }} />
            <div
              className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-80 bg-background border border-hairline rounded-2xl shadow-tier z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-strong text-body"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-body">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-strong text-body"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-1 text-center mb-2" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                  <span key={wd} className="text-xxs font-bold text-ink uppercase tracking-wider">
                    {wd}
                  </span>
                ))}
              </div>

              <div className="grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {days.map((day, idx) => {
                  const y = day.getFullYear()
                  const m = String(day.getMonth() + 1).padStart(2, '0')
                  const dStr = String(day.getDate()).padStart(2, '0')
                  const dayIsoStr = `${y}-${m}-${dStr}`

                  const isBeforeToday = dayIsoStr < today
                  const isAfterMax = dayIsoStr > maxDate
                  const isDisabled = isBeforeToday || isAfterMax
                  const isSelected = date === dayIsoStr

                  return (
                    <button
                      key={dayIsoStr}
                      type="button"
                      disabled={isDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDate(dayIsoStr);
                        setIsOpenDate(false);
                      }}
                      style={idx === 0 ? { gridColumnStart: firstDayIndex + 1 } : undefined}
                      className={`h-8 w-8 text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold rounded-full'
                          : isDisabled
                          ? 'text-ink/30 cursor-not-allowed'
                          : 'hover:bg-surface-strong text-body rounded-full'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div aria-hidden="true" className="hidden md:block h-8 w-px shrink-0 bg-hairline" />

      {/* Who (Travelers) Select */}
      <div
        className={`${segmentBase} relative cursor-pointer`}
        onClick={() => { if (!isDesktop()) setIsOpenTravelers(true); }}
        onMouseEnter={() => { if (isDesktop()) setIsOpenTravelers(true); }}
        onMouseLeave={() => { if (isDesktop()) setIsOpenTravelers(false); }}
      >
        <span className="text-xs font-medium text-ink">
          Who
        </span>
        <div className="w-full truncate text-sm text-body py-1 flex items-center justify-between">
          <span>{travelers} {travelers === 1 ? 'traveler' : 'travelers'}</span>
          <svg className="h-4 w-4 text-ink shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpenTravelers && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={(e) => { e.stopPropagation(); setIsOpenTravelers(false); }} />
            <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-hairline rounded-2xl shadow-tier z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTravelers(n);
                    setIsOpenTravelers(false);
                  }}
                  className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-surface-strong transition-colors ${
                    travelers === n ? 'bg-surface font-semibold text-primary' : 'text-body'
                  }`}
                >
                  <span className="text-sm font-medium">{n} {n === 1 ? 'traveler' : 'travelers'}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Search Button */}
      <div className="col-span-full mt-2 md:mt-0 md:shrink-0 pr-0 md:pr-2 pl-0 md:pl-2 h-full flex items-center">
        <button
          type="submit"
          aria-label="Search flights"
          className={`flex items-center justify-center gap-2 bg-primary text-primary-foreground transition-colors hover:bg-primary-active ${
            compact ? 'h-10 w-10 rounded-full' : 'h-12 w-full md:w-auto md:px-5 rounded-xl md:rounded-full'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {!compact && (
            <span className="text-base font-semibold">
              Search
            </span>
          )}
        </button>
      </div>
    </form>
  )
}
