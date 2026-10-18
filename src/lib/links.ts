import { withBase } from '@/lib/base-path'
import { profile, social } from '@/config/profile'

/**
 * Centralized outbound link builders.
 * All contact info comes from src/config/profile.ts — never hard-code elsewhere.
 */

const DEFAULT_WA_MESSAGE = `Hello ${profile.name}, I found your website and would like to discuss a project.`

/** Build a WhatsApp deep link, optionally inserting a service + description. */
export function waLink(service?: string, description?: string): string {
  let message = DEFAULT_WA_MESSAGE
  if (service && description) {
    message = `Hello ${profile.name}, I found your website and would like to discuss a project regarding ${service}. My project is about ${description}.`
  } else if (service) {
    message = `Hello ${profile.name}, I found your website and would like to discuss a project regarding ${service}.`
  }
  return `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(message)}`
}

export function telLink(): string {
  return `tel:${profile.phoneRaw}`
}

/** Telegram deep link (same number as WhatsApp, international format). */
export function telegramLink(): string {
  return social.telegram
}

export function mailLink(subject?: string): string {
  const s = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${profile.email}${s}`
}

/** External professional platform links (used by many CTAs). */
export const platformLinks = {
  linkedin: social.linkedin,
  kaggle: social.kaggle,
  upwork: social.upwork,
  freelancer: social.freelancer,
}

/**
 * Build a vCard 3.0 string from the profile config so visitors can save
 * contact details to their phone/address book ("Save contact" button).
 * Escapes per RFC 2426 (backslash, comma, semicolon, newline).
 */
export function buildVCard(): string {
  const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
  const nameParts = profile.name.split(' ')
  const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : profile.name
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.name)}`,
    `TITLE:${esc(profile.title)}`,
    'ORG:' + esc('Freelance · Data Science & AI'),
    `TEL;TYPE=CELL,VOICE:${profile.phoneRaw}`,
    `TEL;TYPE=WHATSAPP:${profile.whatsapp}`,
    `EMAIL;TYPE=INTERNET,WORK:${profile.email}`,
    `X-SOCIALPROFILE;TYPE=telegram:${social.telegram}`,
    `URL:${profile.siteUrl}`,
    `ADR;TYPE=WORK:;;${esc(profile.location)};;;;`,
    `NOTE:${esc(profile.tagline)}`,
    'END:VCARD',
  ].join('\r\n')
}

/**
 * Homepage section id → dedicated page path. Inner pages have no section
 * elements, so smooth-scroll calls from shared components (nav, footer, CTAs)
 * resolve to the matching dedicated page instead of a dead anchor.
 */
export const SECTION_TO_PAGE: Record<string, string> = {
  about: '/about',
  services: '/services',
  projects: '/projects',
  'case-studies': '/case-studies',
  skills: '/skills',
  experience: '/experience',
  certifications: '/certifications',
  platforms: '/kaggle',
  testimonials: '/testimonials',
  contact: '/contact',
  'start-project': '/start-a-project',
  'book-a-call': '/book-a-call',
}

/** Dedicated page that hosts the project inquiry form. */
export const START_PROJECT_PATH = '/start-a-project'

/** True when the current document already is the dedicated inquiry page. */
export function onStartProjectPage(): boolean {
  const here = window.location.pathname.replace(/\/+$/, '').replace(/\.html$/, '')
  return here === withBase(START_PROJECT_PATH)
}

/**
 * Every "Start a Project" / "Start This Project" CTA goes through here.
 * It opens the dedicated inquiry page instead of scrolling the visitor to the
 * form that is embedded at the bottom of the (very long) homepage.
 * Any prefill (service / budget / note) was already stashed in sessionStorage
 * by dispatchPrefill(), and the form drains it when the page loads.
 */
export function openStartProject() {
  if (typeof window === 'undefined') return
  if (onStartProjectPage()) {
    // Already there: bring the form into view, never reload.
    document.getElementById('start-project')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  window.location.assign(withBase(START_PROJECT_PATH))
}

/**
 * Route-aware scroll: on the homepage it smooth-scrolls to the section as
 * before; from any inner page it navigates to the dedicated page (falling
 * back to the homepage anchor for homepage-only sections like pricing/faq).
 * The inquiry form is the one exception — it is never scrolled to on the
 * homepage; it always opens on its own page (see openStartProject).
 */
export function scrollToId(id: string) {
  if (typeof window === 'undefined') return
  const clean = id.replace('#', '')
  if (clean === 'start-project') {
    openStartProject()
    return
  }
  const el = document.getElementById(clean)
  if (!el) {
    const target = SECTION_TO_PAGE[clean] ?? `/#${clean}`
    window.location.assign(withBase(target))
    return
  }
  const y = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top: y, behavior: 'smooth' })
}

/* ------------------------- Cross-page prefill bridge ----------------------- */
/*
 * The inquiry-form prefill contract (prefill-service / prefill-budget /
 * prefill-note CustomEvents) only works while both sections live on the same
 * page. With dedicated pages, the dispatch may happen on /services or
 * /projects and the form lives on /start-a-project — so every dispatch is
 * ALSO stashed in sessionStorage and drained by the form on mount.
 */

const PREFILL_KEY = 'smfr-prefill-v1'

export type PrefillType = 'service' | 'budget' | 'note'

/** Fire the same-page event AND stash the payload for a later navigation. */
export function dispatchPrefill(type: PrefillType, detail: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(`prefill-${type}`, { detail }))
  try {
    const raw = window.sessionStorage.getItem(PREFILL_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    data[type] = detail
    window.sessionStorage.setItem(PREFILL_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage unavailable — same-page prefill still works
  }
}

/** Read + clear stashed prefill payloads (used by the form on mount). */
export function drainPrefills(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(PREFILL_KEY)
    if (!raw) return {}
    window.sessionStorage.removeItem(PREFILL_KEY)
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}
