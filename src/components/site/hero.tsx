'use client'

import { withBase } from '@/lib/base-path'
import { tx } from '@/lib/ui-text'
import Image from 'next/image'
import { MotionConfig, motion } from 'framer-motion'
import {
  Briefcase,
  Linkedin,
  MessageCircle,
  Phone,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { profile } from '@/config/profile'
import { openStartProject, platformLinks, scrollToId, telLink, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'

/* ------------------- Deterministic data-network background ------------------- */
/* Seeded RNG keeps SSR and client markup identical (no hydration mismatch). */

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface NetNode {
  x: number
  y: number
  r: number
  bright: boolean
}

interface NetEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

const rand = mulberry32(20240715)
const NODES: NetNode[] = Array.from({ length: 34 }, () => ({
  x: Math.round(30 + rand() * 640),
  y: Math.round(30 + rand() * 430),
  r: Math.round((1.4 + rand() * 1.8) * 10) / 10,
  bright: rand() > 0.6,
}))

const EDGES: NetEdge[] = []
for (let i = 0; i < NODES.length; i++) {
  const near = NODES.map((n, j) => ({ j, d: (n.x - NODES[i].x) ** 2 + (n.y - NODES[i].y) ** 2 }))
    .filter((e) => e.j > i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 1)
  for (const { j, d } of near) {
    EDGES.push({
      x1: NODES[i].x,
      y1: NODES[i].y,
      x2: NODES[j].x,
      y2: NODES[j].y,
      opacity: Math.max(0.05, Math.round((0.16 - d / 60000) * 100) / 100),
    })
  }
}

/* ------------------------------ Quick link row ------------------------------- */

interface QuickLink {
  label: string
  href: string
  external: boolean
  icon: LucideIcon
  event: 'click_whatsapp' | 'click_phone' | 'click_upwork' | 'click_linkedin'
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'WhatsApp Me', href: waLink(), external: true, icon: MessageCircle, event: 'click_whatsapp' },
  { label: 'Call Me', href: telLink(), external: false, icon: Phone, event: 'click_phone' },
  { label: 'Hire Me on Upwork', href: platformLinks.upwork, external: true, icon: Briefcase, event: 'click_upwork' },
  { label: 'View LinkedIn', href: platformLinks.linkedin, external: true, icon: Linkedin, event: 'click_linkedin' },
]

/* ------------------------------- Entrance motion ------------------------------ */
/* One quiet fade-up on load. No looping or ambient animation (MotionConfig below
   also honours the visitor's reduced-motion setting). */

const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut' as const },
}

const TRUST_LINE = profile.secondaryPositioning
  .split('•')
  .map((s) => s.trim())
  .filter(Boolean)
  .join(' · ')

/* Credential chips over the portrait (verified CV credentials). */
const PHOTO_CHIPS = [
  { label: 'IBM Data Science', pos: '-left-5 top-10' },
  { label: 'Machine Learning & AI', pos: '-right-4 bottom-28' },
]

export default function Hero() {
  const startProject = () => {
    track('start_project', 'hero')
    openStartProject()
  }

  const viewWork = () => scrollToId('#projects')

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="home"
        className="relative overflow-hidden bg-[#f6f9f9] text-zinc-900"
      >
        {/* Soft light-blue / teal washes — depth without darkness */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f9f9] to-teal-50/70" />
          <div className="absolute -top-24 right-[-8%] h-[28rem] w-[28rem] rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-[-6%] h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        </div>

        {/* Faint measurement grid, fading out behind the copy */}
        <div
          aria-hidden="true"
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_65%_at_70%_40%,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,118,110,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,118,110,0.07) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* Static data-network lattice — the one decorative motif, kept to the right so it never sits under the text */}
        <svg
          aria-hidden="true"
          viewBox="0 0 700 480"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60 [mask-image:linear-gradient(to_right,transparent_5%,black_55%)]"
        >
          {EDGES.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="#0f766e"
              strokeWidth="1"
              strokeOpacity={Math.min(0.28, e.opacity * 1.6)}
            />
          ))}
          {NODES.map((n, i) => (
            <circle
              key={`n-${i}`}
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="#0d9488"
              fillOpacity={n.bright ? 0.55 : 0.28}
            />
          ))}
        </svg>

        {/* Content */}
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pt-24 pb-14 sm:px-6 md:pt-28 md:pb-16 lg:grid-cols-12">
          {/* Left column */}
          <motion.div {...rise} className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
              Available for new projects
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl xl:text-6xl">
              {profile.name}
            </h1>

            <p className="mt-3 text-sm font-semibold text-teal-700 md:text-base">{profile.title}</p>

            <p className="mt-4 max-w-xl text-xl font-medium text-zinc-800 md:text-2xl">
              {profile.tagline}
            </p>

            <p className="mt-4 max-w-xl leading-relaxed text-zinc-600">{profile.heroParagraph}</p>

            {/* CTA row */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={startProject}
                className="h-11 rounded-lg bg-teal-700 px-6 text-sm font-semibold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800"
              >
                {tx('Start a Project')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={viewWork}
                className="h-11 rounded-lg border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800"
              >
                View My Work
              </Button>
            </div>

            {/* Quick-link row */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {QUICK_LINKS.map(({ label, href, external, icon: Icon, event }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={() => track(event, 'hero')}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded text-sm text-zinc-600 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/50"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </div>

            {/* Trust row */}
            <p className="mt-6 text-sm text-zinc-600">{TRUST_LINE}</p>
          </motion.div>

          {/* Right column — real profile photo (lg only) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="hidden lg:col-span-5 lg:block"
          >
            <div className="relative mx-auto max-w-sm xl:max-w-md">
              {/* Portrait — aspect ratio preserved (759×876), identity untouched */}
              <figure className="relative overflow-hidden rounded-2xl border border-white bg-white shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/5">
                <Image
                  src={withBase(profile.photo)}
                  alt="Portrait of Shah Muhammad Fazle Rabbi, data scientist and machine learning engineer based in Dhaka, Bangladesh"
                  width={759}
                  height={876}
                  priority
                  sizes="(min-width: 1280px) 448px, (min-width: 1024px) 384px, 0px"
                  className="h-auto w-full object-cover"
                />
                {/* Scrim keeps the white caption legible over the photograph */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-900/75 via-zinc-900/35 to-transparent"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{profile.name}</span>
                    <span className="mt-0.5 block text-xs text-teal-100">{profile.location}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Open to work
                  </span>
                </figcaption>
              </figure>

              {/* Credential chips */}
              {PHOTO_CHIPS.map((chip) => (
                <span
                  key={chip.label}
                  className={`absolute ${chip.pos} flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-md`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden="true" />
                  {chip.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  )
}
