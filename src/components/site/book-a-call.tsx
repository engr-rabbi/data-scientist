'use client'


import { apiFetch } from '@/lib/api-client'
/**
 * #book-a-call — free 30-minute discovery call, conversion layer for
 * "let's talk before you commit".
 *
 * How it works (honest, no fake calendar integration):
 *  1. Visitor picks a day chip (next ~12 workdays, Sun–Thu, Dhaka business
 *     hours 10:00–18:00 GMT+6) and a 30-minute slot — shown in the visitor's
 *     local timezone with the Dhaka time underneath.
 *  2. Availability for the selected day is fetched from GET /api/bookings
 *     (taken slots only — no personal data leaks).
 *  3. Details (name, email, optional WhatsApp, agenda) are POSTed; the server
 *     re-validates the slot against the exact grid the client shows and
 *     rejects double-bookings with 409.
 *  4. Success panel: reference ID, "Add to calendar" (.ics, STATUS:TENTATIVE)
 *     and a WhatsApp deep link to confirm faster.
 *
 * The owner confirms manually by email/WhatsApp — copy states this clearly.
 *
 * Analytics: booking_started (slot picked), booking_completed,
 * calendar_download, click_whatsapp (booking-success), start_project
 * (cross-link back to the inquiry form).
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Globe,
  History,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Video,
} from 'lucide-react'

import { profile } from '@/config/profile'
import { track } from '@/lib/analytics'
import { scrollToId } from '@/lib/links'
import {
  BOOKING,
  buildICS,
  dayChipLabel,
  formatDhakaTime,
  formatVisitorTime,
  formatVisitorDate,
  formatDhakaDate,
  listBookableDays,
  slotsForDay,
  type BookableDay,
} from '@/lib/booking'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import SectionHeading from '@/components/site/section-heading'

const AGENDA_MIN = 10
const AGENDA_MAX = 1000
/** localStorage key for the visitor's most recent proposal (ref + email). */
const LAST_BOOKING_KEY = 'smfr-booking-last-v1'

interface Details {
  name: string
  email: string
  whatsapp: string
  agenda: string
  website: string // honeypot
}

const EMPTY_DETAILS: Details = { name: '', email: '', whatsapp: '', agenda: '', website: '' }

