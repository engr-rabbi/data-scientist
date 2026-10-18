import type { Metadata } from 'next'

import PageShell from '@/components/site/page-shell'
import Contact from '@/components/site/contact'
import { profile, sitePages } from '@/config/profile'
import { buildMetadata } from '@/lib/seo'

const page = sitePages.find((p) => p.href === '/contact')!

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: `WhatsApp or Telegram for the fastest reply, email ${profile.email} for detailed briefs — every channel reaches the same desk in Dhaka (GMT+6).`,
  path: '/contact',
  keywords: [
    'hire data scientist',
    'contact machine learning engineer',
    'freelance data science consultant',
    'WhatsApp data scientist',
    'remote data scientist contact',
  ],
})

export default function ContactPage() {
  return (
    <PageShell
      path="/contact"
      label="Contact"
      h1="Contact — Let's Talk Data"
      lede={`Message me on WhatsApp or Telegram for the fastest reply, email ${profile.email} with a detailed brief, or use the form — every channel reaches the same desk in Dhaka (GMT+6), working with clients worldwide.`}
      related={['/start-a-project', '/book-a-call', '/about']}
      cta={false}
    >
      <Contact />
    </PageShell>
  )
}
