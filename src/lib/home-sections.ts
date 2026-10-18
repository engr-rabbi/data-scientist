type Row = { id: string; visible?: boolean }

/**
 * Merges a saved homepage layout with the built-in section list.
 * The saved order and visibility win. A section the saved layout does not mention yet
 * (one added in a later code update, such as "kaggle") is slotted in right after the section
 * that precedes it in the built-in order — so it appears where it was designed to be, not at
 * the very bottom of the page. Unknown ids and duplicates are dropped.
 */
export function mergeHomeSections<T extends Row>(saved: readonly T[], builtIn: readonly T[]): T[] {
  const known = new Set(builtIn.map((b) => b.id))
  const seen = new Set<string>()
  const out: T[] = []
  for (const s of saved) {
    if (!known.has(s.id) || seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  builtIn.forEach((b, i) => {
    if (seen.has(b.id)) return
    seen.add(b.id)
    // nearest earlier built-in neighbour already placed (a hidden one still holds its position)
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const idx = out.findIndex((o) => o.id === builtIn[j].id)
      if (idx !== -1) { at = idx + 1; break }
    }
    out.splice(at, 0, b)
  })
  return out
}

/** Which homepage sections to render, in order (hidden ones dropped). New sections are visible by default. */
export function resolveHomeSections(config: readonly Row[], allIds: readonly string[]): string[] {
  const builtIn: Row[] = allIds.map((id) => ({ id, visible: true }))
  return mergeHomeSections<Row>(config, builtIn)
    .filter((s) => s.visible !== false)
    .map((s) => s.id)
}
