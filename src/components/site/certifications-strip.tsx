'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Award, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import SectionHeading from '@/components/site/section-heading'
import { credentials } from '@/config/profile'

/**
 * Compact credentials preview for /about — name + provider + category badge
 * per entry, derived directly from the verified CV data in profile.ts.
 * No credential IDs, years or verify links are shown or invented here; the
 * full explorer lives on /certifications.
 */

const KIND_STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  Certification: { icon: Award, className: 'bg-teal-50 text-teal-600' },
  'Professional Training': { icon: GraduationCap, className: 'bg-amber-50 text-amber-600' },
}

export default function CertificationsStrip() {
  return (
    <section aria-label="Certifications and training" className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Certified & trained"
          title="Formal credentials behind the practice"
          description="Certifications and professional trainings from the verified CV — the formal layer under the hands-on work."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential, i) => {
            const badge = KIND_STYLE[credential.kind] ?? KIND_STYLE['Certification']
            return (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: 'easeOut' }}
                className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${badge.className}`}
                  >
                    <badge.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                    {credential.category}
                  </span>
                </div>
                <h3 className="mt-3 text-sm leading-snug font-semibold text-zinc-900">
                  {credential.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {credential.provider}
                  {credential.location ? ` · ${credential.location}` : ''}
                </p>
              </motion.div>
            )
          })}

          {/* CTA card → /certifications */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: (credentials.length % 3) * 0.07, ease: 'easeOut' }}
            className="flex min-w-0 flex-col justify-between rounded-2xl border border-teal-200 bg-teal-50/60 p-5"
          >
            <div>
              <p className="text-sm leading-relaxed text-zinc-700">
                {credentials.length} certifications & professional trainings — with categories,
                focus areas and memberships on the dedicated page.
              </p>
            </div>
            <Link
              href="/certifications"
              className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            >
              View all certifications & training
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
