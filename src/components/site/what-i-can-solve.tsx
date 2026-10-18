'use client'

import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, Check, Compass, Info, RotateCcw, Sparkles, X } from 'lucide-react'

import { solutions, transformationFlow, beforeAfter } from '@/config/profile'
import { dispatchPrefill, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'
import SectionHeading from '@/components/site/section-heading'
import { cn } from '@/lib/utils'

/* ------------------------- service finder mini-quiz ------------------------ */

/** Outcome options → the service id used by the prefill-service contract. */
const QUIZ_OUTCOMES: { key: string; label: string; serviceId: string; serviceLabel: string }[] = [
  { key: 'dashboards', label: 'Dashboards & reports my team can act on', serviceId: 'data-analytics-bi', serviceLabel: 'Data Analytics & BI' },
  { key: 'forecast', label: 'Predict the future — sales, demand or trends', serviceId: 'forecasting', serviceLabel: 'Forecasting' },
  { key: 'behavior', label: 'Predict behavior — churn, risk or conversion', serviceId: 'ml-predictive', serviceLabel: 'Machine Learning & Predictive Models' },
  { key: 'assistant', label: 'An AI assistant that answers from my documents', serviceId: 'ai-llm-rag', serviceLabel: 'AI / LLM & RAG Assistant' },
  { key: 'automate', label: 'Automate a repetitive, manual process', serviceId: 'ai-automation', serviceLabel: 'AI Automation' },
  { key: 'understand', label: 'Make sense of messy data I already have', serviceId: 'data-analytics-bi', serviceLabel: 'Data Analytics & BI' },
  { key: 'collect', label: 'Collect data from websites or many sources', serviceId: 'web-research', serviceLabel: 'Web Research & Data Extraction' },
]

const QUIZ_TIMELINES: { key: string; label: string; engagement: string }[] = [
  { key: 'asap', label: 'As soon as possible', engagement: 'A fixed-scope quick win is likely the best fit — one clear deliverable, one agreed price.' },
  { key: 'weeks', label: 'Within 1–4 weeks', engagement: 'A standard fixed-scope project fits — scoping call, written quote, then delivery.' },
  { key: 'ongoing', label: 'Ongoing / recurring need', engagement: 'A monthly retainer may fit best — reserved hours, priority response, continuous improvement.' },
]

function ServiceFinder() {
  const [outcome, setOutcome] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const chosenOutcome = QUIZ_OUTCOMES.find((o) => o.key === outcome) ?? null
  const chosenTimeline = QUIZ_TIMELINES.find((t) => t.key === timeline) ?? null
  const readyToReveal = outcome && timeline

  const reset = () => {
    setOutcome(null)
    setTimeline(null)
    setShowResult(false)
  }

  const startRecommended = () => {
    if (!chosenOutcome) return
    track('start_project', `quiz-${chosenOutcome.serviceId}`)
    dispatchPrefill('service', chosenOutcome.serviceId)
    scrollToId('start-project')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-950/60 via-zinc-900/80 to-zinc-900/60 p-5 md:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
            <Compass className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-white">Not sure where to start?</h3>
            <p className="text-xs text-white/50">Answer two quick questions — get a recommended starting point.</p>
          </div>
        </div>
        {(outcome || timeline) && !showResult ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-medium text-white/60 transition-colors hover:border-teal-400/40 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Start over
          </button>
        ) : null}
      </div>

      {!showResult ? (
        <div className="relative mt-6 grid gap-5 md:grid-cols-2">
          {/* Step 1 — outcome */}
          <fieldset>
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold">1</span>
              What outcome do you need?
            </legend>
            <div className="mt-3 space-y-2">
              {QUIZ_OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={outcome === o.key}
                  onClick={() => {
                    setOutcome(o.key)
                    track('service_finder', `outcome:${o.key}`)
                  }}
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                    outcome === o.key
                      ? 'border-teal-400/60 bg-teal-500/15 text-white shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-teal-500/30 hover:text-white'
                  )}
                >
                  <span>{o.label}</span>
                  {outcome === o.key ? <Check className="size-4 shrink-0 text-teal-400" aria-hidden /> : null}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Step 2 — timeline */}
          <fieldset>
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold">2</span>
              How soon do you need results?
            </legend>
            <div className="mt-3 space-y-2">
              {QUIZ_TIMELINES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={timeline === t.key}
                  onClick={() => {
                    setTimeline(t.key)
                    track('service_finder', `timeline:${t.key}`)
                  }}
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                    timeline === t.key
                      ? 'border-teal-400/60 bg-teal-500/15 text-white shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-teal-500/30 hover:text-white'
                  )}
                >
                  <span>{t.label}</span>
                  {timeline === t.key ? <Check className="size-4 shrink-0 text-teal-400" aria-hidden /> : null}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!readyToReveal}
              onClick={() => {
                setShowResult(true)
                track('service_finder', `result:${chosenOutcome?.serviceId ?? 'unknown'}`)
              }}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Sparkles className="size-4" aria-hidden />
              Get my recommendation
            </button>
          </fieldset>
        </div>
      ) : chosenOutcome && chosenTimeline ? (
        /* ---------------------------- result panel ---------------------------- */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mt-6 rounded-2xl border border-teal-400/30 bg-white/5 p-4 md:p-5"
          aria-live="polite"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
            Recommended starting point
          </p>
          <p className="mt-2 text-xl font-bold text-white">{chosenOutcome.serviceLabel}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{chosenTimeline.engagement}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={startRecommended}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            >
              Start with this
              <ArrowRight className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!chosenOutcome) return
                track('view_service', `quiz-${chosenOutcome.serviceId}`)
                window.dispatchEvent(
                  new CustomEvent('open-service', { detail: chosenOutcome.serviceId })
                )
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 transition-colors hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            >
              <Info className="size-4" aria-hidden />
              View service details
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/60 transition-colors hover:border-teal-400/40 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Try different answers
            </button>
            <p className="text-xs text-white/40 sm:ml-auto">
              Indicative only — the written quote follows a short scoping call.
            </p>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  )
}

