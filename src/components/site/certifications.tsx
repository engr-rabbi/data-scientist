'use client'

import { motion } from 'framer-motion'
import { Award, BadgeCheck, MapPin, Medal } from 'lucide-react'

import { credentials, memberships } from '@/config/profile'
import SectionHeading from '@/components/site/section-heading'

/**
 * Homepage certifications strip — categorized credential cards built from the
 * structured `credentials` config (verified CV data only). The full
 * categorized explorer lives on the /certifications page.
 */
export default function Certifications() {
  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="bg-white py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div id="certifications-heading">
          <SectionHeading
            eyebrow="Certifications & Training"
            title="Verified Credentials"
            moreHref="/certifications"
            moreLabel="All credentials"
          />
        </div>

        <div className="mt-8 md:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cert, i) => {
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="h-full"
              >
                <div className="flex h-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex w-fit items-center justify-center rounded-lg bg-teal-50 p-2 text-teal-600">
                      <Award className="size-5" aria-hidden />
                    </span>
                    <span className="rounded-full border border-teal-600/20 bg-teal-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-teal-700 uppercase">
                      {cert.category}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold leading-snug text-zinc-900">
                    {cert.name}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                    <span>{cert.provider}</span>
                    {cert.location ? (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <MapPin className="size-3" aria-hidden /> {cert.location}
                      </span>
                    ) : null}
                  </p>
                </div>
              </motion.div>
            )
          })}

          {/* Memberships card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: credentials.length * 0.06 }}
            className="h-full"
          >
            <div className="flex h-full min-w-0 flex-col rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="flex w-fit items-center justify-center rounded-lg bg-teal-100/80 p-2 text-teal-700">
                  <Medal className="size-5" aria-hidden />
                </span>
                <span className="rounded-full border border-teal-600/20 bg-white px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-teal-700 uppercase">
                  Memberships
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {memberships.map((m) => (
                  <li key={m.name} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
                    <span className="min-w-0 text-sm leading-snug text-zinc-800">
                      <span className="font-semibold">{m.level}</span> — {m.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sourced from the verified CV — credential IDs and verification links available on request
        </p>
      </div>
    </section>
  )
}
