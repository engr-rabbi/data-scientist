'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { tx } from '@/lib/ui-text'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  dark?: boolean
  align?: 'left' | 'center'
  /** Optional link to the section's dedicated page (homepage internal linking). */
  moreHref?: string
  /** Label for the "view page" link (defaults to 'View page'). */
  moreLabel?: string
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

/**
 * Shared section heading: teal eyebrow with a short rule, bold title and an
 * optional muted description. Subtle whileInView fade-up (runs once).
 * When `moreHref` is set, a quiet "View <label> →" link sits at the heading's
 * right edge (md+) / below (mobile) so every homepage section advertises its
 * dedicated page.
 */
function SectionHeading({
  eyebrow: eyebrowRaw,
  title: titleRaw,
  description: descriptionRaw,
  dark = false,
  align = 'left',
  moreHref,
  moreLabel: moreLabelRaw = 'View page',
}: SectionHeadingProps) {
  // Admin-editable wording (Admin → Content → "Headings & button labels")
  const eyebrow = tx(eyebrowRaw)
  const title = tx(titleRaw)
  const description = tx(descriptionRaw)
  const moreLabel = tx(moreLabelRaw)
  const centered = align === 'center'
  const lineColor = dark ? 'bg-teal-400/60' : 'bg-teal-600/60'

  const moreLink = moreHref ? (
    <Link
      href={moreHref}
      className={`group inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
        dark
          ? 'border-white/15 bg-white/5 text-teal-300 hover:border-teal-400/40 hover:bg-white/10'
          : 'border-teal-600/20 bg-teal-50 text-teal-700 hover:border-teal-600/50 hover:bg-teal-100'
      }`}
    >
      {moreLabel}
      <ArrowUpRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </Link>
  ) : null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className={
        centered
          ? 'mx-auto max-w-2xl text-center'
          : 'flex flex-wrap items-end justify-between gap-x-8 gap-y-4'
      }
    >
      <div className={centered ? '' : 'max-w-2xl min-w-0'}>
        <p
          className={`flex items-center gap-2.5 text-xs font-semibold tracking-widest uppercase ${
            dark ? 'text-teal-400' : 'text-teal-600'
          } ${centered ? 'justify-center' : ''}`}
        >
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className={`inline-block h-px w-6 ${lineColor} ${centered ? 'origin-right' : 'origin-left'}`}
          />
          {eyebrow}
          {centered ? (
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              className={`inline-block h-px w-6 origin-left ${lineColor}`}
            />
          ) : null}
        </p>

        <h2
          className={`mt-2.5 text-3xl font-bold tracking-tight md:text-4xl ${
            dark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          {title}
        </h2>

        {description ? (
          <p className="text-balance mt-3 text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {moreLink}
    </motion.div>
  )
}

export default SectionHeading
// Named alias kept in sync with the binding contract so either import style works.
export { SectionHeading }
