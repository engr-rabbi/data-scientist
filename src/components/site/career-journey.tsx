'use client'

import { motion } from 'framer-motion'

import SectionHeading from '@/components/site/section-heading'
import { careerJourney } from '@/config/profile'

/**
 * About-page career timeline: Engineering → Professional Experience →
 * Delivery → Data Analytics → Data Science → ML → Deep Learning → Big Data →
 * Applied AI. Data comes from `careerJourney` in the profile config; numbered
 * nodes are derived from the array order (01–09). Timeline styling mirrors
 * the homepage experience section.
 */
export default function CareerJourney() {
  return (
    <section
      id="career-journey"
      aria-labelledby="career-journey-heading"
      className="bg-zinc-50 py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="career-journey-heading">
          <SectionHeading
            eyebrow="Career Journey"
            title="One Story: Engineering → Data → AI"
            description="Every stage compounds: engineering discipline, industry experience and project delivery became the foundation for analytics, machine learning and applied AI."
          />
        </div>

        {/* Vertical timeline with gradient line + numbered teal nodes */}
        <div className="relative mx-auto mt-8 md:mt-10 max-w-3xl space-y-8">
          <div
            aria-hidden
            className="absolute inset-y-2 left-[15px] w-px bg-gradient-to-b from-teal-400 to-teal-600"
          />
          {careerJourney.map((stage, i) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative pl-14"
            >
              <span
                aria-hidden
                className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border border-teal-200 bg-white text-xs font-bold text-teal-700 shadow-sm ring-4 ring-teal-500/10"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold tracking-widest text-teal-600 uppercase">
                  {stage.stage}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold text-zinc-900">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{stage.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${stage.title} tags`}>
                  {stage.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
