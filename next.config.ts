import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages: `next build` writes the whole site
 * (HTML, JS, CSS, robots.txt, sitemap.xml) to ./out — no server needed.
 * All dynamic features talk to the Google Apps Script web app straight from the browser.
 *
 * Sub-path hosting: for a GitHub "project site" (https://user.github.io/<repo>/) the site lives under
 * /<repo>. The base path is taken from the path part of NEXT_PUBLIC_SITE_URL
 * (e.g. https://engr-rabbi.github.io/Data-Scientist → "/Data-Scientist"); for a user site or a
 * custom domain the URL has no path and the base path is empty.
 * (NEXT_PUBLIC_BASE_PATH can override it explicitly.)
 */
function detectBasePath(): string {
  let p = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
  if (!p && process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      p = new URL(process.env.NEXT_PUBLIC_SITE_URL).pathname;
    } catch {
      /* invalid URL → no base path */
    }
  }
  p = p.replace(/\/+$/, "");
  return p && !p.startsWith("/") ? `/${p}` : p;
}
const basePath = detectBasePath();

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true }, // no image-optimisation server on GitHub Pages
  reactStrictMode: false,
  poweredByHeader: false,
};

export default nextConfig;
