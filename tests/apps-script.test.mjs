// Runs google-apps-script/Code.gs against an in-memory simulation of Google Sheets / Drive / Apps Script.
//   node tests/apps-script.test.mjs
import { createHash } from 'node:crypto'
import { createWorld } from './apps-script/harness.mjs'

let n = 0, bad = 0
const ok = (name, cond, extra = '') => { n++; if (!cond) bad++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + (typeof extra === 'string' ? extra : JSON.stringify(extra))}`) }
const section = (t) => console.log(`\n== ${t} ==`)
const b64 = (s) => Buffer.from(s).toString('base64')
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const fresh = (cfg) => { const w = createWorld(); w.install(cfg); return w }
const err = (r, status) => r.ok === false && r.status === status
const VALID_INQ = { action: 'submit_inquiry', name: 'Rahim Uddin', email: 'rahim@example.com', serviceCategory: 'Data Analysis', projectTitle: 'Sales dashboard', description: 'We need a dashboard that shows weekly sales by region and product.', contactMethod: 'Email', budgetRange: '$500-1000', deadline: '2 weeks' }

/* =============================================================== setup */
section('setup')
{
  const w = createWorld()
  ok('before setup, a visitor request fails politely (503)', err(w.post({ action: 'contact', name: 'Ab', email: 'a@b.co', message: 'hello world 123' }), 503))
  w.X.CONFIG.ADMIN_PASSWORD = 'CHANGE-THIS-TO-A-LONG-PASSWORD'
  let t1 = ''; try { w.X.setup() } catch (e) { t1 = e.message }
  ok('setup refuses the placeholder password', /ADMIN_PASSWORD/.test(t1), t1)
  w.X.CONFIG.ADMIN_PASSWORD = 'short'; let t2 = ''; try { w.X.setup() } catch (e) { t2 = e.message }
  ok('setup refuses a short password', /12 characters/.test(t2), t2)
  w.X.CONFIG.ADMIN_PASSWORD = 'a-long-test-password-123'; let t3 = ''; try { w.X.setup() } catch (e) { t3 = e.message }
  ok('setup refuses the placeholder e-mail', /ADMIN_EMAIL/.test(t3), t3)

  w.install()
  const tabs = Object.keys(w.X.SHEETS)
  ok('all 9 tabs created with headers + frozen header row', tabs.every((t) => { const s = w.mainSheet.getSheetByName(t); return s && s.frozen === 1 && w.X.SHEETS[t].every((c, i) => s.get(1, i + 1) === c) }), tabs.join())
  ok('empty default "Sheet1" removed', !w.mainSheet.getSheetByName('Sheet1'))
  ok('two Drive folders created (media + private attachments)', w.folders.size === 2)
  const stored = JSON.stringify([...w.props.values()])
  ok('password is NOT stored in plain text', !stored.includes('a-long-test-password-123'))
  ok('admin e-mail stored lower-case, hash is 64 hex', w.props.get('ADMIN_EMAIL') === 'owner@example.com' && /^[a-f0-9]{64}$/.test(w.props.get('ADMIN_HASH')))
  const again = w.X.setup()
  ok('setup is safe to run twice (no extra folders, tabs kept)', w.folders.size === 2 && tabs.length === w.mainSheet.getSheets().length && /Setup finished/.test(again))
  const chk = w.X.checkSetup()
  ok('checkSetup reports everything OK', Object.values(chk).filter((v) => typeof v === 'string' && v.startsWith('MISSING')).length === 0, chk)
  ok('GET ping works', w.get({ action: 'ping' }).ok === true)
  ok('unknown GET action → 404', err(w.get({ action: 'nope' }), 404))
  ok('invalid JSON body → 400', err(w.post('{not json'), 400))
  ok('unknown POST action → 404', err(w.post({ action: 'drop_database' }), 404))
}

/* ============================================================ contact */
section('contact form')
{
  const w = fresh({ NOTIFY_EMAIL: 'me@example.com' })
  const good = { action: 'contact', name: 'Karim', email: 'karim@example.com', subject: 'Hello', message: 'I would like to talk about a project.' }
  ok('valid message accepted', w.post(good).ok === true)
  const rows = w.rows('messages')
  ok('row stored as "new" with a 32-hex id and ISO timestamp', rows.length === 1 && rows[0].status === 'new' && /^[a-f0-9]{32}$/.test(rows[0].id) && /^\d{4}-\d\d-\d\dT.*Z$/.test(rows[0].created_at), rows[0])
  ok('owner is notified by e-mail', w.log.mails.length === 1 && /Karim/.test(w.log.mails[0].subject))
  ok('short name → 400 "Please enter your name"', w.post({ ...good, name: 'K', email: 'x1@example.com' }).error === 'Please enter your name')
  ok('bad e-mail → 400', w.post({ ...good, email: 'nope' }).error === 'Please enter a valid email')
  ok('message < 10 chars → 400', /at least 10/.test(w.post({ ...good, email: 'x2@example.com', message: 'short' }).error))
  ok('message > 4000 chars → 400', w.post({ ...good, email: 'x3@example.com', message: 'x'.repeat(4001) }).error === 'Message is too long')
  ok('subject > 160 chars → 400', w.post({ ...good, email: 'x4@example.com', subject: 's'.repeat(161) }).error === 'Subject is too long')
  const before = w.rows('messages').length
  ok('honeypot: reports success but stores nothing', w.post({ ...good, email: 'bot@example.com', website: 'http://spam' }).ok === true && w.rows('messages').length === before)
  // dangerous / awkward values must come back exactly as sent
  const nasty = { action: 'contact', name: '=cmd|calc', email: 'edge@example.com', subject: '+8801712345678', message: '=HYPERLINK("http://evil","click") and 0012345 and true and 2026-10-15T10:00:00Z' }
  w.post(nasty)
  const last = w.rows('messages').pop()
  ok('formulas, phone numbers, "true", ISO dates stay plain text (no sheet auto-conversion)', last.name === nasty.name && last.subject === nasty.subject && last.message === nasty.message && typeof last.message === 'string', last)
  // per-address rate limit
  const rl = fresh()
  const mk = (i, email) => ({ action: 'contact', name: 'Rate Test', email, message: 'message number ' + i + ' ........' })
  const r = [1, 2, 3, 4].map((i) => rl.post(mk(i, 'same@example.com')))
  ok('same address: 3 allowed, 4th → 429', r[0].ok && r[1].ok && r[2].ok && err(r[3], 429), r)
  ok('a different address is not affected', rl.post(mk(5, 'other@example.com')).ok === true)
  rl.advance(11 * 60 * 1000)
  ok('limit resets after the 10-minute window', rl.post(mk(6, 'same@example.com')).ok === true)
  // global cap
  const gl = fresh(); let lastStatus = 0
  for (let i = 0; i < 41; i++) lastStatus = gl.post(mk(i, `u${i}@example.com`)).status || 200
  ok('global cap: 41st message in 10 minutes → 429', lastStatus === 429, lastStatus)
}

/* ========================================================== newsletter */
section('newsletter + FAQ feedback + analytics')
{
  const w = fresh()
  ok('subscribe', w.post({ action: 'newsletter', email: 'Fan@Example.com', source: 'footer' }).ok === true)
  w.advance(11 * 60 * 1000)
  w.post({ action: 'newsletter', email: 'fan@example.com' })
  const subs = w.rows('subscribers')
  ok('same address (any case) stored once, lower-cased, active', subs.length === 1 && subs[0].email === 'fan@example.com' && subs[0].active === 'true', subs)
  ok('invalid e-mail → 400', err(w.post({ action: 'newsletter', email: 'bad' }), 400))
  ok('honeypot stores nothing', (w.post({ action: 'newsletter', email: 'bot@example.com', website: 'x' }), w.rows('subscribers').length === 1))
  ok('FAQ feedback valid', w.post({ action: 'faq_feedback', slug: 'faq-pricing', helpful: true }).ok === true && w.rows('faq_feedback')[0].helpful === 'true')
  ok('FAQ feedback: bad slug / non-boolean → 400', err(w.post({ action: 'faq_feedback', slug: 'Bad Slug', helpful: true }), 400) && err(w.post({ action: 'faq_feedback', slug: 'faq-x', helpful: 'yes' }), 400))
  ok('analytics event stored', w.post({ action: 'track', event: 'start_project', label: 'hero', path: '/', referrer: '' }).ok === true && w.rows('events').length === 1)
  ok('analytics never errors, silently drops junk', w.post({ action: 'track', event: '' }).ok === true && w.post({ action: 'track', event: 'x'.repeat(61) }).ok === true && w.rows('events').length === 1)
  for (let i = 0; i < 130; i++) w.post({ action: 'track', event: 'view_page', path: '/p' + i })
  ok('analytics over 120/min are dropped without an error', w.rows('events').length <= 121)
}

/* ============================================================ inquiries */
section('project inquiries + attachments')
{
  const w = fresh({ NOTIFY_EMAIL: 'me@example.com' })
  const r = w.post(VALID_INQ)
  ok('valid inquiry → ok + 32-hex id', r.ok === true && /^[a-f0-9]{32}$/.test(r.id), r)
  const row = w.rows('inquiries')[0]
  ok('stored with status new, empty attachments', row.status === 'new' && row.attachments === '[]' && row.service_category === 'Data Analysis' && row.contact_method === 'Email', row)
  ok('owner notified', w.log.mails.some((m) => /Sales dashboard/.test(m.subject)))
  const V = (o, e) => ({ ...VALID_INQ, email: `v${Math.random().toString(36).slice(2, 8)}@example.com`, ...o, ...(e ? { email: e } : {}) })
  ok('name too short', w.post(V({ name: 'A' })).error === 'Please enter your name')
  ok('bad e-mail', w.post(V({}, 'bad')).error === 'Please enter a valid email')
  ok('missing category', w.post(V({ serviceCategory: '' })).error === 'Please choose a service category')
  ok('title too short', w.post(V({ projectTitle: 'ab' })).error === 'Please add a short project title')
  ok('description < 30 chars', /at least 30/.test(w.post(V({ description: 'too short' })).error))
  ok('description > 6000 chars', w.post(V({ description: 'x'.repeat(6001) })).error === 'One of the fields is too long')
  ok('missing contact method', w.post(V({ contactMethod: '' })).error === 'Please choose a contact method')
  ok('honeypot → success with id "ok", nothing stored', (() => { const b = w.rows('inquiries').length; const x = w.post(V({ website: 'spam' })); return x.ok && x.id === 'ok' && w.rows('inquiries').length === b })())

  const id = r.id
  const up = (o) => w.post({ action: 'upload_inquiry_file', inquiryId: id, fileName: 'data.csv', mimeType: 'text/csv', data: b64('a,b\n1,2'), ...o })
  ok('attachment stored in the PRIVATE folder', (() => { const x = up({}); const f = [...w.files.values()][0]; return x.ok && f.sharing === 'PRIVATE' && f.folderId === w.props.get('FILES_FOLDER_ID') })())
  const listed = JSON.parse(w.rows('inquiries')[0].attachments)
  ok('attachment metadata saved on the inquiry row (name, size, Drive link)', listed.length === 1 && listed[0].file_name === 'data.csv' && listed[0].file_size === 7 && /drive\.google\.com/.test(listed[0].url), listed)
  ok('executable type rejected', err(up({ fileName: 'virus.exe' }), 400))
  ok('double extension / odd name rejected', err(up({ fileName: 'a b.csv' }), 400) && err(up({ fileName: '../x.csv' }), 400))
  ok('file over 5 MB rejected', err(up({ data: 'A'.repeat(7_400_000) }), 400))
  ok('not base64 rejected', err(up({ data: '!!!not base64!!!' }), 400))
  ok('empty file rejected', err(up({ data: '' }), 400))
  ok('unknown inquiry id rejected', err(up({ inquiryId: 'f'.repeat(32) }), 404))
  ok('malformed inquiry id rejected', err(up({ inquiryId: 'short' }), 400))
  for (let i = 0; i < 4; i++) up({ fileName: `f${i}.pdf`, mimeType: 'application/pdf' })
  ok('maximum 5 files per inquiry', err(up({ fileName: 'six.pdf' }), 400) && JSON.parse(w.rows('inquiries')[0].attachments).length === 5)
  w.advance(31 * 60 * 1000)
  ok('uploads are refused 30 minutes after the inquiry was created', err(up({ fileName: 'late.pdf' }), 404))

  // rollback of a failed upload
  const w2 = fresh(); const a = w2.post(VALID_INQ)
  w2.post({ action: 'upload_inquiry_file', inquiryId: a.id, fileName: 'x.pdf', mimeType: 'application/pdf', data: b64('x') })
  ok('abort_inquiry removes the inquiry AND its stored files', (() => { w2.post({ action: 'abort_inquiry', inquiryId: a.id }); return w2.rows('inquiries').length === 0 && w2.log.trashed.length === 1 })())
  const w3 = fresh(); const c = w3.post(VALID_INQ); w3.advance(31 * 60 * 1000); w3.post({ action: 'abort_inquiry', inquiryId: c.id })
  ok('abort cannot delete an old inquiry', w3.rows('inquiries').length === 1)
}

/* ============================================================== bookings */
section('call bookings')
{
  const w = fresh()
  const SUN = '2026-10-18'                       // a Sunday (workday in Bangladesh)
  const slot = (day, hh, mm = 0) => new Date(Date.parse(`${day}T00:00:00Z`) + ((hh * 60 + mm) - 360) * 60000).toISOString() // Dhaka wall time → UTC
  const bk = (o = {}) => ({ action: 'create_booking', name: 'Nadia Islam', email: 'nadia@example.com', agenda: 'Discuss a forecasting project', slot: slot(SUN, 11), tzOffset: 0, tzName: 'UTC', ...o })
  const sum = w.post({ action: 'booking_summary' }).counts
  const days = Object.keys(sum)
  ok('summary lists ≤12 bookable days, none on Fri/Sat', days.length === 12 && days.every((d) => ![5, 6].includes(new Date(d + 'T00:00:00Z').getUTCDay())), days)
  ok('today counts only slots after the 3-hour lead time (13:00–17:30 = 10)', sum['2026-10-15'] === 10, sum['2026-10-15'])
  ok('a normal day has 16 half-hour slots (10:00–18:00)', sum[SUN] === 16, sum[SUN])

  const r = w.post(bk())
  ok('valid booking → ok + id', r.ok === true && /^[a-f0-9]{32}$/.test(r.id), r)
  ok('stored as "proposed" with the exact UTC slot', w.rows('bookings')[0].status === 'proposed' && w.rows('bookings')[0].slot_utc === slot(SUN, 11))
  ok('the slot is now taken (summary 15, booking_taken lists it)', w.post({ action: 'booking_summary' }).counts[SUN] === 15 && w.post({ action: 'booking_taken', date: SUN }).taken[0] === slot(SUN, 11))
  ok('same slot, another visitor → 409', err(w.post(bk({ email: 'other@example.com' })), 409))
  ok('Friday → not bookable', /no longer available/.test(w.post(bk({ email: 'a1@example.com', slot: slot('2026-10-23', 11) })).error))
  ok('before 10:00 / at 18:00 → not bookable', err(w.post(bk({ email: 'a2@example.com', slot: slot(SUN, 9, 30) })), 400) && err(w.post(bk({ email: 'a3@example.com', slot: slot(SUN, 18) })), 400))
  ok('off-grid time (11:15) → not bookable', err(w.post(bk({ email: 'a4@example.com', slot: slot(SUN, 11, 15) })), 400))
  ok('inside the lead time (today 11:00) → not bookable', err(w.post(bk({ email: 'a5@example.com', slot: slot('2026-10-15', 11) })), 400))
  ok('too far ahead → not bookable', err(w.post(bk({ email: 'a6@example.com', slot: slot('2026-12-20', 11) })), 400))
  ok('garbage slot → 400', err(w.post(bk({ email: 'a7@example.com', slot: 'tomorrow' })), 400) && err(w.post(bk({ email: 'a8@example.com', slot: '2026-10-18T05:00:30.000Z' })), 400))
  ok('agenda < 10 chars → 400', /at least 10/.test(w.post(bk({ email: 'b1@example.com', agenda: 'hi' })).error))
  ok('tz offset out of range → 400', err(w.post(bk({ email: 'b2@example.com', tzOffset: 9999 })), 400))
  ok('honeypot stores nothing', (() => { const k = w.rows('bookings').length; const x = w.post(bk({ email: 'b3@example.com', website: 'spam' })); return x.id === 'ok' && w.rows('bookings').length === k })())

  const id = r.id
  const M = (o = {}) => w.post({ action: 'manage_booking', ref: id, email: 'nadia@example.com', verb: 'lookup', ...o })
  ok('lookup with the right reference + e-mail (any case)', (() => { const x = M({ email: 'NADIA@Example.com' }); return x.ok && x.status === 'proposed' && x.slotUtc === slot(SUN, 11) && x.name === 'Nadia Islam' })())
  ok('lookup with the wrong e-mail → 404 (reference alone is not enough)', err(M({ email: 'someone@else.com' }), 404))
  ok('malformed reference → 400', err(M({ ref: 'abc' }), 400))
  ok('unknown verb → 400', err(M({ verb: 'delete' }), 400))
  ok('visitor can cancel a proposed booking', M({ verb: 'cancel' }).status === 'cancelled')
  ok('…which frees the slot again (summary back to 16)', w.post({ action: 'booking_summary' }).counts[SUN] === 16)
  ok('cancelling twice → 409 "already cancelled"', /already cancelled/.test(M({ verb: 'cancel' }).error))
  const r2 = w.post(bk({ email: 'sam@example.com', slot: slot(SUN, 12) }))
  const { token } = w.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' })
  w.post({ action: 'update', token, sheet: 'bookings', id: r2.id, patch: { status: 'confirmed' } })
  ok('a confirmed booking can no longer be cancelled by the visitor', /status: confirmed/.test(w.post({ action: 'manage_booking', ref: r2.id, email: 'sam@example.com', verb: 'cancel' }).error))
  ok('proposals nobody confirmed for 30 days expire', (() => { const w2 = fresh(); const a = w2.post(bk({ slot: slot(SUN, 14) })); w2.advance(31 * 86400000); w2.post({ action: 'booking_summary' }); return w2.rows('bookings')[0].status === 'expired' })())
  // settings edited in the admin apply to the server rules
  w.post({ action: 'contentSave', token, key: 'bookingSettings', value: { slotMinutes: 60, blockedDateKeys: [SUN], startHourDhaka: 9, endHourDhaka: 12, workdays: [0, 1, 2, 3, 4], leadTimeMinutes: 60, calendarDaysAhead: 20, maxDays: 12 } })
  const s2 = w.post({ action: 'booking_summary' }).counts
  ok('blocked day disappears; slot length and hours follow the admin settings', !(SUN in s2) && s2['2026-10-19'] === 3, s2)
  ok('a blocked day cannot be booked', err(w.post(bk({ email: 'z1@example.com', slot: slot(SUN, 10) })), 400))
}

/* ======================================================== admin sign-in */
section('admin sign-in & sessions')
{
  const w = fresh()
  const login = (o = {}) => w.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123', ...o })
  const bad = login({ password: 'wrong-password' })
  ok('wrong password → 401 and the failure is slowed down', err(bad, 401) && w.log.sleeps === 1, bad)
  ok('wrong e-mail → 401 (same message — no hint which part was wrong)', login({ email: 'x@y.com' }).error === bad.error)
  const good = login({ email: '  OWNER@example.com ' })
  ok('correct credentials → token (e-mail case/space insensitive)', good.ok && good.token.includes('.') && good.email === 'owner@example.com', good)
  const T = good.token
  ok('token works on admin actions', w.post({ action: 'whoami', token: T }).email === 'owner@example.com')
  const acts = ['whoami', 'dashboard', 'list', 'update', 'remove', 'contentAll', 'contentSave', 'contentDelete', 'contentHistory', 'mediaList', 'mediaUpload', 'mediaReplace', 'mediaMeta', 'mediaDelete', 'mediaFindByHash']
  ok('every admin action rejects a missing token (401)', acts.every((a) => err(w.post({ action: a }), 401)), acts.filter((a) => !err(w.post({ action: a }), 401)))
  const [p, sig] = T.split('.')
  const forged = Buffer.from(JSON.stringify({ e: 'owner@example.com', x: Date.now() + 1e9 })).toString('base64')
  ok('a forged / tampered token is rejected', err(w.post({ action: 'whoami', token: forged + '.' + sig }), 401) && err(w.post({ action: 'whoami', token: p + '.' + sig.slice(0, -2) + 'AA' }), 401) && err(w.post({ action: 'whoami', token: 'garbage' }), 401))
  w.advance(11 * 3600 * 1000)
  ok('session still valid after 11 hours', w.post({ action: 'whoami', token: T }).ok === true)
  w.advance(2 * 3600 * 1000)
  ok('session expires after 12 hours', err(w.post({ action: 'whoami', token: T }), 401))
  // brute-force protection
  const b = fresh(); let st = []
  for (let i = 0; i < 10; i++) b.post({ action: 'login', email: 'owner@example.com', password: 'guess' + i })
  const locked = b.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' })
  ok('after 10 failures even the right password is refused for a while (429)', err(locked, 429), locked)
  b.advance(16 * 60 * 1000)
  ok('…and allowed again after 15 minutes', b.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' }).ok === true)
  // changing the password: edit CONFIG, run setup() again
  const c = fresh(); c.install({ ADMIN_PASSWORD: 'brand-new-password-456' })
  ok('re-running setup() with a new password changes it', err(c.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' }), 401) && c.post({ action: 'login', email: 'owner@example.com', password: 'brand-new-password-456' }).ok === true)
}

/* ============================================================ admin CRUD */
section('admin: dashboard, lists, edit, delete')
{
  const w = fresh()
  const T = w.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' }).token
  const A = (a, o = {}) => w.post({ action: a, token: T, ...o })
  const inq = w.post(VALID_INQ)
  w.post({ action: 'upload_inquiry_file', inquiryId: inq.id, fileName: 'brief.pdf', mimeType: 'application/pdf', data: b64('%PDF') })
  w.post({ action: 'contact', name: 'Ana Roy', email: 'ana@example.com', message: 'Hello there, quick question please.' })
  w.post({ action: 'newsletter', email: 'n1@example.com' })
  w.post({ action: 'faq_feedback', slug: 'faq-a', helpful: true }); w.post({ action: 'faq_feedback', slug: 'faq-b', helpful: false })
  w.post({ action: 'track', event: 'start_project', path: '/' }); w.post({ action: 'track', event: 'start_project', path: '/services' }); w.post({ action: 'track', event: 'view_page', path: '/' })
  w.post({ action: 'create_booking', name: 'Bo Ru', email: 'bo@example.com', agenda: 'a call about my dashboard', slot: '2026-10-18T05:00:00.000Z', tzOffset: 360 })
  const d = A('dashboard')
  ok('dashboard counts', d.new_inquiries === 1 && d.total_inquiries === 1 && d.new_messages === 1 && d.proposed_bookings === 1 && d.upcoming_bookings === 1 && d.subscribers === 1 && d.faq_helpful === 1 && d.faq_unhelpful === 1 && d.events_30d === 3, d)
  ok('dashboard: top events / paths / daily series', d.top_events[0].event === 'start_project' && d.top_events[0].n === 2 && d.top_paths[0].path === '/' && d.daily_events.length === 1 && d.daily_events[0].n === 3, d)

  const li = A('list', { sheet: 'inquiries' }).rows
  ok('inquiries list has the attachment array (name, size, Drive link) in the shape the UI uses', li.length === 1 && li[0].inquiry_attachments[0].file_name === 'brief.pdf' && li[0].inquiry_attachments[0].file_size === 4 && 'url' in li[0].inquiry_attachments[0] && !('_row' in li[0]) && !('attachments' in li[0]), li[0])
  ok('bookings: numeric tz_offset; subscribers: boolean active', A('list', { sheet: 'bookings' }).rows[0].tz_offset === 360 && A('list', { sheet: 'subscribers' }).rows[0].active === true)
  ok('unknown list → 400', err(A('list', { sheet: 'admins' }), 400))

  ok('inquiry: set status + private note', (() => { A('update', { sheet: 'inquiries', id: inq.id, patch: { status: 'replied', admin_notes: 'Sent a quote' } }); const r = w.rows('inquiries')[0]; return r.status === 'replied' && r.admin_notes === 'Sent a quote' })())
  ok('invalid status rejected', err(A('update', { sheet: 'inquiries', id: inq.id, patch: { status: 'hacked' } }), 400))
  ok('only whitelisted fields can be changed (name stays)', (() => { A('update', { sheet: 'inquiries', id: inq.id, patch: { name: 'Mallory', email: 'm@evil.com' } }); return w.rows('inquiries')[0].name === 'Rahim Uddin' })())
  ok('message / subscriber / booking updates', (() => {
    const m = A('list', { sheet: 'messages' }).rows[0], s = A('list', { sheet: 'subscribers' }).rows[0], b = A('list', { sheet: 'bookings' }).rows[0]
    A('update', { sheet: 'messages', id: m.id, patch: { status: 'read' } }); A('update', { sheet: 'subscribers', id: s.id, patch: { active: false } }); A('update', { sheet: 'bookings', id: b.id, patch: { status: 'confirmed' } })
    return w.rows('messages')[0].status === 'read' && w.rows('subscribers')[0].active === 'false' && w.rows('bookings')[0].status === 'confirmed'
  })())
  ok('unsubscribed address that signs up again is re-activated', (() => { w.advance(11 * 60 * 1000); w.post({ action: 'newsletter', email: 'n1@example.com' }); return w.rows('subscribers').length === 1 && w.rows('subscribers')[0].active === 'true' })())
  ok('update of an unknown id / sheet → 404', err(A('update', { sheet: 'inquiries', id: 'f'.repeat(32), patch: {} }), 404) && err(A('update', { sheet: 'media', id: 'x', patch: {} }), 404))
  ok('cannot re-activate a cancelled booking onto a slot another booking holds (409)', (() => {
    const b = A('list', { sheet: 'bookings' }).rows[0]; A('update', { sheet: 'bookings', id: b.id, patch: { status: 'cancelled' } })
    const other = w.post({ action: 'create_booking', name: 'Cy Dee', email: 'cy@example.com', agenda: 'taking over this slot now', slot: '2026-10-18T05:00:00.000Z', tzOffset: 0 })
    return other.ok && err(A('update', { sheet: 'bookings', id: b.id, patch: { status: 'confirmed' } }), 409)
  })())
  const filesBefore = w.log.trashed.length
  A('remove', { sheet: 'inquiries', id: inq.id })
  ok('deleting an inquiry also moves its Drive files to the trash', w.rows('inquiries').length === 0 && w.log.trashed.length === filesBefore + 1)
  ok('delete message / subscriber / booking; deleting twice is harmless', (() => {
    for (const [sh, id] of [['messages', A('list', { sheet: 'messages' }).rows[0].id], ['subscribers', A('list', { sheet: 'subscribers' }).rows[0].id]]) { A('remove', { sheet: sh, id }); A('remove', { sheet: sh, id }) }
    return w.rows('messages').length === 0 && w.rows('subscribers').length === 0
  })())
  ok('admin list never leaks internal row numbers or the password hash', !JSON.stringify(A('list', { sheet: 'bookings' })).includes('_row') && !JSON.stringify(A('dashboard')).includes('HASH'))
}

/* ================================================================ content */
section('site content: save, history, chunking, version')
{
  const w = fresh()
  const T = w.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' }).token
  const A = (a, o = {}) => w.post({ action: a, token: T, ...o })
  ok('empty at the start', w.get({ action: 'content' }).items.length === 0 && w.get({ action: 'version' }).version === 'none:0')
  A('contentSave', { key: 'services', value: [{ id: 'a', title: 'বাংলা শিরোনাম ✓ — “quotes” 😀' }] })
  const pub = w.get({ action: 'content' })
  ok('public GET returns saved content (Unicode / Bengali / emoji intact)', pub.items.length === 1 && pub.items[0].key === 'services' && pub.items[0].value[0].title === 'বাংলা শিরোনাম ✓ — “quotes” 😀', pub)
  const v1 = pub.version
  ok('version = latest-update:count and matches the /version endpoint', /^\d{4}-.*Z:1$/.test(v1) && w.get({ action: 'version' }).version === v1, v1)
  w.advance(5000); A('contentSave', { key: 'services', value: [{ id: 'a', title: 'v2' }] })
  ok('version changes after an edit', w.get({ action: 'version' }).version !== v1)
  ok('previous version is kept in history', (() => { const h = A('contentHistory', { key: 'services' }).items; return h.length === 1 && h[0].value[0].title.startsWith('বাংলা') && typeof h[0].id === 'number' })())
  const big = { text: 'x'.repeat(95000), more: 'ক'.repeat(30000) }
  A('contentSave', { key: 'projects', value: big })
  const parts = w.rows('content').filter((r) => r.key === 'projects')
  ok('a value larger than one cell is split into ≤40,000-char parts', parts.length >= 4 && parts.every((p) => p.json.length <= 40000), parts.map((p) => p.json.length))
  ok('…and reassembled exactly', JSON.stringify(A('contentAll').items.find((i) => i.key === 'projects').value) === JSON.stringify(big))
  for (let i = 0; i < 25; i++) { w.advance(1000); A('contentSave', { key: 'faq', value: [{ n: i }] }) }
  const h = A('contentHistory', { key: 'faq' }).items
  ok('history keeps only the newest 20 versions, newest first', h.length === 20 && h[0].value[0].n === 23 && h[19].value[0].n === 4, h.map((x) => x.value[0].n))
  ok('history of one section is independent of another', A('contentHistory', { key: 'services' }).items.length === 1)
  ok('restore flow: an older history value can be saved back', (() => { A('contentSave', { key: 'faq', value: h[5].value }); return A('contentAll').items.find((i) => i.key === 'faq').value[0].n === 18 })())
  const vBefore = w.get({ action: 'version' }).version
  A('contentDelete', { key: 'faq' })
  ok('"Reset to default" removes the section, changes the version, keeps a restorable copy', !A('contentAll').items.some((i) => i.key === 'faq') && w.get({ action: 'version' }).version !== vBefore && A('contentHistory', { key: 'faq' }).items.length > 0)
  ok('invalid keys rejected (injection-style)', ['', 'a b', 'a/b', "a'; drop", 'x'.repeat(61), null].every((k) => err(A('contentSave', { key: k, value: 1 }), 400)))
  ok('un-saveable value rejected', err(A('contentSave', { key: 'x', value: undefined }), 400))
  ok('too-large value rejected', err(A('contentSave', { key: 'x', value: 'y'.repeat(1500001) }), 400))
  ok('public content endpoint exposes nothing but key/value/updated_at', Object.keys(w.get({ action: 'content' }).items[0]).sort().join() === 'key,updated_at,value')
  ok('read-modify-write loop of 30 saves left no duplicate or orphan rows', (() => { const keys = w.rows('content').map((r) => r.key + '#' + r.part); return new Set(keys).size === keys.length })())
}

/* ================================================================== media */
section('picture library (Drive)')
{
  const w = fresh()
  const T = w.post({ action: 'login', email: 'owner@example.com', password: 'a-long-test-password-123' }).token
  const A = (a, o = {}) => w.post({ action: a, token: T, ...o })
  const img = (buf, name = 'Sales Dashboard.png', type = 'image/png') => ({ fileName: name, mimeType: type, data: buf.toString('base64'), sha256: sha(buf), width: 1, height: 1 })
  const up = A('mediaUpload', img(PNG))
  const a = up.asset
  ok('upload stores a PUBLIC (link-shared) Drive file and returns its address', up.ok && !up.duplicate && w.files.get(a.id).sharing === 'ANYONE_WITH_LINK:VIEW' && a.url === `https://lh3.googleusercontent.com/d/${a.id}` && a.path === a.id, up)
  ok('file is named from its hash + a clean name, in the media folder', /^[a-f0-9]{10}-sales-dashboard\.png$/.test(w.files.get(a.id).blob.name) && w.files.get(a.id).folderId === w.props.get('MEDIA_FOLDER_ID'), w.files.get(a.id).blob.name)
  ok('same picture again (even renamed) is NOT stored twice', (() => { const x = A('mediaUpload', img(PNG, 'copy.png')); return x.duplicate === true && x.asset.id === a.id && w.files.size === 1 && w.rows('media').length === 1 })())
  ok('findByHash locates an existing picture', A('mediaFindByHash', { sha256: sha(PNG) }).asset.id === a.id && A('mediaFindByHash', { sha256: 'a'.repeat(64) }).asset === null)
  ok('non-image type / bad hash / oversize rejected', err(A('mediaUpload', img(PNG, 'a.pdf', 'application/pdf')), 400) && err(A('mediaUpload', { ...img(PNG), sha256: 'zz' }), 400) && err(A('mediaUpload', { ...img(PNG), data: 'A'.repeat(7_400_000) }), 400))
  ok('alt text and caption can be edited', (() => { A('mediaMeta', { id: a.id, alt: 'Dashboard', caption: 'Weekly sales' }); const r = A('mediaList').items[0]; return r.alt === 'Dashboard' && r.caption === 'Weekly sales' })())
  // a content section uses the picture
  A('contentSave', { key: 'services', value: [{ id: 's1', image: a.url, imageAlt: 'x' }, { id: 's2', image: 'https://example.com/other.jpg' }] })
  const PNG2 = Buffer.concat([PNG, Buffer.from('v2')])
  const rep = A('mediaReplace', { id: a.id, ...img(PNG2, 'new-look.png') })
  const b = rep.asset
  ok('replace → new Drive file, old one trashed, alt/caption carried over', rep.ok && b.id !== a.id && w.log.trashed.includes(a.id) && b.alt === 'Dashboard' && b.caption === 'Weekly sales', rep)
  const svc = A('contentAll').items.find((i) => i.key === 'services').value
  ok('every place that used the old picture now points at the new one (other URLs untouched)', svc[0].image === b.url && svc[1].image === 'https://example.com/other.jpg' && rep.contentUpdated === true, svc)
  ok('library still has exactly one entry for it', A('mediaList').items.length === 1 && A('mediaList').items[0].id === b.id)
  A('mediaUpload', img(Buffer.concat([PNG, Buffer.from('third')]), 'third.png'))
  ok('replacing with a picture that already exists as another entry → 409', err(A('mediaReplace', { id: b.id, ...img(Buffer.concat([PNG, Buffer.from('third')]), 'x.png') }), 409))
  ok('replace of an unknown picture → 404', err(A('mediaReplace', { id: 'nope', ...img(Buffer.from('zzzz'), 'z.png') }), 404))
  ok('delete trashes the file and removes the entry; deleting again is harmless', (() => { A('mediaDelete', { id: b.id }); A('mediaDelete', { id: b.id }); return w.log.trashed.includes(b.id) && A('mediaList').items.length === 1 })())
}

console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} Apps Script backend checks passed`)
process.exit(bad ? 1 : 0)
