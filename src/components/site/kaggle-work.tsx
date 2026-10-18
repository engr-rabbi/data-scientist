'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, BookOpen, Database, Github, ShieldCheck, Star, Trophy, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SectionHeading from '@/components/site/section-heading'
import KaggleIcon from '@/components/site/kaggle-icon'
import { kaggleActivities, social, type KaggleActivity } from '@/config/profile'
import { withBase } from '@/lib/base-path'
import { track } from '@/lib/analytics'
import { normalizeKind, safeUrl, selectForHome, type KaggleKind } from '@/lib/kaggle'
import { cn } from '@/lib/utils'

/**
 * Homepage section "Kaggle Competitions, Notebooks & Dataset Work" (also reused, in full, on /kaggle).
 * Content comes from Admin → Kaggle activities (title, category, descriptions, image, Kaggle URL,
 * skills, technologies, verified result, display order, featured, publish).
 *
 * Honesty rules: a rank / medal / score is shown ONLY when the admin entered it in the
 * "Competition result" field; a "View on Kaggle" button appears ONLY when a Kaggle URL was entered
 * (otherwise the verified GitHub mirror is offered instead). Nothing is inferred.
 */

const HOME_LIMIT = 6

const KIND_STYLE: Record<KaggleKind, { badge: string; icon: LucideIcon }> = {
  Competition: { badge: 'bg-teal-700 text-white', icon: Trophy },
  Notebook: { badge: 'bg-white text-teal-800 ring-1 ring-teal-200', icon: BookOpen },
  Dataset: { badge: 'bg-white text-zinc-700 ring-1 ring-zinc-300', icon: Database },
}

/* ------------------------- thumbnail (+ safe placeholder) ------------------------- */

