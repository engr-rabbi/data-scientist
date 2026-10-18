import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import CaseStudies from '@/components/site/case-studies'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/case-studies')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description:
    'Data science case studies told as complete stories: the business problem, the data behind it, the analysis, the machine learning model, the visualization and the business solution — with data-quality notes and honest limitations included.',
  path: '/case-studies',
  keywords: [
    'data science case studies',
    'machine learning case study',
    'customer churn prediction case study',
    'sales forecasting case study python',
    'business analytics case study',
  ],
})

export default function CaseStudiesPage() {
  return (
    <PageShell
      path="/case-studies"
      label="Case Studies"
      h1="Case Studies — How the Work Gets Done"
      lede="Every case study here follows one storyline: a business problem, the data available, the analysis and machine learning applied to it, the visualization that made it readable, and the business solution it enables — with limitations stated plainly. Pick a study below and follow the full problem → solution path."
      related={['/projects', '/services', '/start-a-project']}
    >
      <CaseStudies />
    </PageShell>
  )
}
