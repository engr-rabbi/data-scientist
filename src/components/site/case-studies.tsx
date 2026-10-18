'use client'

import { withBase } from '@/lib/base-path'
import { tx } from '@/lib/ui-text'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Info, Lightbulb, Scale } from 'lucide-react'

import { caseStudies } from '@/config/profile'
import { dispatchPrefill, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'

import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/site/section-heading'
import { StoryFlow } from '@/components/site/story-flow'

/* ------------------------------ service mapping ---------------------------- */
/** Maps a case study to the matching service id used by #start-project prefill. */
const CASE_SERVICE_HINT: Record<string, string> = {
  'Machine Learning': 'ml-predictive',
  'Time Series': 'forecasting',
  Forecasting: 'forecasting',
  Analytics: 'data-analytics-bi',
}

function serviceHintFor(category: string): string {
  return CASE_SERVICE_HINT[category] ?? 'data-analytics-bi'
}

/* ------------------------------ visual helper ------------------------------ */
/**
 * Case-study entries carry an optional illustrative visual in the config data.
 * Read defensively so the component compiles regardless of when the config
 * interface gains the field (config file is owned upstream).
 */
function visualOf(cs: (typeof caseStudies)[number]): string | undefined {
  return (cs as (typeof caseStudies)[number] & { visual?: string }).visual
}

/** Small illustrative visual pinned to the bottom of the dark rail (optional). */
function CaseStudyRailVisual({ cs }: { cs: (typeof caseStudies)[number] }) {
  const visual = visualOf(cs)
  if (!visual) return null
  return (
    <Image
      src={withBase(visual)}
      alt={`${cs.title} — illustrative case study visual`}
      width={1344}
      height={768}
      sizes="(min-width: 1024px) 33vw, 100vw"
      className="relative z-10 mt-5 h-auto w-full rounded-lg border border-white/10"
    />
  )
}

/* --------------------------------- helpers --------------------------------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-xs font-semibold tracking-wider text-teal-700 uppercase">{children}</h4>
  )
}

/* --------------------------------- section --------------------------------- */

export default function CaseStudies() {
  const handleStartProject = (caseStudyId: string, category: string) => {
    dispatchPrefill('service', serviceHintFor(category))
    track('start_project', caseStudyId)
    scrollToId('start-project')
  }

  return (
    <section id="case-studies" className="bg-zinc-50 py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Case Studies"
          title="Deep Dives"
          description="The full professional format: Challenge → Data → Quality → Approach → Technology → Results → Business Meaning → Limitations → Next Step."
          moreHref="/case-studies"
          moreLabel="Case Studies page"
        />

        {/* Visual storytelling flow — the problem → solution path every study follows */}
        <div className="mt-8 mb-8">
          <StoryFlow />
        </div>

        <div className="space-y-10">
          {caseStudies.map((cs, i) => (
            <motion.article
              key={cs.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-12"
            >
              {/* Left rail */}
              <div className="relative flex flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-teal-950/70 p-8 text-white lg:col-span-4">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -bottom-6 text-[5.5rem] leading-none font-bold text-white/5 select-none"
                >
                  {`CS-${String(i + 1).padStart(2, '0')}`}
                </span>

                <span className="relative z-10 w-fit rounded-full border border-teal-400/20 bg-teal-400/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-teal-300 uppercase">
                  {cs.category}
                </span>
                <h3 className="relative z-10 mt-4 text-2xl font-bold">{cs.title}</h3>
                <p className="relative z-10 mt-3 text-sm leading-relaxed text-white/70">{cs.summary}</p>

                {/* Dedicated, individually indexable case-study page */}
                <div className="relative z-10 mt-6">
                  <Link
                    href={`/case-studies/${cs.slug}`}
                    onClick={() => track('view_project', `${cs.id}:case-study`)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-teal-300 transition-colors hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
                  >
                    View Case Study
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-8">
                  {cs.technology.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <CaseStudyRailVisual cs={cs} />
              </div>

              {/* Right content */}
              <div className="p-8 lg:col-span-8">
                <div className="grid gap-7">
                  {/* Challenge */}
                  <div>
                    <SectionLabel>Challenge</SectionLabel>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{cs.challenge}</p>
                  </div>

                  {/* Data + quality */}
                  <div>
                    <SectionLabel>Data</SectionLabel>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{cs.data}</p>
                    <p className="mt-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Data Quality
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {cs.dataQuality.map((q) => (
                        <li key={q} className="flex items-start gap-2 text-sm text-zinc-600">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Approach — numbered with connector */}
                  <div>
                    <SectionLabel>Approach</SectionLabel>
                    <ol className="mt-3 space-y-3">
                      {cs.approach.map((step, si) => (
                        <li key={step} className="relative flex gap-3">
                          <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                            {si + 1}
                          </span>
                          {si < cs.approach.length - 1 && (
                            <span
                              aria-hidden="true"
                              className="absolute top-8 -bottom-3 left-3.5 w-px bg-teal-200"
                            />
                          )}
                          <span className="pt-1 text-sm leading-relaxed text-zinc-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Results — stat cards */}
                  <div>
                    <SectionLabel>Results</SectionLabel>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {cs.results.map((r) => (
                        <div key={r.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-2xl font-bold text-teal-700 tabular-nums">{r.value}</p>
                          <p className="mt-1 text-sm leading-snug text-zinc-700">{r.label}</p>
                          <p className="mt-1.5 text-[11px] text-muted-foreground italic">{r.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business meaning */}
                  <div className="flex gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-teal-600" aria-hidden="true" />
                    <div>
                      <SectionLabel>Business Meaning</SectionLabel>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{cs.businessMeaning}</p>
                    </div>
                  </div>

                  {/* Limitations */}
                  <div className="flex gap-3">
                    <Info className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden="true" />
                    <div>
                      <SectionLabel>Limitations</SectionLabel>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cs.limitations}</p>
                    </div>
                  </div>

                  {/* Next step */}
                  <div className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <p className="text-sm leading-relaxed font-medium text-zinc-800">
                      <span className="font-semibold">Next step: </span>
                      {cs.nextStep}
                    </p>
                  </div>
                </div>

                {/* CTA row */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-6">
                  <p className="font-medium text-zinc-900">Need a similar solution?</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        track('view_pricing', 'case-study')
                        scrollToId('pricing')
                      }}
                      className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Scale className="size-4" aria-hidden="true" />
                      Compare engagement options
                    </Button>
                    <Button
                      onClick={() => handleStartProject(cs.id, cs.category)}
                      className="bg-teal-600 text-white hover:bg-teal-700"
                    >
                      {tx('Start a Project')}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Honesty note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Results shown are method demonstrations on public/synthetic datasets, not client claims.
        </p>
      </div>
    </section>
  )
}
