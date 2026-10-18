'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CollectionManager } from '@/components/admin/collection-manager'
import { ContentPanel } from '@/components/admin/content-panel'
import { collections } from '@/config/collections'
import { MediaPanel } from '@/components/admin/media-library'
import { BookingsPanel, DashboardPanel, InquiriesPanel, MessagesPanel, PublishPanel, SubscribersPanel } from '@/components/admin/panels'
import { adminCall, getSession, login, logout, onSessionChange, type AdminSession } from '@/lib/admin-api'
import { isBackendConfigured } from '@/lib/api-client'

const NAV: { title: string; items: [string, string][] }[] = [
  { title: 'Overview', items: [['dashboard', '📊 Dashboard']] },
  { title: 'Inbox', items: [['inquiries', '📥 Inquiries'], ['messages', '✉️ Messages'], ['bookings', '📅 Bookings'], ['subscribers', '📰 Subscribers']] },
  ...(['Services & work', 'Profile & credentials', 'Content'] as const).map((g) => ({
    title: g, items: collections.filter((c) => c.group === g).map((c) => [`c:${c.key}`, `${c.icon} ${c.label}`] as [string, string]),
  })),
  { title: 'Website', items: [['content', '⚙️ Site settings, menu & SEO'], ['media', '🖼 Media library'], ['publish', '🚀 Publish']] },
]

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (!isBackendConfigured) return
    const sync = () => setSession(getSession())
    sync()
    // a stored token may have been revoked (e.g. admin password changed): confirm it once on load
    if (getSession()) void adminCall('whoami').catch(() => { /* a 401 clears the session and triggers sync */ })
    return onSessionChange(sync)
  }, [])

  if (!isBackendConfigured) return <Centered><p>The backend is not configured. Set <code>NEXT_PUBLIC_API_URL</code> to your Google Apps Script web-app URL and rebuild (see docs/DEPLOYMENT_GUIDE.md).</p></Centered>
  if (session === undefined) return <Centered><Loader2 className="size-6 animate-spin" /></Centered>
  if (!session) return <Login />

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <b className="text-lg">Admin</b>
          <Link href="/" className="text-sm text-primary underline" target="_blank">View site ↗</Link>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:inline">{session.email}</span>
          <Button size="sm" variant="outline" onClick={() => logout()}><LogOut className="mr-1 size-4" />Sign out</Button>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-2 md:hidden">
          <select aria-label="Go to" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={tab} onChange={(e) => setTab(e.target.value)}>
            {NAV.map((g) => <optgroup key={g.title} label={g.title}>{g.items.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</optgroup>)}
          </select>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[230px_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto pr-1 text-sm" aria-label="Admin sections">
            {NAV.map((g) => (
              <div key={g.title}>
                <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
                {g.items.map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} className={`block w-full rounded-md px-2 py-1.5 text-left ${tab === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{l}</button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          {tab === 'dashboard' && <DashboardPanel goto={setTab} />}
          {tab === 'inquiries' && <InquiriesPanel />}
          {tab === 'messages' && <MessagesPanel />}
          {tab === 'bookings' && <BookingsPanel />}
          {tab === 'subscribers' && <SubscribersPanel />}
          {tab === 'content' && <ContentPanel />}
          {tab === 'media' && <MediaPanel />}
          {tab === 'publish' && <PublishPanel />}
          {tab.startsWith('c:') && collections.find((c) => `c:${c.key}` === tab) && (
            <CollectionManager key={tab} def={collections.find((c) => `c:${c.key}` === tab)!} onNavigate={setTab} />
          )}
        </main>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-foreground"><div className="max-w-md">{children}</div></div>
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await login(email, password) } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    setBusy(false)
  }
  return (
    <Centered>
      <form onSubmit={submit} className="space-y-3 rounded-xl border p-6 text-left">
        <h1 className="text-xl font-semibold">Admin sign in</h1>
        <Input type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Sign in</Button>
      </form>
    </Centered>
  )
}
