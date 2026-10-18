'use client'


import { tx } from '@/lib/ui-text'
import { apiFetch } from '@/lib/api-client'
/**
 * ============================================================================
 * Contact — dark closing section (#contact), right before the footer.
 * ----------------------------------------------------------------------------
 * Left  (lg:col-span-3): compact quick-message form → POST /api/contact (JSON).
 * Right (lg:col-span-2): contact method cards (WhatsApp, Telegram, Phone,
 *                        Email, LinkedIn, Upwork, Freelancer).
 * Below: final CTA banner driven by `profile.finalCta`.
 * ============================================================================
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { profile } from '@/config/profile'
import { buildVCard, mailLink, platformLinks, scrollToId, telLink, telegramLink, waLink } from '@/lib/links'
import { track, type AnalyticsEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/* ------------------------------- constants -------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* --------------------------- live Dhaka clock ----------------------------- */
/**
 * Live local time in Dhaka (Asia/Dhaka) + a soft availability hint.
 * Renders a placeholder on the server and starts ticking after mount, so
 * there is never a hydration mismatch. Updates once per second.
 */
function useDhakaTime() {
  const [now, setNow] = useState<{ time: string; hour: number } | null>(null)

  useEffect(() => {
    const timeFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    const hourFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      hourCycle: 'h23',
    })
    const tick = () => {
      const d = new Date()
      setNow({ time: timeFmt.format(d), hour: Number(hourFmt.format(d)) })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return now
}

interface ContactMessageState {
  name: string
  email: string
  subject: string
  message: string
  website: string // honeypot — must stay empty
}

const INITIAL_MESSAGE: ContactMessageState = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
}

interface ContactCard {
  label: string
  value: string
  href: string
  icon: LucideIcon
  chip: string
  event: AnalyticsEvent
  /** Opens in a new tab (wa.me + platform profiles; not tel:/mailto:). */
  external: boolean
}

const CONTACT_CARDS: ContactCard[] = [
  {
    label: 'WhatsApp',
    value: profile.phoneDisplay,
    href: waLink(),
    icon: MessageCircle,
    chip: 'bg-[#25D366]/10 text-[#4ade80]',
    event: 'click_whatsapp',
    external: true,
  },
  {
    label: 'Telegram',
    value: profile.phoneDisplay,
    href: telegramLink(),
    icon: Send,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_telegram',
    external: true,
  },
  {
    label: 'Phone Call',
    value: profile.phoneDisplay,
    href: telLink(),
    icon: Phone,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_phone',
    external: false,
  },
  {
    label: 'Email',
    value: profile.email,
    href: mailLink(),
    icon: Mail,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_email',
    external: false,
  },
  {
    label: 'LinkedIn',
    value: 'Connect on LinkedIn',
    href: platformLinks.linkedin,
    icon: Linkedin,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_linkedin',
    external: true,
  },
  {
    label: 'Upwork',
    value: 'Hire on Upwork',
    href: platformLinks.upwork,
    icon: Briefcase,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_upwork',
    external: true,
  },
  {
    label: 'Freelancer',
    value: 'Hire on Freelancer',
    href: platformLinks.freelancer,
    icon: Globe,
    chip: 'bg-teal-500/10 text-teal-300',
    event: 'click_freelancer',
    external: true,
  },
]

/* ------------------------------- component -------------------------------- */

