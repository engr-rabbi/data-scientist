import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Services from '@/components/site/services'
import WhatICanSolve from '@/components/site/what-i-can-solve'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/services')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/services',
  keywords: [
    'data analytics services',
    'machine learning services',
    'Power BI dashboard developer',
    'AI automation services',
    'RAG assistant development',
  ],
})

export default function ServicesPage() {
  return (
    <PageShell
      path="/services"
      label="Services"
      h1="Data Science & AI Services"
      lede="Focused engagements with a clear problem → process → deliverable structure. Every service below is delivered end to end — from understanding the business question to handover and documentation."
      related={['/projects', '/case-studies', '/skills', '/start-a-project']}
    >
      <Services />
      <WhatICanSolve />
    </PageShell>
  )
}
