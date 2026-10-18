import { bookingSettings, profile } from '@/config/profile'

/**
 * Discovery-call booking mechanics.
 *
 * Slots are generated for the owner's business timezone (Asia/Dhaka, fixed
 * UTC+6 — Bangladesh has no DST, so offset math is exact and future-proof).
 * A "slot" is always represented as a UTC ISO string; day keys are
 * 'YYYY-MM-DD' dates in Dhaka wall time.
 *
 * Used by:
 *  - google-apps-script/Code.gs (create_booking → server-side slot validation, same rules, read live from the saved bookingSettings)
 *  - src/components/site/book-a-call.tsx (client-side slot grid + ICS export)
 */

export const BOOKING = {
  ...bookingSettings,
  /** Asia/Dhaka fixed offset in minutes east of UTC (no DST). */
  dhakaOffsetMinutes: 360,
}

/* ------------------------------- Day helpers ------------------------------ */

/** 'YYYY-MM-DD' of a moment in Dhaka wall time. */
export function dhakaDateKey(date: Date): string {
  const wall = new Date(date.getTime() + BOOKING.dhakaOffsetMinutes * 60_000)
  const y = wall.getUTCFullYear()
  const m = String(wall.getUTCMonth() + 1).padStart(2, '0')
  const d = String(wall.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Weekday (0–6, Sunday first) of a Dhaka 'YYYY-MM-DD' day key. */
export function dhakaWeekday(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay()
}

export interface BookableDay {
  /** 'YYYY-MM-DD' in Dhaka wall time. */
  key: string
  /** 0–6 weekday of the day key. */
  weekday: number
}

/** True when a Dhaka day key is explicitly blacked out by the owner. */
export function isBlockedDay(dateKey: string): boolean {
  return (BOOKING.blockedDateKeys as readonly string[]).includes(dateKey)
}

/**
 * The next `count` bookable days (workdays only), starting today in Dhaka.
 * Today may have no remaining slots — the UI handles that via lead time.
 * Blocked/blackout days are skipped entirely.
 */
export function listBookableDays(now: Date = new Date()): BookableDay[] {
  const days: BookableDay[] = []
  const wall = new Date(now.getTime() + BOOKING.dhakaOffsetMinutes * 60_000)
  const cursor = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate()))
  for (let i = 0; i < BOOKING.calendarDaysAhead && days.length < BOOKING.maxDays; i++) {
    const key = cursor.toISOString().slice(0, 10)
    if ((BOOKING.workdays as readonly number[]).includes(dhakaWeekday(key)) && !isBlockedDay(key)) {
      days.push({ key, weekday: dhakaWeekday(key) })
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

/* ------------------------------ Slot helpers ------------------------------ */

/**
 * All possible slot start times (UTC ISO) for one Dhaka day key,
 * from startHourDhaka to endHourDhaka in slotMinutes steps.
 */
export function slotsForDay(dateKey: string): string[] {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return []
  const slots: string[] = []
  const totalSlots = ((BOOKING.endHourDhaka - BOOKING.startHourDhaka) * 60) / BOOKING.slotMinutes
  for (let i = 0; i < totalSlots; i++) {
    const minutes = BOOKING.startHourDhaka * 60 + i * BOOKING.slotMinutes
    const wall = new Date(Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60))
    slots.push(new Date(wall.getTime() - BOOKING.dhakaOffsetMinutes * 60_000).toISOString())
  }
  return slots
}

/** Dhaka wall-time parts of a UTC ISO moment. */
function dhakaWallParts(iso: string) {
  const epoch = Date.parse(iso)
  if (Number.isNaN(epoch)) return null
  const wall = new Date(epoch + BOOKING.dhakaOffsetMinutes * 60_000)
  return { epoch, wall }
}

/**
 * Server/client truth test: is this ISO string a slot the grid could ever
 * have produced? Guards against hand-crafted POSTs with arbitrary times.
 */
export function isValidSlotUtc(iso: string, now: Date = new Date()): boolean {
  const parts = dhakaWallParts(iso)
  if (!parts) return false
  const { epoch, wall } = parts

  // Aligned to the slot grid in Dhaka wall time.
  if (wall.getUTCSeconds() !== 0) return false
  if (wall.getUTCMinutes() % BOOKING.slotMinutes !== 0) return false

  const hour = wall.getUTCHours()
  if (hour < BOOKING.startHourDhaka || hour >= BOOKING.endHourDhaka) return false
  if (!(BOOKING.workdays as readonly number[]).includes(wall.getUTCDay())) return false

  const key = dhakaDateKey(new Date(epoch))
  if (isBlockedDay(key)) return false
  const bookable = listBookableDays(now).some((d) => d.key === key)
  if (!bookable) return false

  // Enough lead time.
  return epoch >= now.getTime() + BOOKING.leadTimeMinutes * 60_000
}

/* ------------------------------ Formatting -------------------------------- */

/** "2:30 PM" — Dhaka wall time of a slot. */
export function formatDhakaTime(iso: string): string {
  const parts = dhakaWallParts(iso)
  if (!parts) return ''
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(parts.wall)
}

/** "Tue, 6 Jan" — Dhaka date of a slot. */
export function formatDhakaDate(iso: string): string {
  const parts = dhakaWallParts(iso)
  if (!parts) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parts.wall)
}

/** Visitor-local "3:30 PM" for a slot (SSR-safe fallback: Dhaka time). */
export function formatVisitorTime(iso: string, tz?: string | null): string {
  const parts = dhakaWallParts(iso)
  if (!parts) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz || undefined,
    }).format(new Date(parts.epoch))
  } catch {
    return formatDhakaTime(iso)
  }
}

