'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Bot, Brain, ScanEye, TrendingUp, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import SectionHeading from '@/components/site/section-heading'

/**
 * "What I can do" — the six practical expertise domains, each mapped to the
 * matching service engagement on /services. Compact two-line cards so a
 * prospective client can scan capabilities in seconds.
 */

interface ExpertiseArea {
  title: string
  description: string
  icon: LucideIcon
}

const AREAS: ExpertiseArea[] = [
  {
    title: 'Data Analytics & Business Intelligence',
    description:
      'Clean, consolidate and visualize your data — KPI dashboards and reports in Power BI, SQL and Python that answer real business questions.',
    icon: BarChart3,
  },
  {
    title: 'Machine Learning & Predictive Analytics',
    description:
      'Churn, risk and behavior prediction with scikit-learn and XGBoost — honest evaluation and explainability included.',
    icon: Brain,
  },
  {
    title: 'Time Series & Forecasting',
    description:
      'Sales, demand and revenue forecasts from time-series data — models your operations can actually plan around.',
    icon: TrendingUp,
  },
  {
    title: 'AI, LLM & RAG Solutions',
    description:
      'Retrieval-augmented assistants over your own documents — grounded answers with sources, built on modern LLM tooling.',
    icon: Bot,
  },
  {
    title: 'Deep Learning & Computer Vision',
    description:
      'Neural networks with TensorFlow & Keras for image classification, OCR and document-extraction tasks.',
    icon: ScanEye,
  },
  {
    title: 'AI Workflow Automation',
    description:
      'Connect models, scripts and tools into automated workflows (n8n) so the insight triggers the action by itself.',
    icon: Workflow,
  },
]

export default function ExpertiseAreas() {
  return (
    <section aria-label="Expertise areas" className="bg-zinc-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="What I can do"
          title="Expertise you can put to work"
          description="Six practical domains — each one backed by public code, formal certification and hands-on delivery."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: 'easeOut' }}
              className="min-w-0"
            >
              <Link
                href="/services"
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                aria-label={`${area.title} — see the matching service`}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <area.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-base leading-snug font-semibold text-zinc-900 transition-colors group-hover:text-teal-700">
                  {area.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{area.description}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3.5 text-sm font-medium text-teal-700">
                  Explore this service
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
