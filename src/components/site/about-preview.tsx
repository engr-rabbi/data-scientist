'use client'

import { withBase } from '@/lib/base-path'
import { tx } from '@/lib/ui-text'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { profile } from '@/config/profile'
import { track } from '@/lib/analytics'

/**
 * Compact "About" preview band — the homepage's ONLY about-style surface.
 * The full About content lives on the dedicated /about page (achievement &
 * expertise showcase); here we show a short professional identity teaser with
 * verified fact chips and a clear hand-off to /about.
 *
 * Kept deliberately compact per the site's Compact Professional Mode.
 */

const FACTS = [
  'Industries: Telecommunication · Data Science',
  'IBM Data Science certified',
  '33 public repositories',
  '4 Kaggle competitions',
] as const

export default function AboutPreview() {
  return (
    <section id="about" aria-labelledby="about-preview-heading" className="border-y border-zinc-200 bg-zinc-50 py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="min-w-0 lg:col-span-8"
          >
            <p className="flex items-center gap-2.5 text-xs font-semibold tracking-widest text-teal-600 uppercase">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-teal-600/60" />
              {tx('About me')}
            </p>
            <h2 id="about-preview-heading" className="mt-2.5 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
              Data scientist &amp; ML engineer with an engineer&apos;s discipline
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-zinc-600">
              I turn messy data into predictive models, Power BI dashboards and practical AI
              automation — working remotely from Dhaka with clients worldwide. The full story:
              what I have done, learned, and can build for you lives on the About page.
            </p>

            {/* Verified fact chips */}
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Verified career facts">
              {FACTS.map((fact) => (
                <li
                  key={fact}
                  className="rounded-full border border-teal-200/70 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 shadow-sm"
                >
                  {fact}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/about"
                onClick={() => track('view_page', '/about')}
                className="group inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                Read the full story
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/certifications"
                onClick={() => track('view_page', '/certifications')}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-teal-600/40 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                Certifications &amp; training
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>

          {/* Compact photo card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="min-w-0 lg:col-span-4"
          >
            <figure className="relative mx-auto flex max-w-xs items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 right-4 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl"
              />
              <Image
                src={withBase(profile.photo)}
                alt={`Portrait of ${profile.name}, freelance data scientist and machine learning engineer`}
                width={759}
                height={876}
                sizes="96px"
                className="h-24 w-24 shrink-0 rounded-xl border border-teal-100 object-cover shadow-md"
              />
              <figcaption className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-900">{profile.name}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  Freelance Data Scientist · ML &amp; AI
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Open to new projects
                </span>
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
