import type { Metadata } from 'next'
import { pageSeo, profile, seo as seoConfig } from '@/config/profile'

/**
 * Metadata factory for every dedicated page — guarantees each route gets a
 * unique title, meta description, canonical URL and Open Graph/Twitter cards
 * (Google Search Console readiness). The root layout supplies the
 * `%s | Shah Muhammad Fazle Rabbi` title template and metadataBase.
 */
export function buildMetadata({
  title,
  description,
  path,
  keywords,
  image = '/og-image.png',
}: {
  title: string
  description: string
  /** Canonical path, e.g. '/about' (never a fragment). */
  path: string
  keywords?: string[]
  image?: string
}): Metadata {
  const url = path === '/' ? '/' : path.replace(/\/+$/, '') || '/'
  // Admin-controlled SEO overrides (Admin → Content → pageSeo) win over the defaults.
  const o = pageSeo[url]
  title = o?.title || title
  description = o?.description || description
  keywords = o?.keywords?.length ? o.keywords : keywords
  image = o?.image || image
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: seoConfig.siteName,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: image,
          width: 1344,
          height: 768,
          alt: `${profile.name} — ${profile.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
