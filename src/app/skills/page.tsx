import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Skills from '@/components/site/skills'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/skills')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/skills',
  keywords: [
    'python data scientist skills',
    'sql power bi skills',
    'tensorflow keras skills',
    'data analyst toolbox',
  ],
})

export default function SkillsPage() {
  return (
    <PageShell
      path="/skills"
      label="Skills"
      h1="Skills & Toolbox"
      lede="Only tools backed by real training and project work appear here: Python, SQL, TensorFlow/Keras, Power BI, RAG and LLM automation, plus PRINCE2 delivery discipline. If something is not listed, it is not yet a skill I would charge for."
      related={['/certifications', '/projects', '/experience', '/start-a-project']}
    >
      <Skills />
    </PageShell>
  )
}
