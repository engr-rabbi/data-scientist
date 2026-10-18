'use client'

import { withBase } from '@/lib/base-path'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Bot,
  BrainCircuit,
  Briefcase,
  Check,
  Globe2,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

import { services, type IconName, type Service } from '@/config/profile'
import { dispatchPrefill, openStartProject, platformLinks } from '@/lib/links'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SectionHeading from '@/components/site/section-heading'

/* IconName → lucide icon map (binding contract) */
const serviceIcons: Record<IconName, LucideIcon> = {
  'bar-chart': BarChart3,
  brain: BrainCircuit,
  'trending-up': TrendingUp,
  bot: Bot,
  workflow: Workflow,
  scan: ScanSearch,
  globe: Globe2,
}

/**
 * Shared "Start This Project" flow.
 * CONTRACT: dispatches `prefill-service` CustomEvent (detail = serviceId) on
 * window — the StartProject form listens to it and pre-selects the service.
 */
function startProject(serviceId: string) {
  track('start_project', serviceId)
  dispatchPrefill('service', serviceId)
  // Opens the dedicated inquiry page; the form reads the stashed service on load.
  openStartProject()
}

export default function Services() {
  const [selected, setSelected] = useState<Service | null>(null)

  /**
   * CONTRACT: listens for `open-service` CustomEvent (detail = serviceId) on
   * window — lets any other section (e.g. the service-finder quiz) open this
   * service's detail dialog directly.
   */
  useEffect(() => {
    const open = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      const service = services.find((s) => s.id === id)
      if (!service) return
      track('view_service', `dialog-open-${id}`)
      setSelected(service)
    }
    window.addEventListener('open-service', open)
    return () => window.removeEventListener('open-service', open)
  }, [])

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-white py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div id="services-heading">
          <SectionHeading
            eyebrow="Services"
            title="What I Can Do For You"
            description="Business-oriented service architecture — from raw data to deployed AI. Every engagement follows a structured, documented process."
            moreHref="/services"
            moreLabel="Services page"
          />
        </div>

        <div className="mt-8 md:mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, i) => {
            const Icon = serviceIcons[service.icon]
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="h-full"
              >
                <div className="relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {/* optional picture (Admin → Content → Services → Image) */}
                  {service.image ? (
                     
                    <img
                      src={withBase(service.image)}
                      alt={service.imageAlt || service.title}
                      title={service.imageCaption || undefined}
                      loading="lazy"
                      decoding="async"
                      className="-mx-5 -mt-5 mb-4 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none rounded-t-2xl object-cover"
                    />
                  ) : (
                    /* ghost number (only when there is no picture) */
                    <span
                      aria-hidden
                      className="absolute right-5 top-4 select-none text-4xl font-bold leading-none text-zinc-100"
                    >
                      {service.number}
                    </span>
                  )}

                  <div className="flex w-fit items-center justify-center rounded-xl bg-teal-50 p-2.5 text-teal-600">
                    <Icon className="size-6" aria-hidden />
                  </div>

                  <h3 className="mt-4 font-semibold text-zinc-900">{service.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {service.tagline}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {service.items.slice(0, 5).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm font-medium text-teal-700">
                    {service.priceFrom != null
                      ? `Starting from $${service.priceFrom}`
                      : 'Request a Quote'}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-haspopup="dialog"
                      onClick={() => setSelected(service)}
                    >
                      Details
                    </Button>
                    {service.ctaLink ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-teal-600 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <a href={withBase(service.ctaLink)}>{service.ctaLabel || 'Learn more'}</a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-teal-600 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                        onClick={() => startProject(service.id)}
                      >
                        {service.ctaLabel || 'Start This Project'}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Custom project CTA tile — completes the 8-tile grid */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: services.length * 0.06 }}
            className="h-full"
          >
            <div className="flex h-full flex-col justify-center rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
              <div className="flex w-fit items-center justify-center rounded-xl bg-white p-2.5 text-teal-600 shadow-sm">
                <Sparkles className="size-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900">Need Something Custom?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Every engagement is scoped individually. Tell me your problem and I&apos;ll
                propose the right data solution — with a clear process and honest pricing.
              </p>
              <div className="pt-4">
                <Button
                  className="h-11 px-6"
                  onClick={() => {
                    track('start_project', 'custom')
                    openStartProject()
                  }}
                >
                  Start This Project
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Service detail dialog.
          Layout: header (fixed) → body (the ONLY scroll region: picture + details) → footer (pinned CTAs).
          The dialog is capped to the viewport, so a tall picture or long text can never push the
          call-to-action buttons out of view — with or without an image. */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        {selected && (
          <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="shrink-0 border-b border-zinc-100 px-5 pt-5 pb-4 text-left sm:px-6">
              <div className="flex items-start gap-3 pr-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 p-2.5 text-teal-600">
                  {(() => {
                    const Icon = serviceIcons[selected.icon]
                    return <Icon className="size-6" aria-hidden />
                  })()}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl leading-snug">{selected.title}</DialogTitle>
                  <DialogDescription className="mt-1">{selected.tagline}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-6">
                {selected.image ? (
                  <figure>
                    <img
                      src={withBase(selected.image)}
                      alt={selected.imageAlt || selected.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        // a missing file must not leave a broken-image box
                        e.currentTarget.closest('figure')?.setAttribute('hidden', '')
                      }}
                      className="aspect-[16/9] w-full rounded-xl bg-zinc-100 object-cover"
                    />
                    {selected.imageCaption ? (
                      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                        {selected.imageCaption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null}

                {/* Problem / Solution */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      The Problem
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      {selected.detail.problem}
                    </p>
                  </div>
                  <div className="rounded-xl bg-teal-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                      The Solution
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      {selected.detail.solution}
                    </p>
                  </div>
                </div>

                {/* Process — numbered vertical steps with connector line */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Process</h4>
                  <ol className="relative ml-3 mt-4 space-y-4 border-l-2 border-teal-100 pl-6">
                    {selected.detail.process.map((step, si) => (
                      <li key={si} className="relative">
                        <span className="absolute -left-[35px] top-0 flex size-6 items-center justify-center rounded-full border border-teal-200 bg-white text-xs font-semibold text-teal-700">
                          {si + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-zinc-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Deliverables</h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selected.detail.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-zinc-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">Technologies</h4>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.detail.technologies.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned footer — price + call-to-action buttons, always visible */}
            <div
              className={cn(
                'shrink-0 border-t border-teal-100 bg-teal-50 px-5 pt-3 sm:px-6',
                'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
              )}
            >
              <p className="text-sm font-medium text-teal-800">
                {selected.priceFrom != null
                  ? `Starting from $${selected.priceFrom} — final quote after scope confirmation`
                  : 'Pricing on request — scoped individually'}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selected.ctaLink ? (
                  <Button asChild className="col-span-2 h-auto min-h-11 whitespace-normal py-2 sm:col-span-1">
                    <a href={withBase(selected.ctaLink)}>{selected.ctaLabel || 'Start This Project'}</a>
                  </Button>
                ) : (
                  <Button
                    className="col-span-2 h-auto min-h-11 whitespace-normal py-2 sm:col-span-1"
                    onClick={() => {
                      const id = selected.id
                      setSelected(null)
                      startProject(id)
                    }}
                  >
                    Start This Project
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-auto min-h-11 whitespace-normal border-teal-200 bg-white py-2 text-teal-800 hover:bg-teal-50 hover:text-teal-900"
                  asChild
                >
                  <a
                    href={platformLinks.upwork}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_upwork', selected.id)}
                  >
                    <Briefcase aria-hidden />
                    Hire Me on Upwork
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto min-h-11 whitespace-normal border-teal-200 bg-white py-2 text-teal-800 hover:bg-teal-50 hover:text-teal-900"
                  asChild
                >
                  <a
                    href={platformLinks.freelancer}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('click_freelancer', selected.id)}
                  >
                    <Users aria-hidden />
                    Hire Me on Freelancer
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
