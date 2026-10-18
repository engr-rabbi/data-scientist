'use client'

import { motion } from 'framer-motion'
import { Award, Flag, Github, Milestone, NotebookPen, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import SectionHeading from '@/components/site/section-heading'
import { careerJourney, credentials, kaggleActivities } from '@/config/profile'

/**
 * Achievement stats — every number is DERIVED from verified data in
 * src/config/profile.ts (public GitHub activity + the CV). Nothing padded,
 * nothing invented: no ranks, medals or results are claimed anywhere.
 */

const PUBLIC_REPOSITORIES = '33+' // verified via the public GitHub API (about.snapshot)

const competitionCount = kaggleActivities.filter((a) => a.kind === 'Competition').length

const STATS: { value: string; label: string; sub: string; icon: LucideIcon }[] = [
  {
    value: String(competitionCount),
    label: 'Kaggle competitions',
    sub: 'each mirrored as a public repository',
    icon: Flag,
  },
  {
    value: String(kaggleActivities.length),
    label: 'Public data science activities',
    sub: 'competitions, notebooks & dataset EDA',
    icon: NotebookPen,
  },
  {
    value: String(credentials.length),
    label: 'Certifications & trainings',
    sub: 'verified from the CV',
    icon: Award,
  },
  {
    value: PUBLIC_REPOSITORIES,
    label: 'Public repositories',
    sub: 'open code you can inspect',
    icon: Github,
  },
  {
    value: String(careerJourney.length),
    label: 'Learning-journey stages',
    sub: 'engineering → data → AI',
    icon: Milestone,
  },
]

/**
 * Industries — EXACTLY two, per professional positioning: Data Science as the
 * independent primary domain, Telecommunication as the supporting industry.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

export default function AchievementStats() {
  return (
    <section aria-label="Achievements and industries" className="bg-zinc-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Achievements in numbers"
          title="A track record you can verify"
          description="Every figure below is derived from public repositories or the verified CV — click through the Kaggle work and GitHub code to check it yourself."
        />

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06 }}
              className={`min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${
                i === STATS.length - 1 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <stat.icon className="size-4.5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-700">{stat.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Industries strip — exactly two domains */}
        <h3 className="sr-only">Industries</h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="relative min-w-0 rounded-2xl border-2 border-teal-500/70 bg-white p-6 shadow-sm lg:col-span-3"
          >
            <span className="absolute top-5 right-5 rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white">
              Primary domain
            </span>
            <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase">Industry</p>
            <p className="mt-1.5 pr-24 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Data Science
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-600">
              An independent professional domain, not a side skill: analytics, machine learning,
              deep learning and applied AI delivered end to end — with public code and open
              notebooks to back every claim.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.08 }}
            className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              Industry background
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Telecommunication
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Telecom engineering operations and technical reporting — where data-driven monitoring
              of real infrastructure became a daily habit.
            </p>
          </motion.div>
        </div>

        {/* Honest footnote */}
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
          Numbers verified from public sources (GitHub) and the CV — participation and code only; no
          ranks, medals or competition results are claimed.
        </p>
      </div>
    </section>
  )
}
