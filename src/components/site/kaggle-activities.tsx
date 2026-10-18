'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ExternalLink, ShieldCheck } from 'lucide-react'

import SectionHeading from '@/components/site/section-heading'
import { kaggleActivities, social } from '@/config/profile'
import { track } from '@/lib/analytics'
import { normalizeKind, type KaggleKind } from '@/lib/kaggle'

/**
 * Verified Kaggle & open data science activities — rendered on BOTH /about
 * (variant="compact") and /kaggle (variant="full"). Every entry comes from
 * the owner's own public GitHub repositories. Participation and code only:
 * NO ranks, medals, tiers or competition results are claimed anywhere.
 */

const KIND_ORDER: Record<KaggleKind, number> = {
  Competition: 0,
  Notebook: 1,
  Dataset: 2,
}

/** Competitions first, then notebooks, then dataset analyses (stable). */
const orderedActivities = [...kaggleActivities].sort(
  (a, b) => KIND_ORDER[normalizeKind(a.kind)] - KIND_ORDER[normalizeKind(b.kind)]
)

const KIND_BADGE: Record<KaggleKind, string> = {
  // Competition = filled teal
  Competition: 'bg-teal-600 text-white',
  // Notebook = teal outline
  Notebook: 'border border-teal-300 bg-teal-50 text-teal-700',
  // Dataset = zinc outline
  Dataset: 'border border-zinc-300 bg-zinc-100 text-zinc-600',
}

interface KaggleActivitiesProps {
  variant?: 'full' | 'compact'
}

export default function KaggleActivities({ variant = 'compact' }: KaggleActivitiesProps) {
  const isFull = variant === 'full'

  return (
    <section
      aria-label="Kaggle and open data science work"
      className="bg-white py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Verified public work"
          title="Kaggle & Open Data Science Work"
          description="Verified via my public GitHub repositories — participation and code only; no ranks or medals claimed."
          moreHref={isFull ? undefined : '/kaggle'}
          moreLabel="All activities & profiles"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedActivities.map((activity, i) => (
            <motion.article
              key={activity.repoName}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: 'easeOut' }}
              className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              {/* Kind badge + year chip */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${KIND_BADGE[normalizeKind(activity.kind)]}`}
                >
                  {normalizeKind(activity.kind)}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                  {activity.year}
                </span>
              </div>

              <h3 className="mt-3 text-base leading-snug font-semibold text-zinc-900">
                {activity.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{activity.description}</p>

              {/* Skill chips */}
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Skills: ${activity.skills.join(', ')}`}>
                {activity.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                  >
                    {skill}
                  </li>
                ))}
              </ul>

              {/* Public repo mirror */}
              <a
                href={activity.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_github', activity.repoName)}
                className="mt-4 inline-flex min-w-0 items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-teal-700 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                aria-label={`${activity.repoName} — public repository on GitHub (opens in a new tab)`}
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{activity.repoName}</span>
              </a>
            </motion.article>
          ))}
        </div>

        {isFull ? (
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            <ShieldCheck className="size-4 shrink-0 text-teal-600" aria-hidden="true" />
            Full history lives on the{' '}
            <a
              href={social.kaggle}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_kaggle', 'kaggle-activities')}
              className="inline-flex items-center gap-0.5 font-medium text-teal-700 hover:text-teal-600"
            >
              Kaggle profile
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            and in the{' '}
            <a
              href={social.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_github', 'kaggle-activities-profile')}
              className="inline-flex items-center gap-0.5 font-medium text-teal-700 hover:text-teal-600"
            >
              public GitHub repositories
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            .
          </p>
        ) : (
          <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-zinc-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
            The same pipelines, imputation benchmarks and EDA methods show up in client work —
            practice in the open, applied on the job.
          </p>
        )}
      </div>
    </section>
  )
}
