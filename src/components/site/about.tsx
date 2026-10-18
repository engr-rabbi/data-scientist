'use client'

import { withBase } from '@/lib/base-path'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { Braces, MapPin, MessagesSquare, Rocket, Target, type LucideIcon } from 'lucide-react'
import SectionHeading from '@/components/site/section-heading'
import { about, profile } from '@/config/profile'

const HOW_I_WORK_ICONS: LucideIcon[] = [Target, Braces, MessagesSquare, Rocket]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function About() {
  return (
    <section id="about" className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="About Me"
          title="From Engineering to Data & AI"
          description={profile.valueProposition}
          moreHref="/about"
          moreLabel="Full About page"
        />

        <div className="mt-8 md:mt-10 grid gap-6 md:gap-8 lg:grid-cols-12">
          {/* Left: narrative + how I work */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-7"
          >
            <div className="space-y-5">
              {about.narrative.map((paragraph, i) => (
                <motion.p
                  key={i}
                  variants={item}
                  className={
                    i === 0
                      ? 'text-lg leading-relaxed text-zinc-800'
                      : 'leading-relaxed text-zinc-600'
                  }
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.h3
              variants={item}
              className="mt-8 text-sm font-semibold tracking-widest text-teal-600 uppercase"
            >
              How I work
            </motion.h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {about.howIWork.map((entry, i) => {
                const Icon = HOW_I_WORK_ICONS[i % HOW_I_WORK_ICONS.length]
                return (
                  <motion.div
                    key={entry.title}
                    variants={item}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 transition-colors duration-300 hover:border-teal-500/60 hover:bg-white hover:shadow-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-teal-50 text-teal-600">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h4 className="mt-3 text-sm font-semibold text-zinc-900">{entry.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{entry.body}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: professional snapshot */}
          <motion.aside
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-5"
          >
            <motion.div
              variants={item}
              className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {profile.photo ? (
                  <Image
                    src={withBase(profile.photo)}
                    alt={`Portrait of ${profile.name}`}
                    width={759}
                    height={876}
                    sizes="64px"
                    className="h-16 w-16 shrink-0 rounded-xl border border-teal-100 object-cover shadow-md"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold tracking-wider text-white shadow-md shadow-teal-600/20"
                  >
                    {profile.initials}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-zinc-900">{profile.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{profile.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
                    {profile.location}
                  </p>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-zinc-100 border-t border-zinc-100">
                {about.snapshot.map((row) => (
                  <div key={row.label} className="py-3.5">
                    <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
