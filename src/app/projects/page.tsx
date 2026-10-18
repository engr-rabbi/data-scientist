import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Projects from '@/components/site/projects'
import DemoShowcase from '@/components/site/demo-showcase'
import { StoryFlow } from '@/components/site/story-flow'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/projects')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description:
    'A data science portfolio spanning customer churn prediction using machine learning, sales forecasting with Python, Power BI business intelligence dashboards, RAG-based document AI assistants and AI workflow automation — every project presented as a problem → solution case study on public or synthetic data.',
  path: '/projects',
  keywords: [
    'data science portfolio',
    'machine learning projects python',
    'customer churn prediction machine learning',
    'sales forecasting python',
    'power bi business intelligence dashboards',
    'rag document ai assistant',
    'ai workflow automation',
    'deep learning project examples',
    'predictive modeling portfolio',
  ],
})

export default function ProjectsPage() {
  return (
    <PageShell
      path="/projects"
      label="Projects"
      h1="Data Science & Machine Learning Projects"
      lede="Portfolio entries spanning customer churn prediction using machine learning, sales forecasting with Python, Power BI business intelligence dashboards, RAG-based document AI assistants and AI workflow automation. Each one is presented as a compact case study — the problem, the solution, my role and the technology — and every build runs on public or synthetic datasets until client work can be published with permission."
      related={['/case-studies', '/services', '/kaggle', '/start-a-project']}
    >
      {/* The problem → solution path behind every project below */}
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 md:pt-14">
        <StoryFlow />
      </div>
      <Projects />
      <DemoShowcase />
    </PageShell>
  )
}
