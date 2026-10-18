import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import KaggleWork from '@/components/site/kaggle-work'
import KaggleFeature from '@/components/site/kaggle-feature'
import Platforms from '@/components/site/platforms'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/kaggle')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/kaggle',
  keywords: [
    'kaggle competitions portfolio',
    'kaggle notebook github',
    'titanic machine learning kaggle',
    'house prices regression kaggle',
    'data science notebooks python',
  ],
})

/**
 * /kaggle — verified Kaggle & open data science work: every published activity as an
 * image card (same cards as the homepage section), the honest feature band, then all professional
 * profiles. Participation and code only — no ranks or medals claimed.
 */
export default function KagglePage() {
  return (
    <PageShell
      path="/kaggle"
      label="Kaggle & Profiles"
      h1="Kaggle Competitions, Notebooks & Dataset Work"
      lede="Eight verified activities: four competitions, three open notebooks and one published dataset analysis — each mirrored as a public GitHub repository. Participation and code only; no ranks or medals claimed."
      related={['/projects', '/skills', '/experience', '/contact']}
    >
      <KaggleWork variant="full" />
      <KaggleFeature />
      <Platforms />
    </PageShell>
  )
}