export default function Contact() {
  const { toast } = useToast()

  const dhaka = useDhakaTime()
  // Honest soft hint: usually reachable 9:00–22:00 Dhaka time.
  const likelyAvailable = dhaka ? dhaka.hour >= 9 && dhaka.hour < 22 : null

  const [form, setForm] = useState<ContactMessageState>(INITIAL_MESSAGE)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactMessageState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [vcardSaved, setVcardSaved] = useState(false)

  /** Generate a vCard from the profile config and trigger a client-side download. */
  function saveVCard() {
    try {
      const blob = new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'shah-muhammad-fazle-rabbi.vcf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
      track('save_contact', 'contact-section')
      setVcardSaved(true)
      window.setTimeout(() => setVcardSaved(false), 2500)
    } catch {
      /* download unavailable — non-critical */
    }
  }

  const set =
    (key: keyof ContactMessageState) =>
    (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }

  function validate(): boolean {
    const errs: Partial<Record<keyof ContactMessageState, string>> = {}
    if (form.name.trim().length < 2) errs.name = 'Please enter your name.'
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Please enter a valid email address.'
    if (form.message.trim().length < 10)
      errs.message = 'Please write a short message (at least 10 characters).'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          website: form.website, // honeypot
        }),
      })
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}))

      if (res.ok && data.ok) {
        track('submit_contact')
        setSent(true)
      } else {
        toast({
          title: 'Message not sent',
          description: data.error ?? 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach the server. Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const darkInput =
    'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/30'

  return (
    <section id="contact" className="bg-zinc-950 py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* ------------------------------ heading ------------------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
            Contact
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Let&apos;s Work Together
          </h2>
          <p className="mt-4 text-base text-zinc-400 md:text-lg">
            Have a dataset, business problem, or AI idea? Tell me what you are trying to achieve —
            I will respond with the most practical approach. Fastest replies on WhatsApp or
            Telegram; email is best for detailed briefs.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          {/* --------------------------- quick message --------------------------- */}
          <div className="lg:col-span-3">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-2xl border border-teal-500/30 bg-teal-500/5 p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
                  <CheckCircle2 className="h-8 w-8 text-teal-300" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">Message sent — thank you!</h3>
                <p className="mt-2 max-w-md text-sm text-zinc-400">
                  Your message has been received. I usually reply within 24 hours. For anything
                  urgent, WhatsApp or Telegram is the fastest way to reach me.
                </p>
                <Button
                  asChild
                  className="mt-6 h-11 bg-[#25D366] px-5 text-white hover:bg-[#1fb857]"
                >
                  <a
                    href={waLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_whatsapp', 'contact-success')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Me
                  </a>
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                noValidate
                className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ct-name" className="text-zinc-300">
                      Name *
                    </Label>
                    <Input
                      id="ct-name"
                      value={form.name}
                      onChange={(e) => set('name')(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className={darkInput}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'ct-name-error' : undefined}
                    />
                    {errors.name ? (
                      <p id="ct-name-error" className="text-destructive text-xs">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ct-email" className="text-zinc-300">
                      Email *
                    </Label>
                    <Input
                      id="ct-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email')(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className={darkInput}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'ct-email-error' : undefined}
                    />
                    {errors.email ? (
                      <p id="ct-email-error" className="text-destructive text-xs">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="ct-subject" className="text-zinc-300">
                    Subject
                  </Label>
                  <Input
                    id="ct-subject"
                    value={form.subject}
                    onChange={(e) => set('subject')(e.target.value)}
                    placeholder="What is this about? (optional)"
                    className={darkInput}
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="ct-message" className="text-zinc-300">
                    Message *
                  </Label>
                  <Textarea
                    id="ct-message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => set('message')(e.target.value)}
                    placeholder="Tell me briefly what you are trying to achieve…"
                    className={darkInput}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'ct-message-error' : undefined}
                  />
                  {errors.message ? (
                    <p id="ct-message-error" className="text-destructive text-xs">
                      {errors.message}
                    </p>
                  ) : null}
                </div>

                {/* Honeypot — hidden from humans, catches bots */}
                <Input
                  name="website"
                  value={form.website}
                  onChange={(e) => set('website')(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                />

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 min-w-[160px] bg-teal-600 px-6 text-white hover:bg-teal-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Or reach me directly — WhatsApp or Telegram for the fastest reply, email for
                    detailed briefs.
                  </p>
                </div>
              </motion.form>
            )}
          </div>

          {/* ------------------------- contact method cards ------------------------- */}
          <div className="space-y-3 lg:col-span-2">
            {CONTACT_CARDS.map((card, i) => (
              <motion.a
                key={card.label}
                href={card.href}
                target={card.external ? '_blank' : undefined}
                rel={card.external ? 'noopener noreferrer' : undefined}
                onClick={() => track(card.event, 'contact-section')}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-teal-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                    card.chip
                  )}
                >
                  <card.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{card.label}</span>
                  <span className="block truncate text-sm text-zinc-400">{card.value}</span>
                </span>
                {card.external ? (
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-teal-300" />
                ) : null}
              </motion.a>
            ))}

            {/* ---------------- save contact (vCard) + response time ---------------- */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: 0.24 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Save my contact</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    vCard with phone, email &amp; profiles — one tap into your address book.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveVCard}
                  aria-label="Download contact card (vCard)"
                  className="h-9 shrink-0 border-teal-500/40 bg-teal-500/10 px-3 text-teal-300 hover:bg-teal-500/20 hover:text-teal-200"
                >
                  {vcardSaved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden="true" />
                Replies within 24 hours — usually much faster (GMT+6).
              </p>
              {/* ------------------ live Dhaka time + availability ------------------ */}
              <div
                className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"
                aria-live="off"
              >
                <p className="flex items-center gap-2 text-xs text-zinc-400">
                  <Globe
                    className="h-3.5 w-3.5 shrink-0 text-teal-400"
                    aria-hidden="true"
                  />
                  <span>
                    My local time{' '}
                    <span
                      className="font-semibold tabular-nums text-white"
                      suppressHydrationWarning
                    >
                      {dhaka ? dhaka.time : '—:—:—'}
                    </span>{' '}
                    <span className="text-zinc-500">GMT+6</span>
                  </span>
                </p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    likelyAvailable === false
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    {likelyAvailable === false ? (
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    ) : (
                      <>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </>
                    )}
                  </span>
                  {likelyAvailable === false
                    ? 'Away — leave a message'
                    : 'Likely available now'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ------------------------------ final CTA ------------------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-14 flex flex-col justify-between items-start gap-4 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-600/20 to-transparent p-6 md:flex-row md:items-center"
        >
          <p className="text-lg font-semibold text-white">{profile.finalCta}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => scrollToId('start-project')}
              className="h-11 bg-teal-600 px-5 text-white hover:bg-teal-500"
            >
              {tx('Start a Project')}
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
            >
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_whatsapp', 'final-cta')}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Me
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 px-5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <a
                href={platformLinks.upwork}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_upwork', 'final-cta')}
              >
                Hire Me on Upwork
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
