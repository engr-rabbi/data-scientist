import type { MetadataRoute } from 'next'
import { profile } from '@/config/profile'

export const dynamic = 'force-static'

/** robots.txt — everything public is crawlable; the admin panel is not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/'] }],
    sitemap: `${profile.siteUrl}/sitemap.xml`,
    host: profile.siteUrl,
  }
}