/** Visitor-local "Tue, 6 Jan" for a slot. */
export function formatVisitorDate(iso: string, tz?: string | null): string {
  const parts = dhakaWallParts(iso)
  if (!parts) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: tz || undefined,
    }).format(new Date(parts.epoch))
  } catch {
    return formatDhakaDate(iso)
  }
}

/** Human weekday label for a day chip — "Today" / "Tomorrow" / "Sun, 11 Jan". */
export function dayChipLabel(key: string, now: Date = new Date()): string {
  const todayKey = dhakaDateKey(now)
  const tomorrowKey = dhakaDateKey(new Date(now.getTime() + 86_400_000))
  if (key === todayKey) return 'Today'
  if (key === tomorrowKey) return 'Tomorrow'
  const [y, m, d] = key.split('-').map(Number)
  const wall = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(wall)
}

/* ------------------------------ ICS export -------------------------------- */

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Wrap pre-built VEVENT blocks in a complete VCALENDAR document.
 * Shared by the visitor .ics download and the owner's subscription feed.
 */
export function wrapVCalendar(vevents: string[]): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SMFR//Discovery Call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(`Discovery calls — ${profile.shortName}`)}`,
  ]
  return [...header, ...vevents, 'END:VCALENDAR'].join('\r\n')
}

/**
 * Build an RFC 5545 VEVENT block for one proposed call.
 * STATUS reflects the booking lifecycle: TENTATIVE (proposed),
 * CONFIRMED (owner accepted) or CANCELLED (freed slot).
 */
export function buildVEvent(opts: {
  slotIso: string
  name: string
  agenda: string
  refId: string
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
  descriptionExtra?: string[]
}): string {
  const status = opts.status ?? 'TENTATIVE'
  const start = new Date(opts.slotIso)
  const end = new Date(start.getTime() + BOOKING.slotMinutes * 60_000)
  const description = [
    status === 'CONFIRMED'
      ? `Confirmed ${BOOKING.slotMinutes}-minute discovery call with ${profile.shortName}.`
      : `Free ${BOOKING.slotMinutes}-minute discovery call proposed via ${profile.siteUrl.replace(/^https?:\/\//, '')}.`,
    `Agenda: ${opts.agenda}`,
    `Reference: ${opts.refId}`,
    ...(opts.descriptionExtra ?? []),
    status === 'CONFIRMED'
      ? `Start time is in Asia/Dhaka (GMT+6) — your calendar shows it in your local time.`
      : `Proposed time is in Asia/Dhaka (GMT+6) — confirmed by ${profile.shortName} after review.`,
  ].join('\n')

  return [
    'BEGIN:VEVENT',
    `UID:${opts.refId}@discovery-call`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(`${status === 'CANCELLED' ? '[Cancelled] ' : status === 'CONFIRMED' ? '[Confirmed] ' : ''}Discovery call — ${opts.name} × ${profile.shortName}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `STATUS:${status}`,
    `ORGANIZER;CN=${icsEscape(profile.shortName)}:mailto:${profile.email}`,
    'END:VEVENT',
  ].join('\r\n')
}

/**
 * Visitor-facing single-event .ics download (complete VCALENDAR document).
 * status: 'TENTATIVE' (default, right after proposing) or 'CONFIRMED'
 * (offered from the manage panel once the owner has accepted).
 */
export function buildICS(opts: {
  slotIso: string
  name: string
  agenda: string
  refId: string
  status?: 'TENTATIVE' | 'CONFIRMED'
}): string {
  return wrapVCalendar([buildVEvent(opts)])
}
