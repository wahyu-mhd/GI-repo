// Very small mock session helper that reads from localStorage in the client.
// In a real app, replace with proper auth (e.g., Supabase, NextAuth, etc.)

export type SessionUser = {
  id: string
  name: string
  role: 'student' | 'teacher' | 'superuser'
}

const STORAGE_KEY = 'mock-session-user'

export function saveMockSession(user: SessionUser) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function loadMockSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function clearMockSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
