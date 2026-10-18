import { withBase } from '@/lib/base-path'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, Info, Lightbulb } from 'lucide-react'

import { caseStudies } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'
import PageShell from '@/components/site/page-shell'
import { CaseStudyCta, StoryFlow } from '@/components/site/story-flow'

/* --------------------------------- routing --------------------------------- */

interface CaseStudyParams {
  params: Promise<{ slug: string }>
}

/** Pre-render every case study at build time; unknown slugs → 404. */
export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }))
}

export const dynamicParams = false

/* ------------------------- per-study unique metadata ----------------------- */

const CASE_STUDY_META: Record<string, { description: string }> = {
  'cs-churn': {
    description:
      'Customer churn prediction case study using machine learning: EDA, feature engineering, XGBoost vs logistic regression, explainability and a ranked risk list built on the public IBM Telco dataset.',
  },
  'cs-forecasting': {
    description:
      'Sales forecasting case study with Python: seasonality decomposition, back-tested models and prediction intervals for planning-ready demand forecasts.',
  },
}

export async function generateMetadata({ params }: CaseStudyParams): Promise<Metadata> {
  const { slug } = await params
  const cs = caseStudies.find((c) => c.slug === slug)
  if (!cs) return {}

  return buildMetadata({
    title: `${cs.title} — Case Study | Data Science & Machine Learning`,
    description: CASE_STUDY_META[cs.id]?.description ?? cs.summary,
    path: `/case-studies/${cs.slug}`,
    image: visualOf(cs) ?? '/og-image.png',
  })
}

/* --------------------------------- helpers --------------------------------- */

/**
 * Case-study entries carry an optional illustrative visual in the config
 * data. Read defensively so the page compiles regardless of when the config
 * interface gains the field (config file is owned upstream).
 */
function visualOf(cs: (typeof caseStudies)[number]): string | undefined {
  return (cs as (typeof caseStudies)[number] & { visual?: string }).visual
}

/** Case-study id → service id used by the #start-project prefill bridge. */
const CASE_SERVICE_HINT: Record<string, string> = {
  'cs-churn': 'ml-predictive',
  'cs-forecasting': 'forecasting',
}

/** Case-study id → matching portfolio project anchor on /projects. */
const CASE_PROJECT_ANCHOR: Record<string, string> = {
  'cs-churn': 'churn-prediction',
  'cs-forecasting': 'sales-forecasting',
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-zinc-900 md:text-2xl"
    >
      <span aria-hidden="true" className="h-5 w-1 shrink-0 rounded-full bg-teal-600" />
      {children}
    </h2>
  )
}

/* ---------------------------------- page ----------------------------------- */