export default function BookACall() {
  /* ------------------------------ availability ----------------------------- */
  const [days, setDays] = useState<BookableDay[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [takenByDay, setTakenByDay] = useState<Record<string, string[]>>({})
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)
  const nowRef = useRef<number>(Date.now())

  /* --------------------------------- details ------------------------------- */
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null)

  /* ----------------------------- manage a proposal ------------------------- */
  const [manageOpen, setManageOpen] = useState(false)
  const [manage, setManage] = useState({ ref: '', email: '' })
  const [manageBusy, setManageBusy] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)
  const [manageResult, setManageResult] = useState<{ status: string; slotIso: string; name?: string } | null>(null)
  const [manageCancelled, setManageCancelled] = useState(false)
  const [availVersion, setAvailVersion] = useState(0)

  /* Load the bookable day chips + open-slot counts (client-only). */
  useEffect(() => {
    const t = window.setTimeout(() => {
      nowRef.current = Date.now()
      const d = listBookableDays()
      setDays(d)
      if (d[0]) setSelectedDay(d[0].key)
      apiFetch('/api/bookings?summary=1')
        .then((r) => (r.ok ? r.json() : { counts: {} }))
        .then((data: { counts?: Record<string, number> }) => setDayCounts(data.counts || {}))
        .catch(() => {})
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  /* Fetch taken slots whenever the selected day changes (or availability is invalidated). */
  useEffect(() => {
    if (!selectedDay) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoadingSlots(true)
      apiFetch(`/api/bookings?date=${selectedDay}`)
        .then((r) => (r.ok ? r.json() : { taken: [] }))
        .then((data: { taken?: string[] }) => {
          if (cancelled) return
          setTakenByDay((prev) => ({ ...prev, [selectedDay]: data.taken || [] }))
          setLoadingSlots(false)
        })
        .catch(() => {
          if (!cancelled) setLoadingSlots(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [selectedDay, availVersion])

  const takenSet = new Set(selectedDay ? takenByDay[selectedDay] ?? [] : [])
  const allSlots = selectedDay ? slotsForDay(selectedDay) : []
  const openSlots = allSlots.filter(
    (iso) => !takenSet.has(iso) && Date.parse(iso) >= nowRef.current + BOOKING.leadTimeMinutes * 60_000
  )

  function pickSlot(iso: string) {
    if (takenSet.has(iso)) return
    const isFirstPick = pickedSlot === null
    setPickedSlot(iso)
    setError(null)
    if (isFirstPick) {
      track('booking_started', `${selectedDay} ${formatDhakaTime(iso)}`)
    }
  }

  const detailsValid =
    details.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(details.email.trim()) &&
    details.agenda.trim().length >= AGENDA_MIN

  /* --------------------------------- submit -------------------------------- */
  async function submitBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!pickedSlot || submitting || !detailsValid) return
    setSubmitting(true)
    setError(null)
    try {
      const tzName =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
          : undefined
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: details.name.trim(),
          email: details.email.trim(),
          whatsapp: details.whatsapp.trim() || undefined,
          agenda: details.agenda.trim(),
          slot: pickedSlot,
          tzOffset: new Date().getTimezoneOffset(),
          tzName,
          website: details.website,
        }),
      })
      const data: { ok?: boolean; id?: string; error?: string } = await res.json().catch(() => ({}))
      if (res.status === 409) {
        // Slot snatched while filling the form — refresh availability.
        if (selectedDay) setTakenByDay((prev) => ({ ...prev, [selectedDay]: [...takenSet, pickedSlot] }))
        setPickedSlot(null)
        setError(data.error || 'That slot was just taken — please choose a different time.')
        refreshCounts()
        return
      }
      if (!res.ok || !data.id) {
        setError(data.error || 'Could not save your request. Please try again.')
        return
      }
      setConfirmedRef(data.id)
      track('booking_completed', `${selectedDay} ${formatDhakaTime(pickedSlot)}`)
      refreshCounts()
      try {
        window.localStorage.setItem(
          LAST_BOOKING_KEY,
          JSON.stringify({ ref: data.id, email: details.email.trim() })
        )
      } catch {
        /* storage unavailable — non-critical */
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /** Re-fetch the per-day open-slot counts (after a booking or a clash). */
  function refreshCounts() {
    apiFetch('/api/bookings?summary=1')
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((data: { counts?: Record<string, number> }) => setDayCounts(data.counts || {}))
      .catch(() => {})
  }

  function resetBooking() {
    setConfirmedRef(null)
    setPickedSlot(null)
    setDetails(EMPTY_DETAILS)
    setError(null)
  }

  /* --------------------------- manage a proposal --------------------------- */

  function toggleManage() {
    const next = !manageOpen
    setManageOpen(next)
    setManageError(null)
    if (next) {
      // Fresh start every time the panel opens (previous result/cancel state
      // should not linger).
      setManageResult(null)
      setManageCancelled(false)
      if (manage.ref === '' && manage.email === '') {
        // Offer to prefill from the visitor's last proposal on this device.
        try {
          const raw = window.localStorage.getItem(LAST_BOOKING_KEY)
          if (raw) {
            const saved = JSON.parse(raw) as { ref?: string; email?: string }
            setManage({ ref: saved.ref ?? '', email: saved.email ?? '' })
          }
        } catch {
          /* no saved proposal — start empty */
        }
      }
    }
  }

  async function manageLookup() {
    if (manageBusy || !/^[a-z0-9]{20,40}$/i.test(manage.ref.trim()) || !/^\S+@\S+\.\S+$/.test(manage.email.trim())) {
      setManageError('Please enter your reference ID and the email you booked with.')
      return
    }
    setManageBusy(true)
    setManageError(null)
    setManageCancelled(false)
    try {
      const res = await apiFetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: manage.ref.trim(), email: manage.email.trim(), action: 'lookup' }),
      })
      const data: { ok?: boolean; status?: string; slotUtc?: string; name?: string; error?: string } = await res
        .json()
        .catch(() => ({}))
      if (!res.ok || !data.ok) {
        setManageError(data.error || 'Could not find the proposal. Please double-check and try again.')
        track('booking_lookup', 'not-found')
        return
      }
      setManageResult({ status: data.status || 'proposed', slotIso: data.slotUtc || '', name: data.name || '' })
      track('booking_lookup', 'found')
    } catch {
      setManageError('Network error — please check your connection and try again.')
    } finally {
      setManageBusy(false)
    }
  }

  async function manageCancel() {
    if (manageBusy || !manageResult) return
    setManageBusy(true)
    setManageError(null)
    try {
      const res = await apiFetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: manage.ref.trim(), email: manage.email.trim(), action: 'cancel' }),
      })
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setManageError(data.error || 'Could not cancel the proposal. Please try WhatsApp instead.')
        return
      }
      setManageCancelled(true)
      setManageResult(null)
      track('booking_cancelled', manage.ref.trim())
      refreshCounts()
      setAvailVersion((v) => v + 1)
    } catch {
      setManageError('Network error — please check your connection and try again.')
    } finally {
      setManageBusy(false)
    }
  }

  function closeManage() {
    setManageOpen(false)
    setManageResult(null)
    setManageCancelled(false)
    setManageError(null)
  }

  /* ------------------------------ .ics download ---------------------------- */
  function downloadICS() {
    if (!pickedSlot || !confirmedRef) return
    try {
      const ics = buildICS({
        slotIso: pickedSlot,
        name: details.name.trim() || 'Website visitor',
        agenda: details.agenda.trim().slice(0, 300),
        refId: confirmedRef,
      })
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `discovery-call-${confirmedRef}.ics`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      track('calendar_download', confirmedRef)
    } catch {
      /* download unavailable — non-critical */
    }
  }

  /**
   * Confirmed-proposal .ics (STATUS:CONFIRMED) from the manage panel —
   * offered after the owner has accepted the proposal, so visitors can put
   * the final appointment in their calendar without an email round-trip.
   */
  function downloadConfirmedICS() {
    if (!manageResult?.slotIso || manageResult.status !== 'confirmed') return
    try {
      const ics = buildICS({
        slotIso: manageResult.slotIso,
        name: manageResult.name || 'Client',
        agenda: 'As submitted with your proposal.',
        refId: manage.ref.trim(),
        status: 'CONFIRMED',
      })
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `confirmed-call-${manage.ref.trim()}.ics`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      track('calendar_download', `${manage.ref.trim()}-confirmed`)
    } catch {
      /* download unavailable — non-critical */
    }
  }

  function whatsappConfirmLink(): string {
    const when = pickedSlot
      ? `${formatDhakaDate(pickedSlot)} at ${formatDhakaTime(pickedSlot)} (Dhaka time) — ${formatVisitorDate(pickedSlot)} ${formatVisitorTime(pickedSlot)} my time`
      : ''
    const agenda = details.agenda.trim().slice(0, 120)
    const text = `Hello ${profile.name}, I proposed a discovery call for ${when}. Agenda: ${agenda}. Ref: ${confirmedRef}. Please confirm.`
    return `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(text)}`
  }

  /* --------------------------------- render -------------------------------- */
  return (
    <section id="book-a-call" aria-labelledby="book-a-call-heading" className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div id="book-a-call-heading">
          <SectionHeading
            eyebrow="Discovery Call"
            title="Book a Free 30-Minute Intro Call"
            description="Propose a time that suits you — we'll talk through your data problem, the practical approach and the rough scope. No obligations, no charge."
          />
        </div>

        <div className="mt-8 md:mt-10 grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* ----------------------------- info panel ---------------------------- */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1 lg:col-span-2"
          >
            <div className="h-full rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-5 md:p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1 text-[11px] font-semibold text-teal-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Free · 30 minutes · No obligations
              </span>

              <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-zinc-900">
                What we&apos;ll cover
              </h3>
              <ul className="mt-3 space-y-3.5">
                {[
                  {
                    icon: Compass,
                    title: 'Your data & problem',
                    text: 'A quick review of what you have — files, systems, questions — and what you want to achieve.',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Practical approach',
                    text: 'The most direct analytics / ML / AI route, what the deliverable looks like and what it takes.',
                  },
                  {
                    icon: ArrowRight,
                    title: 'Scope & quote direction',
                    text: 'Rough timeline and which engagement model fits — a written quotation follows the call.',
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600/10 text-teal-700">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-zinc-900">{item.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2.5 border-t border-teal-100 pt-5 text-xs text-zinc-600">
                <p className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
                  Google Meet or WhatsApp call — your choice
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
                  Slots shown in your timezone · {BOOKING.startHourDhaka}:00–{BOOKING.endHourDhaka}:00 in Dhaka (GMT+6)
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
                  You&apos;ll get a personal confirmation — nothing is automated or charged
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  track('start_project', 'book-a-call-crosslink')
                  scrollToId('start-project')
                }}
                className="group mt-6 flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                <span className="text-xs text-zinc-600 md:text-sm">
                  <span className="block font-semibold text-zinc-900">Ready to share the full picture?</span>
                  Skip the call — send a detailed project inquiry instead.
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-teal-600 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </motion.aside>

          {/* ---------------------------- booking card --------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="order-1 min-w-0 lg:order-2 lg:col-span-3"
          >
            {confirmedRef ? (
              /* --------------------------- success panel --------------------------- */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50"
                >
                  <CheckCircle2 className="h-8 w-8 text-teal-600" />
                </motion.div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
                  Time requested — talk soon!
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Reference ID:{' '}
                  <span className="font-mono font-semibold text-teal-700">{confirmedRef}</span>
                </p>

                {pickedSlot ? (
                  <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                    <p className="text-sm font-semibold text-zinc-900">Proposed time</p>
                    <p className="mt-2 text-sm tabular-nums text-zinc-700">
                      {formatVisitorDate(pickedSlot)} · {formatVisitorTime(pickedSlot)}{' '}
                      <span className="text-zinc-500">(your time)</span>
                    </p>
                    <p className="text-sm tabular-nums text-zinc-700">
                      {formatDhakaTime(pickedSlot)} <span className="text-zinc-500">in Dhaka (GMT+6)</span>
                    </p>
                    {details.agenda.trim() ? (
                      <p className="mt-3 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500">
                        <span className="font-semibold text-zinc-700">Agenda:</span>{' '}
                        {details.agenda.trim().slice(0, 240)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="h-11 border-teal-200 bg-white px-5 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    onClick={downloadICS}
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Add to calendar
                  </Button>
                  <Button asChild className="h-11 bg-teal-600 px-5 text-white hover:bg-teal-500">
                    <a
                      href={whatsappConfirmLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('click_whatsapp', 'booking-success')}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Confirm faster on WhatsApp
                    </a>
                  </Button>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">What happens next</p>
                  <ol className="mt-3 space-y-2.5 text-sm text-zinc-700">
                    <li className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-700">
                        1
                      </span>
                      I review the request and reply by email/WhatsApp, usually within a few hours
                      (Dhaka 9:00–22:00).
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-700">
                        2
                      </span>
                      We confirm the exact time — or pick an alternative if the slot needs to move.
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-700">
                        3
                      </span>
                      We talk for 30 minutes — you leave with a clear next step, whether we work
                      together or not.
                    </li>
                  </ol>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-zinc-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-zinc-500">
                  <CalendarX2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                  Plans changed? Use “Manage a proposal” below to cancel anytime — the slot frees up
                  instantly.
                </div>

                <button
                  type="button"
                  onClick={resetBooking}
                  className="mt-6 text-xs font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  Book another time
                </button>
              </motion.div>
            ) : (
              /* --------------------------- booking form ---------------------------- */
              <div className="relative min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                {/* ------------------------- step 1: pick a time ------------------------ */}
                <fieldset className="min-w-0">
                  <legend className="flex w-full flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-900">1 · Pick a time</span>
                    <span className="text-[11px] text-zinc-400">
                      {days.length} workdays · Sun–Thu · Dhaka business hours
                    </span>
                  </legend>

                  {/* day chips — with live open-slot badges */}
                  <div className="relative">
                    <div
                      role="group"
                      aria-label="Choose a day"
                      className="custom-scrollbar -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
                    >
                      {days.length === 0 ? (
                        <div className="flex w-full gap-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-[52px] w-24 shrink-0 animate-pulse rounded-full bg-zinc-100"
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      ) : (
                        days.map((d) => {
                          const active = d.key === selectedDay
                          const open = dayCounts[d.key]
                          const known = typeof open === 'number'
                          const full = known && open === 0
                          const scarce = known && open > 0 && open <= 4
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => {
                                setSelectedDay(d.key)
                                setPickedSlot(null)
                                setError(null)
                              }}
                              aria-pressed={active}
                              aria-label={`${dayChipLabel(d.key)}${known ? `, ${open === 0 ? 'fully booked' : `${open} slots open`}` : ''}`}
                              className={cn(
                                'min-h-9 snap-start shrink-0 rounded-full border px-3.5 py-1 text-xs font-medium tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 active:scale-95',
                                active
                                  ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                  : 'border-zinc-200 bg-white text-zinc-600 hover:-translate-y-px hover:border-teal-400 hover:text-teal-700',
                                full && !active && 'opacity-55'
                              )}
                            >
                              {dayChipLabel(d.key)}
                              {known ? (
                                <span
                                  className={cn(
                                    'ml-1.5 text-[10px] font-semibold',
                                    active
                                      ? 'text-teal-100'
                                      : full
                                        ? 'text-zinc-400'
                                        : scarce
                                          ? 'text-amber-600'
                                          : 'text-zinc-400'
                                  )}
                                >
                                  {full ? 'Full' : open}
                                </span>
                              ) : null}
                            </button>
                          )
                        })
                      )}
                    </div>
                    {/* scrollability hint (right fade) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent"
                    />
                  </div>

                  {/* slot grid */}
                  <div
                    aria-busy={loadingSlots}
                    aria-live="polite"
                    className="mt-3"
                  >
                    {loadingSlots ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-hidden="true">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-[52px] animate-pulse rounded-xl bg-zinc-100" />
                        ))}
                      </div>
                    ) : openSlots.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                        No open slots left on this day — try the next day chip.
                      </p>
                    ) : (
                      <div role="group" aria-label="Available time slots" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {allSlots.map((iso) => {
                          const isTaken = takenSet.has(iso)
                          const isPast = Date.parse(iso) < nowRef.current + BOOKING.leadTimeMinutes * 60_000
                          const disabled = isTaken || isPast
                          const selected = pickedSlot === iso
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => pickSlot(iso)}
                              disabled={disabled}
                              aria-pressed={selected}
                              aria-label={`${formatVisitorDate(iso)} ${formatVisitorTime(iso)} your time, ${formatDhakaTime(iso)} Dhaka${isTaken ? ' (taken)' : ''}`}
                              className={cn(
                                'rounded-xl border px-2 py-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50',
                                selected
                                  ? 'scale-[1.03] border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/25'
                                  : 'border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md',
                                disabled &&
                                  'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 opacity-60 hover:translate-y-0 hover:border-zinc-100 hover:shadow-none line-through'
                              )}
                            >
                              <span
                                className={cn(
                                  'block text-sm font-semibold tabular-nums',
                                  disabled && !selected && 'text-zinc-300'
                                )}
                              >
                                {formatVisitorTime(iso)}
                              </span>
                              <span
                                className={cn(
                                  'block text-[10px] tabular-nums',
                                  selected ? 'text-teal-100' : 'text-zinc-400'
                                )}
                              >
                                {formatDhakaTime(iso)} Dhaka
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* selected summary */}
                  <div aria-live="polite">
                    {pickedSlot ? (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-teal-50 px-3.5 py-2.5 text-xs text-teal-800"
                      >
                        <CalendarCheck className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                        <span className="tabular-nums">
                          Selected: {formatVisitorDate(pickedSlot)}, {formatVisitorTime(pickedSlot)} your
                          time — {formatDhakaTime(pickedSlot)} in Dhaka (GMT+6)
                        </span>
                      </motion.p>
                    ) : null}
                  </div>
                </fieldset>

                {/* ------------------------- step 2: your details ------------------------ */}
                <form onSubmit={submitBooking} noValidate className="mt-8">
                  <fieldset disabled={!pickedSlot} className={cn('min-w-0', !pickedSlot && 'opacity-50')}>
                    <legend className="text-sm font-bold text-zinc-900">2 · Your details</legend>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="booking-name" className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Name <span className="text-teal-600">*</span>
                        </label>
                        <Input
                          id="booking-name"
                          name="name"
                          autoComplete="name"
                          required
                          value={details.name}
                          onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Jane Smith"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <label htmlFor="booking-email" className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Email <span className="text-teal-600">*</span>
                        </label>
                        <Input
                          id="booking-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={details.email}
                          onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                          placeholder="jane@company.com"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="booking-whatsapp" className="mb-1.5 block text-xs font-medium text-zinc-700">
                        WhatsApp <span className="font-normal text-zinc-400">(optional — speeds up confirmation)</span>
                      </label>
                      <Input
                        id="booking-whatsapp"
                        name="whatsapp"
                        type="tel"
                        autoComplete="tel"
                        value={details.whatsapp}
                        onChange={(e) => setDetails((d) => ({ ...d, whatsapp: e.target.value }))}
                        placeholder="+1 555 000 0000"
                        className="h-10"
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="booking-agenda" className="mb-1.5 block text-xs font-medium text-zinc-700">
                        What should we focus on? <span className="text-teal-600">*</span>
                      </label>
                      <Textarea
                        id="booking-agenda"
                        name="agenda"
                        required
                        rows={3}
                        value={details.agenda}
                        onChange={(e) => setDetails((d) => ({ ...d, agenda: e.target.value }))}
                        placeholder="e.g. Sales data in 3 spreadsheets — I need a monthly Power BI dashboard and help forecasting next quarter."
                        className="min-h-[88px] resize-y"
                      />
                      <p className="mt-1.5 text-right text-[11px] tabular-nums text-zinc-400">
                        {details.agenda.trim().length < AGENDA_MIN
                          ? `At least ${AGENDA_MIN} characters — ${AGENDA_MIN - details.agenda.trim().length} to go`
                          : `${details.agenda.length}/${AGENDA_MAX}`}
                      </p>
                    </div>

                    {/* Honeypot — visually hidden, bots fill it */}
                    <div className="sr-only" aria-hidden="true">
                      <label htmlFor="booking-website">Website</label>
                      <input
                        id="booking-website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={details.website}
                        onChange={(e) => setDetails((d) => ({ ...d, website: e.target.value }))}
                      />
                    </div>
                  </fieldset>

                  {error ? (
                    <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <p className="order-2 text-center text-[11px] leading-relaxed text-zinc-400 sm:order-1 sm:text-left">
                      Free intro call · You&apos;ll get a personal confirmation — usually within a few
                      hours (Dhaka 9:00–22:00).
                    </p>
                    <Button
                      type="submit"
                      disabled={!pickedSlot || !detailsValid || submitting}
                      className="order-1 h-11 w-full bg-teal-600 px-6 text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Sending request…
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                          Request this time
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ---------------------- manage an existing proposal ---------------------- */}
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-5 md:p-6">
              <button
                type="button"
                onClick={toggleManage}
                aria-expanded={manageOpen}
                className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-lg"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm">
                    <History className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900">Manage a proposal</span>
                    <span className="block text-xs text-zinc-500">
                      Already requested a time? Look it up or cancel it yourself.
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300',
                    manageOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence initial={false}>
                {manageOpen ? (
                  <motion.div
                    key="manage-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {manageCancelled ? (
                      /* ------------------------- cancelled state ------------------------- */
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-white p-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
                          <CalendarX2 className="h-4.5 w-4.5 text-teal-600" aria-hidden="true" />
                        </span>
                        <span className="text-xs leading-relaxed text-zinc-600">
                          <span className="block text-sm font-semibold text-zinc-900">
                            Proposal cancelled
                          </span>
                          The time slot is free again. Come back whenever it suits you — or book a new
                          slot right away.
                        </span>
                      </div>
                    ) : manageResult ? (
                      /* --------------------------- lookup result --------------------------- */
                      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              manageResult.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                manageResult.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                              )}
                              aria-hidden="true"
                            />
                            {manageResult.status === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation'}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">{manage.ref}</span>
                        </div>
                        {manageResult.slotIso ? (
                          <p className="mt-3 text-sm tabular-nums text-zinc-700">
                            {formatVisitorDate(manageResult.slotIso)} · {formatVisitorTime(manageResult.slotIso)}{' '}
                            <span className="text-zinc-500">(your time)</span>
                            <span className="mx-2 text-zinc-300">|</span>
                            {formatDhakaTime(manageResult.slotIso)}{' '}
                            <span className="text-zinc-500">Dhaka (GMT+6)</span>
                          </p>
                        ) : null}
                        {manageResult.status === 'proposed' ? (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={manageBusy}
                              onClick={manageCancel}
                              className="h-9 border-zinc-300 bg-white text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            >
                              {manageBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <CalendarX2 className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              Cancel this proposal
                            </Button>
                            <Button variant="ghost" size="sm" onClick={closeManage} className="h-9 text-zinc-500">
                              Close
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                            {manageResult.status === 'confirmed' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={downloadConfirmedICS}
                                  className="h-9 border-emerald-300 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                                >
                                  <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                  Add to calendar (.ics)
                                </Button>
                                <p className="text-xs text-zinc-500 sm:hidden">Accepted — grab the calendar file.</p>
                              </>
                            ) : null}
                            <Button variant="ghost" size="sm" onClick={closeManage} className="h-9 text-zinc-500">
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ---------------------------- lookup form ---------------------------- */
                      <div className="mt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label htmlFor="manage-ref" className="mb-1.5 block text-xs font-medium text-zinc-700">
                              Reference ID
                            </label>
                            <Input
                              id="manage-ref"
                              value={manage.ref}
                              onChange={(e) => setManage((m) => ({ ...m, ref: e.target.value }))}
                              placeholder="cmur5nosj00…"
                              className="h-10 font-mono text-xs"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label htmlFor="manage-email" className="mb-1.5 block text-xs font-medium text-zinc-700">
                              Email you booked with
                            </label>
                            <Input
                              id="manage-email"
                              type="email"
                              value={manage.email}
                              onChange={(e) => setManage((m) => ({ ...m, email: e.target.value }))}
                              placeholder="you@company.com"
                              className="h-10"
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Button
                            type="button"
                            size="sm"
                            disabled={manageBusy}
                            onClick={manageLookup}
                            className="h-9 bg-teal-600 text-white hover:bg-teal-500"
                          >
                            {manageBusy ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                Looking up…
                              </>
                            ) : (
                              <>
                                <History className="h-3.5 w-3.5" aria-hidden="true" />
                                Find my proposal
                              </>
                            )}
                          </Button>
                          <p className="text-[11px] leading-relaxed text-zinc-400">
                            Cancelled slots become available to others immediately.
                          </p>
                        </div>
                      </div>
                    )}

                    {manageError ? (
                      <p
                        role="alert"
                        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                      >
                        {manageError}
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
