'use client'


import { tx } from '@/lib/ui-text'
import { apiFetch } from '@/lib/api-client'
/**
 * FAQ (#faq) — light section between Pricing and Insights.
 *
 * Features:
 *  - Client-side search filter across all questions & answers (debounced,
 *    keyboard-accessible, aria-live result count, empty state with escape
 *    hatches: ask on WhatsApp / start a project).
 *  - Category filter chips (All / Services & Capabilities / Working Together /
 *    Communication & Legal) that compose with the search box.
 *  - Cross-link banner to #pricing for visitors deciding how to engage.
 *  - Per-answer "Was this helpful?" feedback (anonymous vote → /api/faq-feedback,
 *    remembered locally so the UI stays consistent on revisit).
 *  - Analytics: faq_search (once per session when query ≥ 3 chars),
 *    faq_filter (per chip selection), faq_feedback (per vote).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Link2,
  MessageCircle,
  RotateCcw,
  Search,
  SearchX,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'

import { faqs, faqCategories } from '@/config/profile'
import { scrollToId, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'
import { faqSlug } from '@/lib/slug'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import SectionHeading from '@/components/site/section-heading'

/** localStorage key remembering the visitor's per-answer feedback votes. */
const FAQ_VOTE_KEY = 'smfr-faq-voted-v1'

