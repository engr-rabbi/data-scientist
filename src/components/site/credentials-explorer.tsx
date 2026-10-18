'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, BadgeCheck, GraduationCap, MapPin, Medal } from 'lucide-react'

import SectionHeading from '@/components/site/section-heading'
import {
  credentials,
  memberships,
  type Credential,
  type CredentialCategory,
} from '@/config/profile'

/**
 * Certifications page explorer: category filter chips + animated card grid +
 * memberships strip. Categories are derived from the `credentials` data —
 * never hardcoded. `credentialId` / `verifyUrl` are rendered only when the
 * verified CV provides them (currently omitted — nothing is invented).
 */

type Filter = 'All' | CredentialCategory

const CATEGORIES: Filter[] = ['All', ...Array.from(new Set(credentials.map((c) => c.category)))]

function KindBadge({ kind }: { kind: Credential['kind'] }) {
  if (kind === 'Certification') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
        <Award className="h-3.5 w-3.5" aria-hidden="true" />
        Certification
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
      Professional Training
    </span>
  )
}

export default function CredentialsExplorer() {
  const [filter, setFilter] = useState<Filter>('All')
  const filtered = filter === 'All' ? credentials : credentials.filter((c) => c.category === filter)

  return (
    <section
      id="credentials"
      aria-labelledby="credentials-heading"
      className="bg-white py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="credentials-heading">
          <SectionHeading
            eyebrow="Certifications & Training"
            title="Verified Credentials, Categorized"
            description="Every certificate and training below is sourced from the verified CV — filter by category to see how data science, machine learning, big data and project management fit together."
          />
        </div>

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter credentials by category"
        >
          {CATEGORIES.map((category) => {
            const active = filter === category
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(category)}
                className={`min-h-9 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
                  active
                    ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                {category}
              </button>
            )
          })}
        </motion.div>

        {/* Filtered credential cards */}
        <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((credential) => (
              <motion.article
                key={credential.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <KindBadge kind={credential.kind} />
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                    {credential.category}
                  </span>
                </div>

                <h3 className="mt-4 font-semibold text-zinc-900">{credential.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {credential.provider}
                  {credential.location ? (
                    <span className="ml-1.5 inline-flex items-center gap-1">
                      ·
                      <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
                      {credential.location}
                    </span>
                  ) : null}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {credential.description}
                </p>

                {/* Only rendered when the verified source provides them */}
                {credential.credentialId || credential.verifyUrl ? (
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {credential.credentialId ? <span>ID: {credential.credentialId}</span> : null}
                    {credential.verifyUrl ? (
                      <a
                        href={credential.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-700 underline underline-offset-4 hover:text-teal-600"
                      >
                        Verify credential
                      </a>
                    ) : null}
                  </p>
                ) : null}

                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${credential.name} skills`}>
                  {credential.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Memberships strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-8 md:mt-10 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5"
        >
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-600 shadow-sm">
              <Medal className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-900">Professional Memberships</h3>
              <ul className="mt-3 space-y-2">
                {memberships.map((membership) => (
                  <li key={membership.name} className="flex items-start gap-2 text-sm text-zinc-700">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <span>
                      {membership.level} — {membership.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sourced from the verified CV — credential IDs and verification links available on request.
        </p>
      </div>
    </section>
  )
}
