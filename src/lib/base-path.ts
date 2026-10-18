/**
 * Sub-path hosting support (GitHub Pages "project sites": https://user.github.io/<repo>/).
 *
 * next.config.ts derives the base path from NEXT_PUBLIC_SITE_URL (its path part) and exposes it here.
 * Next.js prefixes <Link>, scripts, styles and fonts by itself; plain <img src="/…">, <a href="/…">
 * and window.location need `withBase()`.
 *
 * Content (admin data, profile.ts) always stores portable root-relative paths such as
 * "/images/x.jpg" or "/contact"; the prefix is added only when rendering.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '')

export function withBase(path: string): string
export function withBase(path: string | undefined): string | undefined
export function withBase(path: string | undefined): string | undefined {
  if (!path || !BASE_PATH) return path
  // only site-internal absolute paths: "/x" (not "//cdn…", not "https://…", not "#hash", not "data:")
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (path === BASE_PATH || path.startsWith(BASE_PATH + '/')) return path
  return BASE_PATH + path
}