export default function WhatICanSolve() {
  /**
   * CONTRACT: card click dispatches `prefill-service` CustomEvent
   * (detail = serviceRef) — the StartProject form listens to it.
   */
  const startFromSolution = (serviceRef: string) => {
    track('start_project', `solve-${serviceRef}`)
    dispatchPrefill('service', serviceRef)
    scrollToId('start-project')
  }

  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="relative overflow-hidden bg-zinc-950 py-14 text-white md:py-20"
    >
      {/* subtle teal radial glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            'radial-gradient(55% 60% at 50% 0%, rgba(20, 184, 166, 0.14) 0%, rgba(20, 184, 166, 0) 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[380px]"
        style={{
          background:
            'radial-gradient(45% 55% at 85% 100%, rgba(20, 184, 166, 0.08) 0%, rgba(20, 184, 166, 0) 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div id="solutions-heading">
          <SectionHeading
            dark
            eyebrow="What I Can Solve"
            title="Tell Me Your Problem — I'll Map the Data Solution"
          />
        </div>

        {/* Service finder mini-quiz */}
        <div className="mt-8">
          <ServiceFinder />
        </div>

        {/* Problem → Solution cards */}
        <div className="mt-8 md:mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((item, i) => (
            <motion.button
              key={`${item.serviceRef}-${i}`}
              type="button"
              onClick={() => startFromSolution(item.serviceRef)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-teal-500/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            >
              <span
                aria-hidden
                className="font-serif text-4xl leading-none text-teal-500/40 select-none"
              >
                &ldquo;
              </span>
              <p className="mt-1 text-lg font-medium text-white">{item.problem}</p>
              <ArrowDown
                className="my-3 size-4 shrink-0 text-teal-400 transition-transform group-hover:translate-y-0.5"
                aria-hidden
              />
              <p className="text-xs font-medium uppercase tracking-wider text-teal-400">
                Solution &rarr;
              </p>
              <p className="mt-1 font-semibold text-white">{item.solution}</p>
              <span className="mt-3 block text-sm text-teal-300">
                Start with this &rarr;
              </span>
            </motion.button>
          ))}
        </div>

        {/* From raw data to real-world solutions */}
        <div className="mt-10 md:mt-12">
          <p className="text-sm font-medium uppercase tracking-widest text-white/50">
            From raw data to real-world solutions
          </p>

          {/* Before / After comparison */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5"
            >
              <h3 className="font-semibold text-white/70">{beforeAfter.before.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {beforeAfter.before.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/60">
                    <X className="mt-0.5 size-4 shrink-0 text-red-400/80" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-5"
            >
              <h3 className="font-semibold text-white">{beforeAfter.after.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {beforeAfter.after.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/80">
                    <Check className="mt-0.5 size-4 shrink-0 text-teal-400" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Transformation flow — vertical on mobile, horizontal on desktop */}
          <div className="mt-6 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            {transformationFlow.map((t, i) => (
              <Fragment key={t.step}>
                {i > 0 && (
                  <>
                    <ArrowRight
                      className="hidden size-4 shrink-0 self-center text-teal-400 lg:block"
                      aria-hidden
                    />
                    <ArrowDown
                      className="size-4 shrink-0 self-center text-teal-400 lg:hidden"
                      aria-hidden
                    />
                  </>
                )}
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-teal-500/30">
                  <p className="text-sm font-medium text-white">{t.step}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/50">{t.note}</p>
                </div>
              </Fragment>
            ))}
          </div>

          <p className="mt-6 text-xs text-white/40">
            Demos and examples use synthetic or public datasets — client work is added as
            verified projects complete.
          </p>
        </div>
      </div>
    </section>
  )
}
