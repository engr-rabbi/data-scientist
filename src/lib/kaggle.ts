import type { KaggleActivity } from '@/config/profile'

/** The three categories shown to visitors and offered in the admin. */
export type KaggleKind = 'Competition' | 'Notebook' | 'Dataset'

/** Plural labels, e.g. for filters or counts. */
export const KAGGLE_KIND_LABEL: Record<KaggleKind, string> = {
  Competition: 'Competition',
  Notebook: 'Notebook',
  Dataset: 'Dataset',
}

/** Maps the legacy "Dataset analysis" label (and anything unknown) onto the three categories. */
export function normalizeKind(kind: string | undefined): KaggleKind {
  if (kind === 'Competition' || kind === 'Notebook') return kind
  return 'Dataset'
}

/** A link is only used when it is a real http(s) URL — never render a dead or malformed button. */
export function safeUrl(url: string | undefined): string | null {
  const u = (url ?? '').trim()
  return /^https?:\/\/[^\s]+$/i.test(u) ? u : null
}

/**
 * Homepage selection. The admin's display order is always respected; this only decides
 * WHICH items fit under the cap:
 *   1. featured items first,
 *   2. then one item from every category not represented yet (so the homepage shows the
 *      mix of competitions, notebooks and datasets),
 *   3. then the rest in display order.
 * The chosen items are returned in their original display order.
 */
export function selectForHome<T extends Pick<KaggleActivity, 'kind' | 'featured'>>(items: T[], limit: number): T[] {
  if (limit <= 0) return []
  if (items.length <= limit) return items
  const chosen = new Set<number>()
  const take = (i: number) => { if (chosen.size < limit) chosen.add(i) }
  items.forEach((it, i) => { if (it.featured === true) take(i) })
  const seen = new Set<KaggleKind>(Array.from(chosen, (i) => normalizeKind(items[i].kind)))
  items.forEach((it, i) => {
    const k = normalizeKind(it.kind)
    if (!seen.has(k)) { seen.add(k); take(i) }
  })
  items.forEach((_, i) => take(i))
  return items.filter((_, i) => chosen.has(i))
}
