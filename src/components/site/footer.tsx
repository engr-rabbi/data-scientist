'use client'


import { apiFetch } from '@/lib/api-client'
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Check,
  Clock,
  Copy,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MailCheck,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { profile, services, sitePages, social } from '@/config/profile'
import { mailLink, platformLinks, scrollToId, telLink, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'

type LegalDialog = 'privacy' | 'terms' | null

/**
 * Small copy-to-clipboard icon button with inline "copied" feedback.
 * Falls back to a hidden-textarea copy when the async clipboard API is
 * unavailable (older browsers / non-secure contexts).
 */
function CopyContactButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const helper = document.createElement('textarea')
        helper.value = value
        helper.setAttribute('readonly', '')
        helper.style.position = 'fixed'
        helper.style.opacity = '0'
        document.body.appendChild(helper)
        helper.select()
        document.execCommand('copy')
        document.body.removeChild(helper)
      }
      setCopied(true)
      track('copy_contact', label)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — silently ignore, the visible value is still readable
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
        className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
          copied
            ? 'border-teal-400/40 bg-teal-500/15 text-teal-300'
            : 'border-white/10 bg-white/5 text-white/40 hover:border-teal-400/40 hover:bg-white/10 hover:text-teal-300'
        }`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? `${label} copied to clipboard` : ''}
      </span>
    </span>
  )
}

/** Live local-time indicator for the freelancer's timezone (Asia/Dhaka, GMT+6). */
function LocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    const tick = () => setTime(formatter.format(new Date()))
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Render nothing until mounted — avoids hydration mismatch from clock time.
  if (!time) return null

  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
      <Clock className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
      Local time · {time}{' '}<span className="text-white/40">(GMT+6)</span>
    </p>
  )
}

interface SocialLink {
  label: string
  href: string
  icon: LucideIcon
  event:
    | 'click_linkedin'
    | 'click_kaggle'
    | 'click_upwork'
    | 'click_freelancer'
    | 'click_github'
    | 'click_telegram'
}

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', href: platformLinks.linkedin, icon: Linkedin, event: 'click_linkedin' },
  { label: 'Kaggle', href: platformLinks.kaggle, icon: Trophy, event: 'click_kaggle' },
  { label: 'GitHub', href: social.github, icon: Github, event: 'click_github' },
  { label: 'Upwork', href: platformLinks.upwork, icon: Briefcase, event: 'click_upwork' },
  { label: 'Freelancer', href: platformLinks.freelancer, icon: Globe, event: 'click_freelancer' },
  { label: 'Telegram', href: social.telegram, icon: Send, event: 'click_telegram' },
]

const PRIVACY_POINTS = [
  'This website does not require an account, and your personal data is never sold or shared with third parties.',
  'Files and project details submitted through the project form are used solely to evaluate your inquiry and prepare a proposal. They are not used for any other purpose.',
  'Basic, privacy-conscious analytics (page path and referrer only) are collected to improve the site; no sensitive personal data is stored.',
  'For any privacy request, reach out via the contact options listed on this page (WhatsApp, phone or email).',
]

const TERMS_POINTS = [
  'All estimates on this site — including pricing and deliverables — are indicative and subject to the final agreed scope of work.',
  'Project timelines depend on requirements, data availability and feedback cycles; a firm schedule is agreed per project.',
  'Engagements via third-party platforms (Upwork, Freelancer) are additionally governed by those platforms’ own terms and conditions.',
  'Delivered work is licensed under the individual project agreement; reuse or redistribution requires written consent.',
]

export default function Footer() {
  const [legal, setLegal] = useState<LegalDialog>(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterState, setNewsletterState] = useState<
    { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }
  >({ status: 'idle' })
  const year = new Date().getFullYear()

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newsletterState.status === 'loading') return
    const email = newsletterEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterState({ status: 'error', message: 'Please enter a valid email address.' })
      return
    }
    setNewsletterState({ status: 'loading' })
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer', website: '' }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setNewsletterState({ status: 'error', message: data.error || 'Something went wrong.' })
        return
      }
      setNewsletterState({ status: 'success' })
      setNewsletterEmail('')
      track('newsletter_subscribe', 'footer')
    } catch {
      setNewsletterState({ status: 'error', message: 'Network error. Please try again.' })
    }
  }

  const handleServiceNav = (serviceId: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    track('view_service', serviceId)
    scrollToId('#services')
  }

  return (
    <footer className="mt-auto bg-zinc-950 pt-16 pb-8 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-[11px] font-bold tracking-wider text-white shadow-md shadow-teal-600/25"
              >
                {profile.initials}
              </span>
              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="mt-0.5 text-xs text-white/50">{profile.title}</p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-sm text-white/50">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              {profile.location}
            </p>
            <LocalTime />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              {profile.brandMessage}
            </p>
          </div>

          {/* Explore — every dedicated page */}
          <nav aria-label="Footer explore links" className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              Explore
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
              <li>
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-teal-300"
                >
                  Home
                </Link>
              </li>
              {sitePages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="inline-flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-teal-300"
                  >
                    {page.navLabel ?? page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav aria-label="Footer services" className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              Services
            </h3>
            <ul className="mt-4">
              {services.map((service) => (
                <li key={service.id}>
                  <a
                    href="#services"
                    onClick={handleServiceNav(service.id)}
                    className="inline-flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-teal-300"
                  >
                    {service.shortTitle}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              Contact
            </h3>
            <ul className="mt-4 space-y-1">
              <li>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_whatsapp', 'footer')}
                  className="inline-flex min-h-11 items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-teal-300"
                >
                  <MessageCircle className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_telegram', 'footer')}
                  className="inline-flex min-h-11 items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-teal-300"
                >
                  <Send className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  Telegram
                </a>
              </li>
              <li className="flex items-center justify-between gap-2">
                <a
                  href={telLink()}
                  onClick={() => track('click_phone', 'footer')}
                  className="inline-flex min-h-11 flex-1 items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-teal-300"
                >
                  <Phone className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  {profile.phoneDisplay}
                </a>
                <CopyContactButton value={profile.phoneRaw} label="phone number" />
              </li>
              <li className="flex items-center justify-between gap-2">
                <a
                  href={mailLink()}
                  onClick={() => track('click_email', 'footer')}
                  className="inline-flex min-h-11 flex-1 items-center gap-2.5 text-sm break-all text-white/60 transition-colors hover:text-teal-300"
                >
                  <Mail className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                  {profile.email}
                </a>
                <CopyContactButton value={profile.email} label="email address" />
              </li>
            </ul>
            <div className="mt-4 flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon, event }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track(event, 'footer')}
                  aria-label={`${label} profile`}
                  title={label}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-teal-400/40 hover:bg-white/10 hover:text-teal-300"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter strip */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-r from-teal-600/10 via-white/[0.03] to-transparent p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <Mail className="h-4 w-4 text-teal-400" aria-hidden="true" />
                Data notes, occasionally
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/50">
                Practical articles on analytics, ML and applied AI — plus notes on new projects.
                No spam, unsubscribe anytime.
              </p>
            </div>

            {newsletterState.status === 'success' ? (
              <p
                className="flex items-center gap-2 text-sm font-medium text-teal-300"
                role="status"
              >
                <MailCheck className="h-5 w-5" aria-hidden="true" />
                You&apos;re subscribed — thank you!
              </p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md" noValidate>
                <div className="flex gap-2">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value)
                      if (newsletterState.status === 'error') setNewsletterState({ status: 'idle' })
                    }}
                    aria-invalid={newsletterState.status === 'error'}
                    aria-describedby={
                      newsletterState.status === 'error' ? 'newsletter-error' : undefined
                    }
                    className="h-11 w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-teal-400/60 focus:bg-white/10"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={newsletterState.status === 'loading'}
                    className="h-11 shrink-0 px-4"
                  >
                    {newsletterState.status === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </div>
                {newsletterState.status === 'error' && (
                  <p id="newsletter-error" role="alert" className="mt-2 text-xs text-red-400">
                    {newsletterState.message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-white/50">
            © {year} {profile.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLegal('privacy')}
              className="inline-flex min-h-11 items-center px-3 text-sm text-white/50 transition-colors hover:text-teal-300"
            >
              Privacy
            </button>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <button
              type="button"
              onClick={() => setLegal('terms')}
              className="inline-flex min-h-11 items-center px-3 text-sm text-white/50 transition-colors hover:text-teal-300"
            >
              Terms
            </button>
          </div>
        </div>
      </div>

      {/* Privacy dialog */}
      <Dialog open={legal === 'privacy'} onOpenChange={(o) => setLegal(o ? 'privacy' : null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Privacy</DialogTitle>
            <DialogDescription>How information on this website is handled.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-muted-foreground">
            {PRIVACY_POINTS.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms dialog */}
      <Dialog open={legal === 'terms'} onOpenChange={(o) => setLegal(o ? 'terms' : null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Terms</DialogTitle>
            <DialogDescription>The short, honest version of working together.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-muted-foreground">
            {TERMS_POINTS.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
