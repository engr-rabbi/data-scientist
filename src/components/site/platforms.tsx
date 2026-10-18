'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Briefcase, Globe, Linkedin } from 'lucide-react'

import { platforms } from '@/config/profile'
import { platformLinks } from '@/lib/links'
import { track, type AnalyticsEvent } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/site/section-heading'

/** Kaggle "k" brand mark (inline SVG, brand exception on teal chip). */
function KaggleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.283.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.073.335z" />
    </svg>
  )
}

type PlatformStyle = { bg: string; icon: ReactNode }

/* Brand-colored chips. Brand marks are the only color exception in the design
   system: LinkedIn #0A66C2 + Upwork #14a800 are genuine brand colors; Kaggle
   and Freelancer use teal/amber to stay blue-free. */
const platformStyles: Record<string, PlatformStyle> = {
  LinkedIn: { bg: '#0A66C2', icon: <Linkedin className="size-5" /> },
  Upwork: { bg: '#14a800', icon: <Briefcase className="size-5" /> },
  Freelancer: { bg: '#f59e0b', icon: <Globe className="size-5" /> },
  Kaggle: { bg: '#14b8a6', icon: <KaggleIcon className="size-4" /> },
}

const fallbackStyle: PlatformStyle = { bg: '#3f3f46', icon: <Globe className="size-5" /> }

export default function Platforms() {
  return (
    <section
      id="platforms"
      aria-labelledby="platforms-heading"
      className="bg-zinc-950 py-14 text-white md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div id="platforms-heading">
          <SectionHeading
            dark
            eyebrow="Find Me Online"
            title="Professional Profiles"
            description="The same name and positioning across every platform."
            moreHref="/kaggle"
            moreLabel="Kaggle & profiles"
          />
        </div>

        <div className="mt-8 md:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((platform, i) => {
            const style = platformStyles[platform.name] ?? fallbackStyle
            return (
              <motion.a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track(`click_${platform.name.toLowerCase()}` as AnalyticsEvent, 'platforms')
                }
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
              >
                <div
                  className="flex size-11 w-fit items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: style.bg }}
                >
                  {style.icon}
                </div>
                <h3 className="mt-4 font-semibold text-white">{platform.name}</h3>
                <p className="mt-1 text-sm text-white/60">{platform.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-300">
                  {platform.cta}
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </motion.a>
            )
          })}
        </div>

        {/* Dedicated Kaggle highlight strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 flex flex-col items-start justify-between gap-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
              <KaggleIcon className="size-5" />
            </div>
            <p className="text-sm text-white/70 sm:max-w-md">
              Explore my Kaggle notebooks, datasets and data science experiments.
            </p>
          </div>
          <Button size="lg" className="h-11 shrink-0" asChild>
            <a
              href={platformLinks.kaggle}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_kaggle', 'platforms')}
            >
              View Kaggle Profile
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
