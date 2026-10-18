'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { experience } from '@/config/profile'
import { Badge } from '@/components/ui/badge'
import SectionHeading from '@/components/site/section-heading'

export default function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="bg-zinc-50 py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div id="experience-heading">
          <SectionHeading
            eyebrow="Experience"
            title="A Background Wider Than Freelancing"
            description="Real engineering organizations, international delivery, and structured project management — applied to every data engagement."
            moreHref="/experience"
            moreLabel="Experience page"
          />
        </div>

        {/* Vertical timeline with gradient line + teal nodes */}
        <div className="relative mx-auto mt-8 md:mt-10 max-w-4xl space-y-8">
          <div
            aria-hidden
            className="absolute inset-y-2 left-[7px] w-px bg-gradient-to-b from-teal-500 via-teal-400/50 to-transparent"
          />
          {experience.map((entry, i) => (
            <motion.div
              key={`${entry.org}-${i}`}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative pl-10"
            >
              <span
                aria-hidden
                className="absolute left-0 top-2 size-4 rounded-full bg-teal-500 ring-4 ring-teal-500/15"
              />
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-zinc-900">{entry.role}</h3>
                  <Badge
                    variant="outline"
                    className="rounded-full border-teal-200 bg-teal-50 text-teal-700"
                  >
                    {entry.org} · {entry.period}
                  </Badge>
                </div>
                <ul className="mt-4 space-y-2">
                  {entry.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm leading-relaxed text-zinc-600"
                    >
                      <ArrowRight
                        className="mt-0.5 size-4 shrink-0 text-teal-600"
                        aria-hidden
                      />
                      <span>{point}</span>
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