/** Cover image when available; a built-in placeholder otherwise — and when the file fails to load. */
function Thumb({ item, className }: { item: KaggleActivity; className?: string }) {
  const [failed, setFailed] = useState(false)
  const kind = normalizeKind(item.kind)
  const { icon: Icon } = KIND_STYLE[kind]
  const src = (item.image ?? '').trim()
  const showImage = !!src && !failed

  return (
    <div className={cn('relative aspect-[16/9] w-full overflow-hidden bg-zinc-100', className)}>
      {showImage ? (
        <img
          key={src}
          src={withBase(src)}
          alt={item.imageAlt || `${item.title} — Kaggle ${kind.toLowerCase()} thumbnail`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${kind} placeholder image`}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-50 via-white to-sky-100"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(15,118,110,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,118,110,0.10) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <span className="relative flex size-12 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <span className="relative text-xs font-semibold text-teal-800">Kaggle {kind}</span>
        </div>
      )}
    </div>
  )
}

function KindBadge({ kind, className }: { kind: KaggleKind; className?: string }) {
  const { badge, icon: Icon } = KIND_STYLE[kind]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm', badge, className)}>
      <Icon className="size-3" aria-hidden="true" />
      {kind}
    </span>
  )
}

/* --------------------------------- external links --------------------------------- */

function ItemLinks({ item, size = 'sm', className }: { item: KaggleActivity; size?: 'sm' | 'default'; className?: string }) {
  const kaggle = safeUrl(item.kaggleUrl)
  const repo = safeUrl(item.repoUrl)
  const label = item.title
  if (kaggle) {
    return (
      <Button asChild variant="outline" size={size} className={cn('border-teal-200 text-teal-800 hover:bg-teal-50 hover:text-teal-900', className)}>
        <a
          href={kaggle}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} — view on Kaggle (opens in a new tab)`}
          onClick={() => track('click_kaggle', `item:${item.repoName || item.title}`)}
        >
          <KaggleIcon className="size-3.5" />
          View on Kaggle
        </a>
      </Button>
    )
  }
  if (repo) {
    return (
      <Button asChild variant="outline" size={size} className={cn('border-zinc-300 text-zinc-800 hover:bg-zinc-50', className)}>
        <a
          href={repo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} — view code on GitHub (opens in a new tab)`}
          onClick={() => track('click_github', `item:${item.repoName || item.title}`)}
        >
          <Github className="size-3.5" aria-hidden="true" />
          View on GitHub
        </a>
      </Button>
    )
  }
  return null
}

/* ------------------------------------ section ------------------------------------ */

interface KaggleWorkProps {
  /** "home": capped selection + link to /kaggle. "full": every published item (the /kaggle page). */
  variant?: 'home' | 'full'
}

export default function KaggleWork({ variant = 'home' }: KaggleWorkProps) {
  const isFull = variant === 'full'
  const [active, setActive] = useState<KaggleActivity | null>(null)

  const all = kaggleActivities
  if (all.length === 0) return null // everything unpublished → no empty shell on the page
  const items = isFull ? all : selectForHome(all, HOME_LIMIT)
  const activeKind = active ? normalizeKind(active.kind) : null
  const activeRepo = active ? safeUrl(active.repoUrl) : null
  const activeKaggle = active ? safeUrl(active.kaggleUrl) : null

  return (
    <section
      id="kaggle-work"
      aria-labelledby="kaggle-work-heading"
      className={cn(isFull ? 'bg-white' : 'bg-zinc-50', 'py-14 md:py-20')}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div id="kaggle-work-heading">
          <SectionHeading
            eyebrow="Kaggle"
            title="Kaggle Competitions, Notebooks & Dataset Work"
            description="Hands-on data science in the open: competition entries, reproducible notebooks and dataset analyses, each linked to its public code. Rankings and results appear only where verified."
            moreHref={isFull ? undefined : '/kaggle'}
            moreLabel="All Kaggle work"
          />
        </div>

        <ul className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => {
            const kind = normalizeKind(item.kind)
            const chips = (item.tech?.length ? item.tech : item.skills) ?? []
            return (
              <motion.li
                key={`${item.repoName || item.title}-${i}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.07, ease: 'easeOut' }}
                className="min-w-0"
              >
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-[box-shadow,transform] hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative">
                    <Thumb item={item} />
                    <KindBadge kind={kind} className="absolute top-3 left-3" />
                    {item.featured ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-amber-950 shadow-sm">
                        <Star className="size-3 fill-current" aria-hidden="true" />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <p className="text-xs font-medium text-zinc-500">{item.year}</p>
                    <h3 className="mt-1 text-lg leading-snug font-semibold text-zinc-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                    {item.result?.trim() ? (
                      <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-teal-800">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                        <span>{item.result}</span>
                      </p>
                    ) : null}

                    {chips.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Technologies: ${chips.join(', ')}`}>
                        {chips.slice(0, 4).map((c) => (
                          <li key={c} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                            {c}
                          </li>
                        ))}
                        {chips.length > 4 ? (
                          <li className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">+{chips.length - 4}</li>
                        ) : null}
                      </ul>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-haspopup="dialog"
                        onClick={() => {
                          track('view_project', `kaggle:${item.repoName || item.title}`)
                          setActive(item)
                        }}
                        className="px-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                      >
                        View Details
                        <span className="sr-only"> of {item.title}</span>
                      </Button>
                      <ItemLinks item={item} />
                    </div>
                  </div>
                </article>
              </motion.li>
            )
          })}
        </ul>

        <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          <ShieldCheck className="size-4 shrink-0 text-teal-600" aria-hidden="true" />
          More on my
          <a
            href={social.kaggle}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_kaggle', 'kaggle-work-profile')}
            className="inline-flex items-center gap-0.5 font-medium text-teal-700 hover:text-teal-600"
          >
            Kaggle profile
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
          and in my
          <a
            href={social.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_github', 'kaggle-work-profile')}
            className="inline-flex items-center gap-0.5 font-medium text-teal-700 hover:text-teal-600"
          >
            public GitHub repositories
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
          .
        </p>
      </div>

      {/* Details dialog — header (fixed) → body (scrolls) → footer (pinned links) */}
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        {active && activeKind ? (
          <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="shrink-0 border-b border-zinc-100 px-5 pt-5 pb-4 text-left sm:px-6">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <KindBadge kind={activeKind} />
                <span className="text-xs font-medium text-zinc-500">{active.year}</span>
                {active.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    Featured
                  </span>
                ) : null}
              </div>
              <DialogTitle className="mt-2 text-xl leading-snug">{active.title}</DialogTitle>
              <DialogDescription className="mt-1">{active.description}</DialogDescription>
            </DialogHeader>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-6">
                <Thumb item={active} className="rounded-xl" />

                {active.result?.trim() ? (
                  <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-sm font-medium text-teal-900">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-teal-700">Verified result</p>
                      <p className="mt-0.5">{active.result}</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
                  {(active.detail?.trim() || active.description)
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>

                {active.skills.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Related skills</h4>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {active.skills.map((s) => (
                        <li key={s} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {active.tech && active.tech.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Technologies used</h4>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {active.tech.map((t) => (
                        <li key={t} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-800">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {activeKaggle || activeRepo ? (
              <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-100 bg-zinc-50 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-6">
                {activeKaggle ? (
                  <Button asChild className="h-11 flex-1 bg-teal-700 text-white hover:bg-teal-800">
                    <a
                      href={activeKaggle}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('click_kaggle', `dialog:${active.repoName || active.title}`)}
                    >
                      <KaggleIcon className="size-4" />
                      View on Kaggle
                    </a>
                  </Button>
                ) : null}
                {activeRepo ? (
                  <Button
                    asChild
                    variant={activeKaggle ? 'outline' : 'default'}
                    className={cn('h-11 flex-1', !activeKaggle && 'bg-teal-700 text-white hover:bg-teal-800')}
                  >
                    <a
                      href={activeRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('click_github', `dialog:${active.repoName || active.title}`)}
                    >
                      <Github className="size-4" aria-hidden="true" />
                      View code on GitHub
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  )
}
