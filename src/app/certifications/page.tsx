import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import CredentialsExplorer from '@/components/site/credentials-explorer'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/certifications')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/certifications',
  keywords: [
    'IBM data science certification',
    'PRINCE2 certified project manager',
    'big data FusionInsight training',
    'machine learning certification',
    'professional training data science',
  ],
})

export default function CertificationsPage() {
  return (
    <PageShell
      path="/certifications"
      label="Certifications & Training"
      h1="Certifications & Professional Training"
      lede="Verified credentials across data science, machine learning, big data and project management — categorized and explained, sourced only from the verified CV."
      related={['/about', '/skills', '/experience', '/contact']}
    >
      <CredentialsExplorer />
    </PageShell>
  )
}
