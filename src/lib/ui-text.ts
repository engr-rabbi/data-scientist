import { uiText } from '@/config/profile'

/** Returns the admin's replacement for a built-in text, or the text itself. */
export function tx(text: string): string
export function tx(text: string | undefined): string | undefined
export function tx(text: string | undefined): string | undefined {
  if (text === undefined) return text
  const v = uiText[text]
  return typeof v === 'string' && v.trim() ? v : text
}