export default async function CaseStudyPage({ params }: CaseStudyParams) {
  const { slug } = await params
  const cs = caseStudies.find((c) => c.slug === slug)
  if (!cs) notFound()

  const other = caseStudies.find((c) => c.id !== cs.id) ?? null
  const serviceHint = CASE_SERVICE_HINT[cs.id] ?? 'data-analytics-bi'
  const projectAnchor = CASE_PROJECT_ANCHOR[cs.id]
  const visual = visualOf(cs)

  return (
    <PageShell
      path={`/case-studies/${cs.slug}`}
      label={cs.title}
      h1={`${cs.title} — ${cs.category} Case Study`}
      lede={cs.summary}
      related={['/projects', '/services', '/start-a-project', '/contact']}
    >
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        {/* Illustrative visual */}
        {visual ? (
          <figure className="min-w-0">
            <Image
              src={withBase(visual)}
              alt={`${cs.title} — illustrative case study visual (machine learning / forecasting)`}
              width={1344}
              height={768}
              sizes="(min-width: 896px) 896px, 100vw"
              className="h-auto w-full rounded-2xl border border-zinc-200"
              priority
            />
            <figcaption className="mt-2.5 text-center text-xs text-muted-foreground italic">
              Illustrative technical visual — demonstration build on public/synthetic data.
            </figcaption>
          </figure>
        ) : null}

        {/* Visual storytelling flow — the path this page walks through */}
        <section aria-label="Problem to solution flow" className="mt-12">
          <StoryFlow />
        </section>

        {/* Challenge */}
        <section aria-labelledby="cs-challenge" className="mt-12">
          <SectionHeading id="cs-challenge">The Challenge</SectionHeading>
          <p className="mt-3 leading-relaxed text-zinc-700">{cs.challenge}</p>
        </section>

        {/* Data & data quality */}
        <section aria-labelledby="cs-data" className="mt-10">
          <SectionHeading id="cs-data">Data &amp; Data Quality</SectionHeading>
          <p className="mt-3 leading-relaxed text-zinc-700">{cs.data}</p>
          <p className="mt-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Data quality notes
          </p>
          <ul className="mt-2.5 space-y-2">
            {cs.dataQuality.map((q) => (
              <li key={q} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-600">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Approach */}
        <section aria-labelledby="cs-approach" className="mt-10">
          <SectionHeading id="cs-approach">The Approach</SectionHeading>
          <ol className="mt-4 space-y-3">
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
                <span className="min-w-0 pt-1 text-sm leading-relaxed text-zinc-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Technology */}
        <section aria-labelledby="cs-technology" className="mt-10">
          <SectionHeading id="cs-technology">Technology Stack</SectionHeading>
          <div className="mt-3 flex flex-wrap gap-2">
            {cs.technology.map((t) => (
              <span
                key={t}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* Results */}
        <section aria-labelledby="cs-results" className="mt-10">
          <SectionHeading id="cs-results">Results</SectionHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {cs.results.map((r) => (
              <div key={r.label} className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold break-words text-teal-700 tabular-nums">{r.value}</p>
                <p className="mt-1.5 text-sm leading-snug text-zinc-700">{r.label}</p>
                <p className="mt-2 text-[11px] text-muted-foreground italic">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Business meaning */}
        <section aria-labelledby="cs-meaning" className="mt-10">
          <SectionHeading id="cs-meaning">Business Meaning</SectionHeading>
          <div className="mt-3 flex gap-3 rounded-xl border border-teal-100 bg-teal-50 p-5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-teal-600" aria-hidden="true" />
            <p className="min-w-0 text-sm leading-relaxed text-zinc-700">{cs.businessMeaning}</p>
          </div>
        </section>

        {/* Honest limitations */}
        <section aria-labelledby="cs-limitations" className="mt-10">
          <SectionHeading id="cs-limitations">Honest Limitations</SectionHeading>
          <div className="mt-3 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="min-w-0 text-sm leading-relaxed text-amber-800">{cs.limitations}</p>
          </div>
        </section>

        {/* Recommended next step */}
        <section aria-labelledby="cs-next" className="mt-10">
          <SectionHeading id="cs-next">Recommended Next Step</SectionHeading>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed font-medium text-zinc-800">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="min-w-0">{cs.nextStep}</span>
          </p>
        </section>

        {/* Related work — internal links */}
        <section aria-labelledby="cs-related-work" className="mt-12 border-t border-zinc-100 pt-8">
          <SectionHeading id="cs-related-work">Related Work</SectionHeading>
          <ul className="mt-4 space-y-3">
            {other ? (
              <li>
                <Link
                  href={`/case-studies/${other.slug}`}
                  className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition-all hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-zinc-900 transition-colors group-hover:text-teal-700">
                      {other.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Next case study — {other.category}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ) : null}
            {projectAnchor ? (
              <li>
                <Link
                  href={`/projects#${projectAnchor}`}
                  className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition-all hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-zinc-900 transition-colors group-hover:text-teal-700">
                      The matching portfolio project
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Project card with stack &amp; key features on /projects
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/case-studies"
                className="group flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All case studies
              </Link>
            </li>
          </ul>
        </section>

        {/* Honesty footnote */}
        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Results shown are method demonstrations on public/synthetic datasets, not client claims.
          </span>
        </p>

        {/* CTA */}
        <section
          aria-labelledby="cs-cta"
          className="mt-8 rounded-2xl border border-zinc-200 bg-gradient-to-br from-teal-50 to-white p-6 md:p-8"
        >
          <h2 id="cs-cta" className="text-lg font-bold tracking-tight text-zinc-900 md:text-xl">
            Facing a similar problem?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Tell me about your data and the decision it should support — you get a scoped, honest
            answer, not a sales pitch.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CaseStudyCta serviceHint={serviceHint} source={cs.id} />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-teal-600" aria-hidden="true" />
                Scoped, honest reply
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-teal-600" aria-hidden="true" />
                Public-dataset demos until client work is publishable
              </li>
            </ul>
          </div>
        </section>
      </article>
    </PageShell>
  )
}
