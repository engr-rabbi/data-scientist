import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import BookACall from '@/components/site/book-a-call'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/book-a-call')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/book-a-call',
  keywords: [
    'book data science call',
    'free consultation machine learning',
    'discovery call data scientist',
  ],
})

export default function BookACallPage() {
  return (
    <PageShell
      path="/book-a-call"
      label="Book a Call"
      h1="Book a Free Discovery Call"
      lede="Thirty minutes, in your own timezone, at no charge — enough to talk through the data problem and see whether there is a fit. Pick a slot below and propose a time before committing to anything."
      related={['/start-a-project', '/contact', '/about']}
      cta={false}
    >
      <BookACall />
    </PageShell>
  )
}
