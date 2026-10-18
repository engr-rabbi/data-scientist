'use client'

import { withBase } from '@/lib/base-path'
import { motion } from 'framer-motion'
import { ExternalLink, Quote } from 'lucide-react'

import { testimonials, testimonialsPlaceholder } from '@/config/profile'
import SectionHeading from '@/components/site/section-heading'

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-white py-14 md:py-20"
    >
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div id="testimonials-heading">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Clients Say"
            moreHref="/testimonials"
            moreLabel="Testimonials page"
          />
        </div>

        {testimonials.length > 0 ? (
          <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.figure
                key={`${t.name}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
                className="flex h-full flex-col rounded-2xl border bg-zinc-50/60 p-6"
              >
                <Quote className="size-6 text-teal-600" aria-hidden />
                <blockquote className="mt-3 flex-1 leading-relaxed text-zinc-700">“{t.quote}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  {t.photo ? (
                     
                    <img src={withBase(t.photo)} alt={t.photoAlt || t.name} loading="lazy" className="size-11 rounded-full object-cover" />
                  ) : null}
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold text-zinc-900">{t.name}</div>
                    <div className="text-muted-foreground">{[t.role, t.company].filter(Boolean).join(' · ')}</div>
                  </div>
                  {t.sourceUrl ? (
                    <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Original review by ${t.name}`} className="ml-auto text-teal-700">
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  ) : null}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="mt-8 md:mt-10 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center"
          >
            <div className="mx-auto flex w-fit items-center justify-center rounded-xl bg-teal-50 p-3 text-teal-600">
              <Quote className="size-6" aria-hidden />
            </div>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-zinc-600">
              {testimonialsPlaceholder}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Verified reviews from Upwork / Freelancer will be linked here.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
