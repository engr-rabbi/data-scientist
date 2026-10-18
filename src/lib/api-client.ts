/**
 * Browser → Google Apps Script client for the PUBLIC (visitor) features.
 *
 * The site is hosted as static files (GitHub Pages), so there is no server and no /api routes.
 * Every visitor action calls ONE Google Apps Script "web app" (see google-apps-script/Code.gs)
 * that validates the input and writes it into your Google Sheet / Google Drive.
 *
 * `apiFetch` keeps the exact request/response contract the UI components were written against
 * (`/api/contact`, `/api/bookings`, …) and returns a standard `Response`, so component logic
 * did not have to change.
 *
 * Protocol notes (why it looks the way it does):
 *  • Requests are POSTed as `text/plain` JSON. That is a CORS "simple request": the browser sends
 *    no pre-flight OPTIONS request (Apps Script cannot answer one) and the response is readable.
 *  • Apps Script always answers HTTP 200; the real outcome is in the JSON body
 *    ({ ok:false, status, error }) and is mapped back onto a proper Response status here.
 *  • The web-app URL is public by design (it ends up in the site's JavaScript). Visitors can only
 *    reach the public actions; admin actions need a signed session token (see admin-api.ts).
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim()

export const isBackendConfigured = Boolean(API_URL)
export const API_BASE_URL = API_URL
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // per attachment (keeps Apps Script requests small and reliable)

export interface ApiResult {
  ok?: boolean
  status?: number
  error?: string
  [key: string]: any
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** One call to the Apps Script web app. Throws Error('network') when the server cannot be reached. */
export async function callApi(payload: Record<string, unknown>, opts: { keepalive?: boolean } = {}): Promise<ApiResult> {
  if (!isBackendConfigured) return { ok: false, status: 503, error: 'The site backend is not configured yet. Please contact me directly.' }
  let res: Response
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      keepalive: opts.keepalive === true,
    })
  } catch {
    throw new Error('network')
  }
  try {
    const data = (await res.json()) as ApiResult
    return data && typeof data === 'object' ? data : { ok: false, status: 502, error: 'Unexpected answer from the server.' }
  } catch {
    // Google's own error page (quota, deployment not shared, …) instead of JSON
    return { ok: false, status: 502, error: 'The server is temporarily unavailable. Please try again in a minute.' }
  }
}

/** Public, read-only: "version" of the saved website content (used by the admin's Publish check). */
export async function fetchContentVersion(): Promise<string> {
  if (!isBackendConfigured) throw new Error('Backend not configured')
  const r = await fetch(`${API_URL}${API_URL.includes('?') ? '&' : '?'}action=version`)
  const data = (await r.json()) as ApiResult
  if (data.ok === false) throw new Error(data.error || 'Could not read the content version')
  return String(data.version)
}

const asResponse = (r: ApiResult): Response => {
  if (r.ok === false) return json(typeof r.status === 'number' ? r.status : 500, { error: r.error || 'Something went wrong. Please try again.' })
  // On success `status` is DATA (e.g. a booking's "proposed" / "cancelled"); only errors use it as an HTTP code.
  return json(200, { ...r, ok: true })
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export async function fileToBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

/** Multi-step inquiry: create the row → upload each file to Drive → roll back if a file fails. */
async function submitInquiry(fd: FormData): Promise<Response> {
  const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  const created = await callApi({
    action: 'submit_inquiry',
    name: str(fd.get('name')), email: str(fd.get('email')),
    serviceCategory: str(fd.get('serviceCategory')), projectTitle: str(fd.get('projectTitle')),
    description: str(fd.get('description')), contactMethod: str(fd.get('contactMethod')),
    company: str(fd.get('company')), whatsapp: str(fd.get('whatsapp')), country: str(fd.get('country')),
    businessGoal: str(fd.get('businessGoal')), deliverable: str(fd.get('deliverable')),
    budgetRange: str(fd.get('budgetRange')), deadline: str(fd.get('deadline')), website: str(fd.get('website')),
  })
  if (created.ok === false || files.length === 0 || created.id === 'ok') return asResponse(created)
  const id = String(created.id)
  try {
    for (const file of files) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
      const r = await callApi({
        action: 'upload_inquiry_file', inquiryId: id, fileName: safe,
        mimeType: file.type || 'application/octet-stream', data: await fileToBase64(file),
      })
      if (r.ok === false) throw new Error(r.error || 'upload')
    }
    return asResponse(created)
  } catch {
    await callApi({ action: 'abort_inquiry', inquiryId: id }).catch(() => {})
    return json(500, { error: 'Could not upload your attachments. Please try again, or submit without files.' })
  }
}

/** Drop-in replacement for `fetch('/api/...')` used by the UI components. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const [path, query = ''] = input.split('?')
  const method = (init.method || 'GET').toUpperCase()
  const q = new URLSearchParams(query)
  const keepalive = Boolean(init.keepalive)
  const body: Record<string, unknown> = typeof init.body === 'string' ? JSON.parse(init.body) : {}

  switch (`${method} ${path}`) {
    case 'POST /api/contact':
      return asResponse(await callApi({ action: 'contact', name: str(body.name), email: str(body.email), subject: str(body.subject), message: str(body.message), website: str(body.website) }))
    case 'POST /api/newsletter':
      return asResponse(await callApi({ action: 'newsletter', email: str(body.email), source: str(body.source) || 'footer', website: str(body.website) }))
    case 'POST /api/faq-feedback':
      return asResponse(await callApi({ action: 'faq_feedback', slug: str(body.slug), helpful: body.helpful === true }))
    case 'POST /api/analytics':
      return asResponse(await callApi({ action: 'track', event: str(body.event), label: str(body.label), path: str(body.path), referrer: str(body.referrer) }, { keepalive }))
    case 'GET /api/bookings':
      return asResponse(await callApi(q.get('summary') ? { action: 'booking_summary' } : { action: 'booking_taken', date: q.get('date') || '' }))
    case 'POST /api/bookings':
      return asResponse(await callApi({
        action: 'create_booking', name: str(body.name), email: str(body.email), agenda: str(body.agenda), slot: str(body.slot),
        tzOffset: Number(body.tzOffset), whatsapp: str(body.whatsapp), tzName: str(body.tzName), website: str(body.website),
      }))
    case 'PUT /api/bookings':
      // the body's own "action" (lookup | cancel) is sent as "verb": "action" names the route
      return asResponse(await callApi({ action: 'manage_booking', ref: str(body.ref), email: str(body.email), verb: str(body.action) }))
    case 'POST /api/inquiries':
      if (init.body instanceof FormData) return submitInquiry(init.body)
      return json(400, { error: 'Invalid request.' })
    default:
      return json(404, { error: 'Not found' })
  }
}
