'use client'

import { tx } from '@/lib/ui-text'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Share2,
  Tag,
  PenLine,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/site/section-heading'
import { insights, type InsightArticle } from '@/config/profile'
import { dispatchPrefill, scrollToId } from '@/lib/links'
import { track } from '@/lib/analytics'

/** Map article category → service id (the established prefill-service contract). */
const CATEGORY_TO_SERVICE: Record<string, string> = {
  'Data Analytics': 'data-analytics-bi',
  'Power BI & BI': 'data-analytics-bi',
  'Machine Learning': 'ml-predictive',
  'AI & LLM': 'ai-llm-rag',
}

/**
 * Insights / editorial section (brief §55-56).
 * Config-driven articles rendered as cards; full article opens in a dialog
 * (single-route constraint). Ends with the required article CTA.
 */
export default function Insights() {
  const [open, setOpen] = useState<InsightArticle | null>(null)
  const [copied, setCopied] = useState(false)

  /* Deep link: #article-<slug> opens the article directly (shareable URLs). */
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash.startsWith('article-')) return
    const slug = hash.replace('article-', '')
    const match = insights.find((a) => a.slug === slug)
    if (!match) return
    const t = window.setTimeout(() => {
      setOpen(match)
      track('view_article', `${match.slug} (deep-link)`)
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  /** Sync the hash while the dialog opens/closes. */
  const setArticle = (a: InsightArticle | null) => {
    setOpen(a)
    try {
      window.history.replaceState(
        null,
        '',
        a ? `#article-${a.slug}` : window.location.pathname + window.location.search
      )
    } catch {
      /* history API unavailable — non-critical */
    }
  }

  /** Copy a shareable deep link to the currently open article. */
  function copyArticleLink() {
    if (!open) return
    const url = `${window.location.origin}${window.location.pathname}#article-${open.slug}`
    const done = () => {
      track('copy_link', `insight-${open.slug}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done)
    } else {
      done()
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return d
    }
  }

  const openArticle = (a: InsightArticle) => {
    setArticle(a)
    track('view_article', a.slug)
  }

  return (
    <section id="insights" aria-labelledby="insights-heading" className="py-14 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionHeading
          eyebrow="Insights"
          title="Notes From the Field"
          description="Practical writing on data analytics, machine learning and applied AI — the same thinking I bring to client projects."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 md:mt-10">
          {insights.map((article, i) => (
            <motion.article
              key={article.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group"
            >
              <button
                onClick={() => openArticle(article)}
                className="text-left w-full h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-teal-300 transition-all duration-300 flex flex-col focus-visible:outline-2 focus-visible:outline-teal-600"
                aria-label={`Read article: ${article.title}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-50 font-medium">
                    {article.category}
                  </Badge>
                  <ArrowUpRight
                    className="w-4 h-4 text-zinc-300 group-hover:text-teal-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="font-semibold text-zinc-900 leading-snug text-[1.05rem] group-hover:text-teal-800 transition-colors">
                  {article.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="mt-auto pt-5 flex items-center gap-3 text-xs text-zinc-400 border-t border-zinc-100 mt-5">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatDate(article.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {article.readTime}
                  </span>
                </div>
              </button>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground mt-8 inline-flex items-center gap-2 w-full justify-center"
        >
          <PenLine className="w-4 h-4 text-teal-600" aria-hidden="true" />
          New articles are added as projects and experiments progress.
        </motion.p>
      </div>

      {/* Article reader dialog */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar sm:rounded-2xl">
          {open && (
            <article>
              <DialogHeader className="text-left">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                    {open.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {formatDate(open.date)}
                  </span>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {open.readTime}
                  </span>
                </div>
                <DialogTitle className="text-2xl md:text-[1.7rem] font-bold tracking-tight text-zinc-900 leading-tight text-left">
                  {open.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Article in {open.category} — {open.readTime}.
                </DialogDescription>
              </DialogHeader>

              <p className="text-zinc-600 leading-relaxed border-l-2 border-teal-500 pl-4 italic my-5">
                {open.excerpt}
              </p>

              <div className="space-y-7 mt-6">
                {open.sections.map((section, si) => (
                  <div key={si}>
                    <h4 className="flex items-center gap-2 font-semibold text-zinc-900 mb-2.5">
                      <BookOpen className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
                      {section.heading}
                    </h4>
                    {section.body.map((p, pi) => (
                      <p key={pi} className="text-sm text-zinc-600 leading-relaxed mb-2.5">
                        {p}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="space-y-2 mt-3">
                        {section.bullets.map((b, bi) => (
                          <li
                            key={bi}
                            className="flex items-start gap-2.5 text-sm text-zinc-600 leading-relaxed"
                          >
                            <ArrowRight
                              className="w-4 h-4 text-teal-600 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-7">
                {open.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 text-zinc-500 rounded-full px-2.5 py-1"
                  >
                    <Tag className="w-3 h-3" aria-hidden="true" />
                    {t}
                  </span>
                ))}
              </div>

              {/* Required article-ending CTA (brief §56) */}
              <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm font-medium text-teal-900">
                  Need help with a similar project?
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    const service = CATEGORY_TO_SERVICE[open.category]
                    setArticle(null)
                    track('start_project', `insight-${open.slug}`)
                    if (service) {
                      dispatchPrefill('service', service)
                    } else {
                      setTimeout(() => scrollToId('start-project'), 60)
                    }
                  }}
                >
                  {tx('Start a Project')}
                  <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>

              {/* Share this article (deep link) */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-400">Found this useful? Share it with your team.</p>
                <button
                  type="button"
                  onClick={copyArticleLink}
                  aria-label="Copy link to this article"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
                      Link copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy article link
                    </>
                  )}
                </button>
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
