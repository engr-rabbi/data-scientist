import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Testimonials from '@/components/site/testimonials'
import { sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/testimonials')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: '/testimonials',
  keywords: [
    'freelance data scientist reviews',
    'client testimonials data analytics',
  ],
})

export default function TestimonialsPage() {
  return (
    <PageShell
      path="/testimonials"
      label="Testimonials"
      h1="What Clients & Colleagues Say"
      lede="An honest feedback policy: real quotes only, collected after real collaborations, published with permission. Until those exist, anything shown here is explicitly labeled as a placeholder — never presented as a real endorsement."
      related={['/case-studies', '/services', '/contact']}
    >
      <Testimonials />
    </PageShell>
  )
}
