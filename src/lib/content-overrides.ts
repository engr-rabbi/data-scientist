/**
 * Applies admin-edited content (stored in the Google Sheet tab `content`, pulled in at
 * build time into src/content/overrides.json) on top of the defaults in
 * src/config/profile.ts. A section present in the overrides REPLACES the
 * default section; absent sections keep the code defaults.
 */
type Registry = Record<string, unknown>

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function applyContentOverrides(registry: Registry, overrides: Registry): void {
  for (const key of Object.keys(registry)) {
    if (!(key in overrides)) continue
    const current = registry[key]
    const next = overrides[key]
    if (Array.isArray(current) && Array.isArray(next)) {
      current.splice(0, current.length, ...next)
    } else if (isObject(current) && isObject(next)) {
      for (const k of Object.keys(current)) delete current[k]
      Object.assign(current, next)
    }
  }
}
