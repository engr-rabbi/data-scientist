import { tx } from '@/lib/ui-text'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'

import Navbar from '@/components/site/navbar'
import Footer from '@/components/site/footer'
import FloatingContact from '@/components/site/floating-contact'
import { profile, sitePages } from '@/config/profile'

interface PageShellProps {
  /** Canonical path for JSON-LD + breadcrumb, e.g. '/about'. */
  path: string
  /** Breadcrumb leaf label, e.g. 'About'. */
  label: string
  /** Page <h1>. */
  h1: string
  /** Lede paragraph shown under the h1. */
  lede: string
  children: React.ReactNode
  /** hrefs (into sitePages) featured in the "Keep exploring" grid. */
  related?: string[]
  /** Render the closing CTA band (default true — disable on form pages). */
  cta?: boolean
}

/**
 * Shared skeleton for every dedicated page:
 * navbar → dark page-hero (breadcrumb + h1 + lede) → page content →
 * related-page internal links → closing CTA → footer + floating contact.
 * Emits BreadcrumbList + WebPage JSON-LD for Google Search Console.
 */
export default function PageShell({
  path,
  label,
  h1,
  lede,
  children,
  related,
  cta = true,
}: PageShellProps) {
  const canonical = `${profile.siteUrl}${path === '/' ? '' : path}`
  const pageTitle = sitePages.find((p) => p.href === path)?.title ?? h1

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: profile.siteUrl },
      { '@type': 'ListItem', position: 2, name: label, item: canonical },
    ],
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    headline: h1,
    description: lede,
    url: canonical,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Shah Muhammad Fazle Rabbi — Data Science, ML & AI',
      url: profile.siteUrl,
    },
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    about: {
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.title,
      url: profile.siteUrl,
    },
  }

  const relatedPages = (related ?? [])
    .map((href) => sitePages.find((p) => p.href === href))
    .filter((p): p is (typeof sitePages)[number] => Boolean(p))

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Navbar />

      {/* Page hero — mirrors the homepage hero identity (dark + teal glow). */}
      <header className="relative overflow-hidden bg-zinc-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_20%,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6 md:pt-28 md:pb-14">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/50">
              <li>
                <Link
                  href="/"
                  className="inline-flex min-h-6 items-center rounded transition-colors hover:text-teal-300"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5 text-white/30" />
              </li>
              <li>
                <span aria-current="page" className="font-medium text-teal-300">
                  {label}
                </span>
              </li>
            </ol>
          </nav>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl xl:text-[2.75rem] xl:leading-[1.15]">
            {h1}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
            {lede}
          </p>
        </div>
        {/* Fade into the first page section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent"
        />
      </header>

      <main id="main-content" className="flex-1">
        {children}

        {/* Related pages — internal linking between every dedicated page */}
        {relatedPages.length > 0 ? (
          <section aria-labelledby="related-pages" className="border-t border-zinc-100 bg-white py-10 md:py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2
                id="related-pages"
                className="text-xs font-semibold tracking-widest text-teal-600 uppercase"
              >
                Keep exploring
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 transition-colors group-hover:text-teal-700">
                          {page.label}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {page.blurb}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-600"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Closing CTA band */}
        {cta ? (
          <section aria-labelledby="page-cta" className="relative overflow-hidden bg-teal-700 text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14) 0, transparent 34%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.1) 0, transparent 30%)',
              }}
            />
            <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between md:py-12">
              <div>
                <h2 id="page-cta" className="text-2xl font-bold tracking-tight md:text-3xl">
                  {profile.finalCta}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                  Tell me about your data, analytics or AI problem — you&apos;ll get a scoped, honest
                  answer, not a sales pitch.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/start-a-project"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-teal-700 shadow-md transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {tx('Start a Project')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/book-a-call"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/40 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Book a Free Call
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
      <FloatingContact />
    </div>
  )
}
