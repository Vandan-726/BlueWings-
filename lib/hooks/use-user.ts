'use client'

import useSWR from 'swr'

export type SessionUser = {
  id: string
  phone: string
  name: string | null
  email?: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useUser() {
  const { data, isLoading, mutate } = useSWR<{ user: SessionUser | null }>(
    '/api/auth/me',
    fetcher
  )
  return {
    user: data?.user ?? null,
    isLoading,
    mutate,
  }
}
