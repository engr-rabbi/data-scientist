/**
 * Stable, URL-safe ids used for #hash deep links.
 * Shared by the FAQ section (client), JSON-LD and the sitemap (server),
 * so anchors never drift between surfaces.
 */

export function faqSlug(question: string): string {
  return (
    'faq-' +
    question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}
