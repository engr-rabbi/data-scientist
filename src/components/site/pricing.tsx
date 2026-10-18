'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Calculator,
  Check,
  Clock,
  Info,
  LineChart,
  Package,
  Repeat,
  ScanEye,
  Search,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/site/section-heading'
import {
  estimateDisclaimer,
  estimateOptions,
  estimateRushNote,
  priceFactors,
  pricingModels,
  pricingNote,
  type EstimateOption,
  type PricingModel,
} from '@/config/profile'
import { dispatchPrefill, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const MODEL_ICONS: Record<PricingModel['icon'], LucideIcon> = {
  package: Package,
  clock: Clock,
  repeat: Repeat,
}

/** Chip icons for the instant-estimate work types (keyed by serviceId). */
const ESTIMATE_ICONS: Record<string, LucideIcon> = {
  'data-analytics-bi': BarChart3,
  'web-research': Search,
  'ml-predictive': BrainCircuit,
  'forecasting': LineChart,
  'ai-automation': Workflow,
  'ai-llm-rag': Bot,
  'deep-learning-cv': ScanEye,
}

/**
 * Instant estimate — interactive ballpark builder. Two picks (work type +
 * urgency) produce an honest range straight from estimateOptions and hand the
 * choice to the inquiry form via the prefill-service / prefill-budget /
 * prefill-note events. No fake precision: ranges only, fixed quote after a
 * scoping call.
 */
function InstantEstimate() {
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [fastTrack, setFastTrack] = useState(false)

  const option: EstimateOption | null = estimateOptions.find((o) => o.serviceId === serviceId) ?? null

  const useEstimate = () => {
    if (!option) return
    track('estimate_used', option.serviceId)
    const note = `Ballpark from your pricing page: ${option.label} (~${option.range}, ${option.turnaround})${
      fastTrack ? ' — fast-track start preferred.' : '.'
    }`
    dispatchPrefill('service', option.serviceId)
    dispatchPrefill('budget', option.range)
    dispatchPrefill('note', note)
    scrollToId('start-project')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
      className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/[0.09] via-white/[0.03] to-transparent p-5 md:p-6"
    >
      {/* decorative corner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300"
        >
          <Calculator className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">Get a ballpark in 10 seconds</h3>
          <p className="text-xs text-white/50">Two picks — no email, no form. The estimate carries into your brief.</p>
        </div>
      </div>

      {/* Step 1 — work type */}
      <fieldset className="mt-6 min-w-0">
        <legend className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
          1 — What do you need?
        </legend>
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {estimateOptions.map((o) => {
            const Icon = ESTIMATE_ICONS[o.serviceId] ?? BarChart3
            const active = o.serviceId === serviceId
            return (
              <button
                key={o.serviceId}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setServiceId(o.serviceId)
                  track('estimate_pick', o.serviceId)
                }}
                className={cn(
                  'group flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
                  active
                    ? 'border-teal-400/60 bg-teal-500/15 shadow-lg shadow-teal-900/30'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active ? 'bg-teal-400/25 text-teal-200' : 'bg-white/10 text-white/60 group-hover:text-white/80'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    'min-w-0 text-xs font-medium leading-tight',
                    active ? 'text-teal-100' : 'text-white/75'
                  )}
                >
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Step 2 — urgency */}
      <fieldset className="mt-5 min-w-0">
        <legend className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">2 — How soon?</legend>
        <div
          role="radiogroup"
          aria-label="Preferred timeline"
          className="mt-3 inline-flex flex-wrap gap-2"
        >
          {[
            { key: false, label: 'Standard', icon: Clock, hint: 'Normal queue' },
            { key: true, label: 'Fast-track', icon: Zap, hint: 'Start within days' },
          ].map(({ key, label, icon: Icon, hint }) => {
            const active = fastTrack === key
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFastTrack(key)}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
                  active
                    ? 'border-teal-400/60 bg-teal-500/15 text-teal-200'
                    : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white/80'
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
                <span className="hidden text-[10px] font-normal text-white/40 sm:inline">· {hint}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Result */}
      <div className="min-w-0" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {option ? (
            <motion.div
              key={`${option.serviceId}-${fastTrack ? 'fast' : 'std'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mt-6 rounded-2xl border border-teal-400/20 bg-zinc-900/60 p-5"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-widest text-white/45 uppercase">
                    Typical range · {option.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-teal-300 tabular-nums">{option.range}</p>
                </div>
                <p className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  <Clock className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                  {option.turnaround}
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{option.scope}</p>
              {fastTrack ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/[0.07] p-3 text-xs leading-relaxed text-amber-200/90">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {estimateRushNote}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={useEstimate}
                  className="h-11 rounded-xl bg-teal-500 px-5 font-semibold text-zinc-950 shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400"
                >
                  Use this estimate in my brief
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Button>
                <p className="flex min-w-0 items-start gap-1.5 text-[11px] leading-relaxed text-white/40">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  {estimateDisclaimer}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="estimate-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/40"
            >
              Pick a work type above to see the typical range and turnaround.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const cardStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const cardFadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

/**
 * Pricing / engagement models — dark conversion section placed between
 * Testimonials and FAQ. Card CTAs pre-fill the start-project form with both
 * a service category (prefill-service) and a budget range (prefill-budget).
 */
export default function Pricing() {
  useEffect(() => {
    track('view_pricing', 'section')
  }, [])

  const startFromPricing = (model: PricingModel) => {
    track('start_project', `pricing-${model.id}`)
    dispatchPrefill('budget', model.budgetHint)
    dispatchPrefill('service', model.serviceHint)
    scrollToId('start-project')
  }

  const requestQuote = () => {
    track('start_project', 'pricing-quote')
    scrollToId('start-project')
  }

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative overflow-hidden bg-zinc-950 py-14 text-white md:py-20"
    >
      {/* Subtle teal glow accents, decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div id="pricing-heading">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, Transparent Ways to Work Together"
            description="Pick the engagement shape that fits your situation — every path starts with a short scoping call and a written quote."
            dark
            align="center"
          />
        </div>

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-8 md:mt-10 grid gap-6 md:grid-cols-3"
        >
          {pricingModels.map((model) => {
            const Icon = MODEL_ICONS[model.icon]
            return (
              <motion.article
                key={model.id}
                variants={cardFadeUp}
                className={`group relative flex h-full flex-col rounded-3xl border p-5 transition-all duration-300 after:pointer-events-none after:absolute after:inset-x-8 after:-top-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-teal-400/70 after:to-transparent after:opacity-0 after:transition-opacity after:duration-300 hover:-translate-y-1.5 group-hover:after:opacity-100 md:p-6 ${
                  model.popular
                    ? 'border-teal-400/40 bg-gradient-to-b from-teal-600/15 via-white/[0.04] to-transparent shadow-xl shadow-teal-900/30 hover:border-teal-400/70 hover:shadow-teal-800/40'
                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:shadow-xl hover:shadow-black/30'
                }`}
              >
                {model.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-950 uppercase shadow-md shadow-teal-500/40">
                    Most popular
                  </span>
                ) : null}

                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                      model.popular
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                    <p className="mt-0.5 text-xs text-white/50">{model.tagline}</p>
                  </div>
                </div>

                <div
                  className={`mt-5 rounded-2xl border p-4 ${
                    model.popular ? 'border-teal-400/20 bg-teal-500/5' : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <p
                    className={`text-2xl font-bold tracking-tight tabular-nums ${
                      model.popular ? 'text-teal-300' : 'text-white'
                    }`}
                  >
                    {model.priceNote}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{model.priceSub}</p>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  <span className="font-medium text-white/80">Best for:</span> {model.bestFor}
                </p>

                <ul className="mt-4 space-y-2.5">
                  {model.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check
                        aria-hidden="true"
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          model.popular ? 'text-teal-400' : 'text-teal-500/80'
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <Button
                    onClick={() => startFromPricing(model)}
                    variant={model.popular ? 'default' : 'outline'}
                    className={`h-11 w-full rounded-xl font-semibold transition-all ${
                      model.popular
                        ? 'bg-teal-500 text-zinc-950 shadow-lg shadow-teal-500/25 hover:bg-teal-400'
                        : 'border-white/20 bg-transparent text-white hover:border-teal-400/50 hover:bg-white/5 hover:text-teal-300'
                    }`}
                  >
                    {model.ctaLabel}
                  </Button>
                </div>
              </motion.article>
            )
          })}
        </motion.div>

        {/* Instant estimate — interactive ballpark that feeds the brief */}
        <InstantEstimate />

        {/* Compact quote escape hatch — scopes the estimator chips don't cover */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={requestQuote}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-medium text-white/60 transition-colors hover:border-teal-400/40 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            Need something custom? Request a Quote
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* What shapes the quote */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-8 md:mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
        >
          <h3 className="text-center text-sm font-semibold tracking-widest text-white/60 uppercase">
            What shapes your quote
          </h3>
          <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {priceFactors.map((factor, i) => (
              <div key={factor.title} className="relative pl-9">
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-teal-400/30 bg-teal-500/10 text-[11px] font-bold text-teal-300"
                >
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-white">{factor.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{factor.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-7 flex items-start justify-center gap-2 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-white/50">
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
            {pricingNote}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
