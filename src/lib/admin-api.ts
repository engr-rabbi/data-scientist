/**
 * Admin session + calls to the Google Apps Script backend.
 *
 * Sign-in sends e-mail + password to the web app, which answers with a signed token that is
 * valid for 12 hours. The token is kept in this browser's localStorage and attached to every
 * admin request. There is no Google account login in the browser: the web app itself checks
 * the password (stored only as a salted hash inside the script).
 */
import { callApi } from '@/lib/api-client'

const KEY = 'admin.session'

export interface AdminSession { token: string; email: string; expiresAt: number }

/** Thrown when the server says the session is missing or expired. */
export class AuthError extends Error {}

const listeners = new Set<() => void>()
export const onSessionChange = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }

function store(s: AdminSession | null) {
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY) } catch { /* private mode */ }
  listeners.forEach((fn) => fn())
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as AdminSession | null
    return s && typeof s.token === 'string' && s.expiresAt > Date.now() ? s : null
  } catch { return null }
}

export async function login(email: string, password: string): Promise<void> {
  const r = await callApi({ action: 'login', email, password })
  if (r.ok === false) throw new Error(r.error || 'Sign-in failed')
  store({ token: r.token, email: r.email, expiresAt: r.expiresAt })
}

export const logout = () => store(null)

/** Calls an admin action. Throws AuthError (and clears the session) when the token is no longer valid. */
export async function adminCall<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const s = getSession()
  if (!s) { store(null); throw new AuthError('Please sign in.') }
  const r = await callApi({ ...payload, action, token: s.token })
  if (r.ok === false) {
    if (r.status === 401) { store(null); throw new AuthError(r.error || 'Please sign in again.') }
    throw new Error(r.error || 'Request failed')
  }
  return r as T
}
