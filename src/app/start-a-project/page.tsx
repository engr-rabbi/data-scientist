import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import StartProject from '@/components/site/start-project'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/start-a-project')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/start-a-project',
  keywords: [
    'hire machine learning engineer',
    'start AI project',
    'data project inquiry',
    'freelance data scientist hire',
  ],
})

export default function StartAProjectPage() {
  return (
    <PageShell
      path="/start-a-project"
      label="Start a Project"
      h1="Tell Me About Your Project"
      lede="Send the brief — data analytics, machine learning, forecasting, dashboards, a RAG assistant or AI automation — with files attached if you have them. You will get a scoped, honest reply on fit, effort and timeline before any commitment."
      related={['/services', '/book-a-call', '/contact']}
      cta={false}
    >
      <StartProject showHeading={false} />
    </PageShell>
  )
}
