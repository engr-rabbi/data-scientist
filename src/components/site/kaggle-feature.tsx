'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Check } from 'lucide-react'

import { social } from '@/config/profile'
import { track } from '@/lib/analytics'
import { Button } from '@/components/ui/button'

/** Kaggle "k" brand mark (inline SVG) — copied from platforms.tsx. */
function KaggleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.283.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.073.335z" />
    </svg>
  )
}

/**
 * Kaggle page feature band: an honest, activity-specific description of the
 * public Kaggle work — four competitions, open notebooks and a dataset EDA,
 * each mirrored as a public repository. No invented ranks, medals or tiers.
 * Handle is derived from the verified `social.kaggle` URL.
 */

const KAGGLE_POINTS = [
  'Four Kaggle competitions — from Titanic to the 2025 Playground — each mirrored as a public repository.',
  'Open notebooks: scikit-learn pipelines, imputation strategies, power transformations.',
  'Dataset EDA published for the community — mental health & lifestyle analysis.',
]

// Verified handle from the CV: https://www.kaggle.com/engineerrabbi
const kaggleHandle = social.kaggle.replace(/\/+$/, '').split('/').pop() ?? ''

export default function KaggleFeature() {
  return (
    <section
      id="kaggle-feature"
      aria-labelledby="kaggle-feature-heading"
      className="relative overflow-hidden bg-zinc-950 py-14 text-white md:py-16"
    >
      {/* Subtle teal glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-6 md:gap-8 lg:grid-cols-2">
          {/* Left: copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="min-w-0"
          >
            <p className="flex items-center gap-2.5 text-xs font-semibold tracking-widest text-teal-400 uppercase">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-teal-400/60" />
              Kaggle
            </p>
            <h2
              id="kaggle-feature-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
            >
              Experiments in Public
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/60">
              My Kaggle activity is participation you can check: competitions entered, notebooks
              published and a dataset EDA shared with the community — every entry mirrored as a
              public GitHub repository. Each one is written to be understood and re-run: the same
              honest, reproducible approach I bring to client work. No ranks or medals are claimed —
              participation and code only.
            </p>

            <ul className="mt-6 space-y-3">
              {KAGGLE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-white/75">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-11 bg-teal-600 text-white shadow-md shadow-teal-600/25 hover:bg-teal-500"
                asChild
              >
                <a
                  href={social.kaggle}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_kaggle', 'kaggle-page')}
                >
                  View Kaggle Profile
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-11 border border-white/25 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href={social.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Right: dark glass profile card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="min-w-0"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                  <KaggleIcon className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">Kaggle profile</p>
                  <p className="truncate text-sm text-white/50">@{kaggleHandle}</p>
                </div>
                <a
                  href={social.kaggle}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_kaggle', 'kaggle-page-card')}
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-teal-300 transition-colors hover:border-teal-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
                >
                  Visit
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>

              {/* Decorative skeleton rows — placeholders, not real stats */}
              <div aria-hidden="true" className="mt-6 space-y-3">
                <div className="h-3 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-2/3 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
              <p className="mt-4 text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                Notebooks · Datasets · Experiments
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
