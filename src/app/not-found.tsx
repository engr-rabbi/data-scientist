import Link from 'next/link'
import { ArrowLeft, Compass, SearchX } from 'lucide-react'

import Navbar from '@/components/site/navbar'
import Footer from '@/components/site/footer'
import { profile, sitePages } from '@/config/profile'

export const metadata = {
  title: 'Page Not Found (404)',
  description: `The page you are looking for does not exist. Explore ${profile.name}'s data science, machine learning and AI services, projects and contact options instead.`,
  robots: { index: false, follow: true },
}

export default function NotFound() {
  // A few popular destinations for the recovery path.
  const popular = ['/about', '/services', '/projects', '/contact']

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <meta name="robots" content="noindex, follow" />
      <Navbar />

      <main className="relative flex flex-1 items-center overflow-hidden bg-zinc-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-2xl px-4 py-28 text-center sm:px-6">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <SearchX className="h-6 w-6 text-teal-300" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-semibold tracking-widest text-teal-400 uppercase">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            This page took a wrong turn in the pipeline
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/60">
            The page you are looking for doesn&apos;t exist or has moved. Let&apos;s get you back to
            the data.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors hover:bg-teal-500"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Homepage
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Me
            </Link>
          </div>

          <div className="mt-10">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-white/40 uppercase">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              Popular pages
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {sitePages
                .filter((p) => popular.includes(p.href))
                .map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className="inline-flex min-h-9 items-center rounded-full border border-white/10 bg-white/5 px-3.5 text-sm text-white/70 transition-colors hover:border-teal-400/40 hover:text-teal-300"
                    >
                      {p.navLabel ?? p.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