export default function FAQ() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('All')
  const [openItem, setOpenItem] = useState<string>('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, boolean>>({})
  const searchTrackedRef = useRef(false)

  /* Restore previous feedback votes so answers show the thanked state again. */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(FAQ_VOTE_KEY)
        if (raw) setVotes(JSON.parse(raw) as Record<string, boolean>)
      } catch {
        /* corrupted storage — start clean */
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  /** Record an anonymous helpfulness vote for one answer. */
  function voteFaq(slug: string, helpful: boolean) {
    if (votes[slug] !== undefined) return
    setVotes((prev) => {
      const next = { ...prev, [slug]: helpful }
      try {
        window.localStorage.setItem(FAQ_VOTE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — vote still recorded server-side */
      }
      return next
    })
    track('faq_feedback', `${slug}:${helpful ? 'up' : 'down'}`)
    apiFetch('/api/faq-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, helpful }),
    }).catch(() => {}) // non-critical
  }

  /* Deep link: open the item referenced by #faq-<slug> on load. */
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash.startsWith('faq-')) return
    const match = faqs.find((f) => faqSlug(f.q) === hash)
    if (!match) return
    const t = window.setTimeout(() => setOpenItem(hash), 0)
    return () => window.clearTimeout(t)
  }, [])

  const handleAccordionChange = (value: string) => {
    setOpenItem(value)
    // Keep the URL in sync so an open answer can be shared/copied directly.
    try {
      window.history.replaceState(
        null,
        '',
        value ? `#${value}` : window.location.pathname + window.location.search
      )
    } catch {
      /* history API unavailable — non-critical */
    }
  }

  /** Copy a shareable deep link to one answer. */
  function copyFaqLink(slug: string) {
    const url = `${window.location.origin}${window.location.pathname}#${slug}`
    const done = () => {
      track('copy_link', slug)
      setCopiedSlug(slug)
      window.setTimeout(() => setCopiedSlug(null), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done))
    } else {
      fallbackCopy(url, done)
    }
  }

  function fallbackCopy(text: string, done: () => void) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      done()
    } catch {
      /* clipboard unavailable — non-critical */
    }
  }

  // Debounced search tracking — fires once per session once the query is meaningful.
  useEffect(() => {
    if (query.trim().length < 3 || searchTrackedRef.current) return
    const t = setTimeout(() => {
      searchTrackedRef.current = true
      track('faq_search', `len:${query.trim().length}`)
    }, 900)
    return () => clearTimeout(t)
  }, [query])

  const normalized = query.trim().toLowerCase()
  const visibleFaqs = useMemo(() => {
    return faqs.filter((f) => {
      if (category !== 'All' && f.category !== category) return false
      if (!normalized) return true
      return (
        f.q.toLowerCase().includes(normalized) || f.a.toLowerCase().includes(normalized)
      )
    })
  }, [normalized, category])

  const selectCategory = (cat: string) => {
    if (cat === category) return
    setCategory(cat)
    track('faq_filter', cat)
  }

  const filterActive = category !== 'All' || normalized !== ''

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-zinc-50 py-14 md:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div id="faq-heading">
          <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
        </div>

        {/* ------------------------------ search ------------------------------ */}
        <div className="mt-8">
          <div className="group relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-teal-600"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search answers — e.g. files, NDA, pricing, timelines…"
              aria-label="Search frequently asked questions"
              className="h-12 w-full rounded-full border border-zinc-200 bg-white pl-11 pr-12 text-sm text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-center text-xs text-zinc-500">
            {filterActive
              ? `${visibleFaqs.length} of ${faqs.length} question${faqs.length === 1 ? '' : 's'} match${normalized ? ` "${query.trim().slice(0, 40)}"` : ''}${category !== 'All' ? ` in ${category}` : ''}`
              : `${faqs.length} answers — search or browse below`}
          </p>

          {/* -------------------------- category chips -------------------------- */}
          <div
            role="group"
            aria-label="Filter questions by category"
            className="mt-4 flex flex-wrap items-center justify-center gap-2"
          >
            {['All', ...faqCategories].map((cat) => {
              const active = category === cat
              const count =
                cat === 'All' ? faqs.length : faqs.filter((f) => f.category === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(cat)}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 md:text-[13px]',
                    active
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm shadow-teal-600/25 hover:bg-teal-500'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700'
                  )}
                >
                  {cat}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] leading-none tabular-nums',
                      active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ---------------------------- accordion ------------------------------ */}
        {visibleFaqs.length > 0 ? (
          <Accordion type="single" collapsible className="mt-6" value={openItem} onValueChange={handleAccordionChange}>
            {visibleFaqs.map((faq, i) => {
              const slug = faqSlug(faq.q)
              return (
              <motion.div
                key={faq.q}
                layout="position"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
              >
                <AccordionItem
                  value={slug}
                  id={slug}
                  className="mb-3 scroll-mt-24 rounded-xl border border-zinc-200 bg-white px-5 transition-all hover:border-teal-300 hover:shadow-sm data-[state=open]:border-teal-400 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="text-sm font-medium hover:no-underline md:text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-muted-foreground">
                    {faq.a}
                    {/* Footer row: shareable deep link + helpfulness feedback */}
                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-100 pt-3">
                      <button
                        type="button"
                        onClick={() => copyFaqLink(slug)}
                        aria-label={`Copy link to this answer: ${faq.q}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                      >
                        {copiedSlug === slug ? (
                          <>
                            <Check className="h-3 w-3 text-teal-600" aria-hidden="true" />
                            Link copied
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3 w-3" aria-hidden="true" />
                            Copy link to this answer
                          </>
                        )}
                      </button>

                      <span className="ml-auto flex items-center gap-2">
                        {votes[slug] === undefined ? (
                          <>
                            <span className="text-[11px] text-zinc-400">Was this answer helpful?</span>
                            <span className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => voteFaq(slug, true)}
                                aria-label="Yes, this answer was helpful"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-all hover:-translate-y-px hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 active:translate-y-0"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => voteFaq(slug, false)}
                                aria-label="No, this answer was not helpful"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-all hover:-translate-y-px hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 active:translate-y-0"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </span>
                          </>
                        ) : (
                          <span
                            role="status"
                            className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700"
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Thanks — feedback noted
                          </span>
                        )}
                      </span>
                    </span>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
              )
            })}
          </Accordion>
        ) : (
          /* --------------------------- empty state --------------------------- */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <SearchX className="h-6 w-6 text-zinc-400" aria-hidden="true" />
            </div>
            <p className="mt-4 font-semibold text-zinc-900">
              {normalized
                ? `No answer matches “${query.trim().slice(0, 60)}”`
                : `No questions in “${category}” match that`}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Your question is probably one message away — ask directly.
            </p>
            {category !== 'All' ? (
              <button
                type="button"
                onClick={() => selectCategory('All')}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Show all {faqs.length} questions
              </button>
            ) : null}
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button className="h-10" asChild>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_whatsapp', 'faq-empty-state')}
                >
                  <MessageCircle aria-hidden />
                  Ask on WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                className="h-10"
                onClick={() => scrollToId('start-project')}
              >
                {tx('Start a Project')}
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ------------------- cross-link: choosing an engagement ------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="mt-6"
        >
          <button
            type="button"
            onClick={() => {
              track('view_pricing', 'faq-cross-link')
              scrollToId('pricing')
            }}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-white p-5 text-left shadow-sm transition-all hover:border-teal-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 md:p-6"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-900 md:text-base">
                Not sure which engagement fits your project?
              </span>
              <span className="mt-1 block text-xs text-zinc-500 md:text-sm">
                Compare fixed-scope, hourly and monthly options — every path starts with a free
                scoping call.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-teal-500 md:text-sm">
              Compare pricing
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </motion.div>

        {/* ---------------------------- still stuck? ---------------------------- */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <p className="text-sm text-zinc-600">Still have questions?</p>
          <Button className="h-11" asChild>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('click_whatsapp', 'faq')}
            >
              <MessageCircle aria-hidden />
              Ask on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
