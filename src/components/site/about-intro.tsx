'use client'

import { withBase } from '@/lib/base-path'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

import { profile } from '@/config/profile'

/**
 * About-page intro: a professional-positioning opener (not a biography).
 * Two short paragraphs answer, in order: what I do now, where the practical
 * base comes from, and how the craft was learned. Facts are sourced from the
 * verified CV and public GitHub — no ranks, medals or company specifics here.
 */

const FACT_CHIPS = ['Telecommunication', 'Data Science', 'Engineering in the UAE', 'IBM Data Science']

export default function AboutIntro() {
  return (
    <section aria-labelledby="about-intro-heading" className="bg-white py-12 md:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left: positioning + fact chips */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="min-w-0"
          >
            <p className="flex items-center gap-2.5 text-xs font-semibold tracking-widest text-teal-600 uppercase">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-teal-600/60" />
              What I do
            </p>
            <h2
              id="about-intro-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl"
            >
              Practical data science, built on real industry work
            </h2>

            <div className="mt-5 space-y-4">
              <p className="leading-relaxed text-zinc-600">
                Today I deliver end to end: from raw, messy data through cleaning and analysis to
                predictive models, Power BI dashboards and AI-powered automation — the full path
                from &ldquo;we have data&rdquo; to &ldquo;we use the result.&rdquo; Every build
                follows the same discipline: clear requirements, reproducible code, honest
                evaluation and a handover your team can actually maintain.
              </p>
              <p className="leading-relaxed text-zinc-600">
                The practical base comes from industry: telecommunication engineering operations and
                international engineering delivery in the UAE taught me how technical work is
                scoped, documented and shipped. The methods come from formal certifications — the
                IBM Data Science program among them — and from learning in public: Kaggle
                competitions and open notebooks, each mirrored as a public GitHub repository you can
                inspect.
              </p>
            </div>

            {/* Fact chips — verified CV + public sources */}
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Professional facts from the verified CV">
              {FACT_CHIPS.map((fact) => (
                <li
                  key={fact}
                  className="rounded-full border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-medium text-teal-700"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: photo presentation with soft teal glow */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="relative min-w-0"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 right-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"
            />
            <figure className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl ring-1 ring-teal-600/10">
              <Image
                src={withBase(profile.photo)}
                alt={`Portrait of ${profile.name}, data scientist and machine learning engineer`}
                width={759}
                height={876}
                sizes="(min-width:1024px) 480px, 100vw"
                className="h-auto w-full object-cover"
                priority
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 bg-white px-5 py-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-zinc-900">
                    {profile.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {profile.title}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
                  {profile.location}
                </span>
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
