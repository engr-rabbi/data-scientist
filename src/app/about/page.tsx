import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import AboutIntro from '@/components/site/about-intro'
import AchievementStats from '@/components/site/achievement-stats'
import KaggleActivities from '@/components/site/kaggle-activities'
import ExpertiseAreas from '@/components/site/expertise-areas'
import CertificationsStrip from '@/components/site/certifications-strip'
import CareerJourney from '@/components/site/career-journey'
import ProjectsHandle from '@/components/site/projects-handle'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/about')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/about',
  keywords: [
    'data scientist achievements',
    'machine learning engineer expertise',
    'freelance data scientist',
    'remote data scientist',
    'data science consultant',
    'data analytics and BI specialist',
    'AI automation engineer',
  ],
})

/**
 * /about — professional achievement & expertise showcase (not a biography).
 * Flow: what I do → what I have achieved (verified numbers) → verified Kaggle
 * work → what I can do → credentials → the learning journey → project types.
 */
export default function AboutPage() {
  return (
    <PageShell
      path="/about"
      label="About"
      h1="Data Scientist & ML Engineer — Real Work, Verified Skills, Practical AI"
      lede="What I have done → what I have learned → what I can do → what I can handle for you. Practical data science and machine learning, analytics & BI delivery, deep learning and AI automation — every claim backed by public code or the CV."
      related={['/experience', '/certifications', '/projects', '/contact']}
    >
      <AboutIntro />
      <AchievementStats />
      <KaggleActivities variant="compact" />
      <ExpertiseAreas />
      <CertificationsStrip />
      <CareerJourney />
      <ProjectsHandle />
    </PageShell>
  )
}
