'use client'

import { motion } from 'framer-motion'

import PipelineCard from '@/components/site/pipeline-card'

/**
 * About-page "how I work with models" band: an honest, high-level framing of
 * the modeling workflow (exploratory analysis → feature preparation → model
 * training → honest evaluation → handover) around the shared PipelineCard
 * demo visualization (synthetic data — no real predictions shown).
 */
export default function PipelineBand() {
  return (
    <section
      id="pipeline"
      aria-labelledby="pipeline-heading"
      className="relative overflow-hidden bg-zinc-950 py-14 text-white md:py-16"
    >
      {/* Subtle teal glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="flex items-center justify-center gap-2.5 text-xs font-semibold tracking-widest text-teal-400 uppercase">
            <span aria-hidden="true" className="inline-block h-px w-6 origin-right bg-teal-400/60" />
            How I Work With Models
            <span aria-hidden="true" className="inline-block h-px w-6 origin-left bg-teal-400/60" />
          </p>
          <h2
            id="pipeline-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            From Raw Data to Working Predictions
          </h2>
          <p className="mt-4 leading-relaxed text-white/60">
            Every engagement follows the same honest arc: exploratory analysis to understand the
            data, careful feature preparation, model training, evaluation you can trust (baselines,
            validation, no inflated claims), and a handover your team can actually run. The card
            below is a sample visualization — synthetic data, illustrative only.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
          className="mt-8 md:mt-10 max-w-md mx-auto min-w-0"
        >
          <PipelineCard />
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/40">Demo visualization — synthetic data</p>
      </div>
    </section>
  )
}
