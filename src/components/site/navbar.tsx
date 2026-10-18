'use client'

import { withBase } from '@/lib/base-path'
import { useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Mail, Menu, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { homeOnlyLinks, navLinks, profile, sitePages } from '@/config/profile'
import { tx } from '@/lib/ui-text'
import { SECTION_TO_PAGE, mailLink, openStartProject, scrollToId, telLink, waLink } from '@/lib/links'
import { track } from '@/lib/analytics'

// Condensed role for the tiny line under the name (derived from config title).
const NAV_ROLE = profile.title.replace('Machine Learning', 'ML').replace(/\|/g, '·')

// Homepage-only sections — no dedicated page, reachable from inner pages
// via the homepage anchor.
const HOME_ONLY_SECTIONS = homeOnlyLinks

export default function Navbar() {
  const pathname = usePathname()
  const onHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  // Dark text/controls: on a solid bar, and on the homepage where the bar floats over the LIGHT hero.
  // Inner pages keep their dark page-header, so there the un-scrolled bar keeps light text.
  const darkText = scrolled || onHome
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Shared scrolled state (navbar chrome) — active on every page.
    const onScrollChrome = () => setScrolled(window.scrollY > 40)
    onScrollChrome()
    window.addEventListener('scroll', onScrollChrome, { passive: true })
    return () => window.removeEventListener('scroll', onScrollChrome)
  }, [])

  useEffect(() => {
    // Scroll-spy only makes sense on the homepage (the only page with sections).
    // On inner pages activeId stays stale but is never read (nav active state
    // there is derived from the pathname instead).
    if (!onHome) return
    const SECTION_IDS = navLinks.map((l) => l.href.replace('#', ''))
    const onScroll = () => {
      const y = window.scrollY
      const pos = y + 140
      let current = ''
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= pos) current = id
      }
      const doc = document.documentElement
      if (SECTION_IDS.length > 0 && window.innerHeight + y >= doc.scrollHeight - 8) {
        current = SECTION_IDS[SECTION_IDS.length - 1]
      }
      setActiveId(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onHome])

  const handleNav = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToId(href)
  }

  const startProject = () => {
    track('start_project', 'navbar')
    openStartProject()
  }

  const linkTone = darkText ? 'text-zinc-600 hover:text-teal-700' : 'text-white/70 hover:text-teal-300'
  const activeTone = darkText ? 'text-teal-700' : 'text-teal-300'
  const activeRule = darkText ? 'after:bg-teal-600' : 'after:bg-teal-400'
  const triggerTone = darkText
    ? 'text-zinc-600 hover:text-teal-700 data-[state=open]:text-teal-700'
    : 'text-white/70 hover:text-teal-300 data-[state=open]:text-teal-300'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        {/* Brand — back to homepage */}
        <Link
          href="/"
          onClick={onHome ? (e) => { e.preventDefault(); scrollToId('#home') } : undefined}
          aria-label="Back to homepage"
          className="flex min-h-10 items-center gap-3 text-left"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-[11px] font-bold tracking-wider text-white shadow-md shadow-teal-600/25"
          >
            {profile.initials}
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className={`hidden text-sm font-semibold sm:block ${darkText ? 'text-zinc-900' : 'text-white'}`}>
              {profile.name}
            </span>
            <span className={`text-sm font-semibold sm:hidden ${darkText ? 'text-zinc-900' : 'text-white'}`}>
              {profile.shortName}
            </span>
            <span
              className={`hidden text-[10px] tracking-wide whitespace-nowrap lg:block ${
                darkText ? 'text-zinc-500' : 'text-white/50'
              }`}
            >
              {NAV_ROLE}
            </span>
          </span>
        </Link>

        {/* Desktop links — anchors on the homepage, dedicated pages elsewhere */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const id = link.href.replace('#', '')
            const pageHref = SECTION_TO_PAGE[id] ?? '/'
            const active = onHome ? activeId === id : pathname === pageHref
            const className = `relative inline-flex min-h-10 items-center px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-2.5 after:h-0.5 after:rounded-full ${
              active ? `${activeTone} ${activeRule} after:content-['']` : `${linkTone} after:content-[''] after:bg-transparent`
            }`
            return (
              <li key={link.href}>
                {onHome ? (
                  <a
                    href={withBase(link.href)}
                    onClick={handleNav(link.href)}
                    aria-current={active ? 'true' : undefined}
                    className={className}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link href={pageHref} aria-current={active ? 'page' : undefined} className={className}>
                    {link.label}
                  </Link>
                )}
              </li>
            )
          })}

          {/* All dedicated pages */}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`inline-flex min-h-10 items-center gap-1 px-3 text-sm font-medium outline-none transition-colors ${triggerTone}`}
              >
                {tx('Pages')}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[75vh] w-64 overflow-y-auto rounded-xl border-zinc-200 p-1.5">
                <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  {tx('Dedicated pages')}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/" className="cursor-pointer">{tx('Home')}</Link>
                </DropdownMenuItem>
                {sitePages.map((page) => (
                  <DropdownMenuItem key={page.href} asChild className="rounded-lg">
                    <Link href={page.href} className="cursor-pointer">
                      <span className="flex w-full items-center justify-between gap-2">
                        {page.navLabel ?? page.label}
                        <span className="max-w-[11rem] truncate text-xs text-zinc-400">{page.blurb}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        {/* Right: availability status + CTA + mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Availability status pill (desktop only) */}
          {onHome ? (
            <button
              type="button"
              onClick={startProject}
              title="Currently accepting new projects — click to start yours"
              className={`hidden min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors xl:inline-flex ${
                darkText
                  ? 'border-teal-600/25 bg-teal-50 text-teal-800 hover:border-teal-600/50 hover:bg-teal-100'
                  : 'border-white/15 bg-white/5 text-teal-100 hover:border-teal-400/40 hover:bg-white/10'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50`}
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Available for projects
            </button>
          ) : null}
          {onHome ? (
            <Button
              size="sm"
              onClick={startProject}
              className="hidden h-9 rounded-lg bg-teal-600 px-4 font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 sm:inline-flex"
            >
              {tx('Start a Project')}
            </Button>
          ) : (
            <Button
              size="sm"
              asChild
              className="hidden h-9 rounded-lg bg-teal-600 px-4 font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 sm:inline-flex"
            >
              <Link href="/start-a-project">{tx('Start a Project')}</Link>
            </Button>
          )}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              onClick={() => setOpen(true)}
              className={`h-11 w-11 ${darkText ? 'text-zinc-900 hover:bg-zinc-100' : 'text-white hover:bg-white/10'}`}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 gap-0">
          <SheetHeader className="border-b border-zinc-100 pb-3">
            <SheetTitle className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-[10px] font-bold tracking-wider text-white"
              >
                {profile.initials}
              </span>
              <span className="text-sm">{profile.shortName}</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Site navigation menu</SheetDescription>
          </SheetHeader>

          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-4 py-3">
            {/* Dedicated pages */}
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
              {tx('Pages')}
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  aria-current={onHome ? 'page' : undefined}
                  className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-teal-50 hover:text-teal-700 ${
                    onHome ? 'text-teal-700' : 'text-zinc-700'
                  }`}
                >
                  Home
                </Link>
              </li>
              {sitePages.map((page) => {
                const active = pathname === page.href
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-teal-50 hover:text-teal-700 ${
                        active ? 'text-teal-700' : 'text-zinc-700'
                      }`}
                    >
                      {page.navLabel ?? page.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Homepage-only sections */}
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
              On the homepage
            </p>
            <ul className="space-y-1">
              {HOME_ONLY_SECTIONS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-zinc-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Button asChild className="mt-3 h-11 w-full rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-500">
              <Link href="/start-a-project" onClick={() => setOpen(false)}>
                {tx('Start a Project')}
              </Link>
            </Button>
          </nav>

          <div className="border-t border-zinc-100 p-3">
            <p className="mb-2 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Get in touch
            </p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_whatsapp', 'navbar')}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-600/40 hover:bg-teal-50 hover:text-teal-700"
              >
                <MessageCircle className="h-4 w-4 text-teal-600" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={telLink()}
                onClick={() => track('click_phone', 'navbar')}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-600/40 hover:bg-teal-50 hover:text-teal-700"
              >
                <Phone className="h-4 w-4 text-teal-600" aria-hidden="true" />
                Call
              </a>
              <a
                href={mailLink()}
                onClick={() => track('click_email', 'navbar')}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 transition-colors hover:border-teal-600/40 hover:bg-teal-50 hover:text-teal-700"
              >
                <Mail className="h-4 w-4 text-teal-600" aria-hidden="true" />
                Email
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
