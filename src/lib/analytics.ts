
'use client'


import { apiFetch } from '@/lib/api-client'
/**
 * Privacy-conscious conversion analytics.
 * Fire-and-forget event sent to the Google Sheet ("events" tab) through apiFetch. Never blocks the UI, never stores
 * sensitive personal data — only event name, optional label, path, referrer.
 */

export type AnalyticsEvent =
  | 'view_service'
  | 'view_project'
  | 'view_page'
  | 'view_article'
  | 'view_pricing'
  | 'start_project'
  | 'submit_project'
  | 'submit_contact'
  | 'newsletter_subscribe'
  | 'click_whatsapp'
  | 'click_telegram'
  | 'click_phone'
  | 'click_email'
  | 'click_upwork'
  | 'click_freelancer'
  | 'click_linkedin'
  | 'click_kaggle'
  | 'click_github'
  | 'copy_contact'
  | 'save_contact'
  | 'copy_link'
  | 'faq_search'
  | 'faq_filter'
  | 'faq_feedback'
  | 'booking_started'
  | 'booking_completed'
  | 'booking_lookup'
  | 'booking_cancelled'
  | 'calendar_download'
  | 'estimate_pick'
  | 'estimate_used'
  | 'service_finder'
  | 'back_to_top'
  | 'demo_interaction'

export function track(event: AnalyticsEvent, label?: string) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      event,
      label: label?.slice(0, 200),
      path: window.location.pathname,
      referrer: document.referrer ? document.referrer.slice(0, 300) : null,
    }
    // keepalive so the request survives page navigation (e.g. wa.me links)
    apiFetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // analytics must never break the UI
  }
}
