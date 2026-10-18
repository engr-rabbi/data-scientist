'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, FolderKanban, MessagesSquare } from 'lucide-react'

/**
 * Closing band for /about: "What kind of projects I can handle" — concrete
 * project categories as scannable chips, with two forward CTAs. Dark band to
 * match the site's zinc-950 design identity.
 */

const PROJECT_TYPES = [
  'Analytics dashboards',
  'Churn & risk prediction',
  'Sales / demand forecasting',
  'Customer segmentation',
  'RAG document assistants',
  'AI workflow automation',
  'Image classification',
  'OCR',
  'Web data extraction',
]

export default function ProjectsHandle() {
  return (
    <section
      aria-labelledby="projects-handle-heading"
      className="relative overflow-hidden bg-zinc-950 py-14 text-white md:py-16"
    >
      {/* Subtle teal glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="max-w-2xl min-w-0"
        >
          <p className="flex items-center gap-2.5 text-xs font-semibold tracking-widest text-teal-400 uppercase">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-teal-400/60" />
            What kind of projects I can handle
          </p>
          <h2
            id="projects-handle-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Bring one of these — or something similar
          </h2>
          <p className="mt-4 leading-relaxed text-white/60">
            Common engagement shapes I build for clients: pick the closest one and describe your
            data — the first reply is always a scoped, honest take on feasibility.
          </p>
        </motion.div>

        {/* Project-category chips */}
        <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Project categories I can handle">
          {PROJECT_TYPES.map((type, i) => (
            <motion.li
              key={type}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: 'easeOut' }}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:border-teal-400/40 hover:bg-white/10 hover:text-white"
            >
              {type}
            </motion.li>
          ))}
        </ul>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70"
          >
            <FolderKanban className="size-4" aria-hidden="true" />
            View projects
          </Link>
          <Link
            href="/start-a-project"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <MessagesSquare className="size-4" aria-hidden="true" />
            Discuss a similar project
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
