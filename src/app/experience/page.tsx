import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Experience from '@/components/site/experience'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/experience')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/experience',
  keywords: [
    'data scientist experience Bangladesh',
    'telecom engineer career change',
    'freelance machine learning engineer',
  ],
})

export default function ExperiencePage() {
  return (
    <PageShell
      path="/experience"
      label="Experience"
      h1="Professional Experience"
      lede="Telecom engineering at Teletalk Bangladesh, international engineering delivery in the UAE, and an independent data science, ML and AI practice — told as one continuous story rather than disconnected jobs. Each chapter added a layer that the next one builds on."
      related={['/about', '/certifications', '/skills', '/contact']}
    >
      <Experience />
    </PageShell>
  )
}
