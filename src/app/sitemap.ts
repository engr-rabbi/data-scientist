import type { MetadataRoute } from 'next'
import { caseStudies, profile, sitePages } from '@/config/profile'

export const dynamic = 'force-static'

/**
 * XML sitemap with ONLY indexable, canonical URLs:
 * - the homepage,
 * - every dedicated page (unique URL per major section),
 * - every case-study page.
 * (Fragment URLs such as /#faq-… are NOT listed: search engines ignore the
 * fragment, so they would only be duplicates of the homepage.)
 * The /admin panel is deliberately excluded (noindex + robots.txt).
 */
const PAGE_PRIORITY: Record<string, number> = {
  '/about': 0.9,
  '/services': 0.9,
  '/start-a-project': 0.9,
  '/projects': 0.8,
  '/case-studies': 0.8,
  '/book-a-call': 0.8,
  '/skills': 0.7,
  '/experience': 0.7,
  '/certifications': 0.7,
  '/contact': 0.7,
  '/kaggle': 0.6,
  '/testimonials': 0.6,
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.siteUrl
  const now = new Date()

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Dedicated pages — independently indexable
    ...sitePages.map((page) => ({
      url: `${base}${page.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: PAGE_PRIORITY[page.href] ?? 0.6,
    })),
    // Case studies — project-level deep pages, each independently searchable
    ...caseStudies.map((cs) => ({
      url: `${base}/case-studies/${cs.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
