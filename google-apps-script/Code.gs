/**
 * =====================================================================
 *  SMFR Portfolio — Google Sheets backend  (Google Apps Script web app)
 * =====================================================================
 *  The Google Sheet this script is attached to IS the database:
 *    inquiries · messages · bookings · subscribers · faq_feedback · events
 *    content · content_history · media         (one tab each)
 *  Google Drive holds the files:
 *    "SMFR Portfolio - media"        public pictures used on the website
 *    "SMFR Portfolio - attachments"  private files visitors attach to inquiries
 *
 *  HOW TO INSTALL: follow docs/DEPLOYMENT_GUIDE.md (step by step).
 *  Short version: paste this file into Extensions → Apps Script, edit the
 *  CONFIG block below, run setup() once, then Deploy → New deployment → Web app.
 *
 *  SECURITY MODEL
 *   • The web-app URL is public (it ends up in the site's JavaScript). Visitors
 *     can only call the PUBLIC actions below; each one validates its input.
 *   • Every ADMIN action needs a signed session token that is issued only after
 *     a correct e-mail + password. The password is stored only as a salted hash.
 *   • Apps Script cannot see a visitor's IP address, so abuse protection works
 *     with global + per-e-mail limits and a hidden "honeypot" field instead.
 * =====================================================================
 */

/* ---------------------------------------------------------------------
 * CONFIG — edit these three lines, run setup(), then BLANK the password.
 * ------------------------------------------------------------------- */
var CONFIG = {
  ADMIN_EMAIL: 'you@example.com',              // the e-mail you will type on /admin
  ADMIN_PASSWORD: 'CHANGE-THIS-TO-A-LONG-PASSWORD', // 12+ characters. Blank it after setup() ran.
  NOTIFY_EMAIL: ''                             // optional: get an e-mail for every new inquiry / message / booking
};

/* ---------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------- */
var SHEETS = {
  inquiries: ['id', 'created_at', 'updated_at', 'status', 'name', 'company', 'email', 'whatsapp', 'country',
    'service_category', 'project_title', 'description', 'business_goal', 'deliverable', 'budget_range',
    'deadline', 'contact_method', 'admin_notes', 'attachments'],
  messages: ['id', 'created_at', 'status', 'name', 'email', 'subject', 'message'],
  bookings: ['id', 'created_at', 'updated_at', 'status', 'name', 'email', 'whatsapp', 'agenda', 'slot_utc', 'tz_offset', 'tz_name'],
  subscribers: ['id', 'created_at', 'email', 'source', 'active'],
  faq_feedback: ['id', 'created_at', 'slug', 'helpful'],
  events: ['created_at', 'event', 'label', 'path', 'referrer'],
  content: ['key', 'part', 'json', 'updated_at'],
  content_history: ['id', 'key', 'part', 'json', 'saved_at'],
  media: ['id', 'file_name', 'mime_type', 'size_bytes', 'width', 'height', 'sha256', 'alt', 'caption', 'created_at', 'updated_at']
};

var CHUNK = 40000;                    // a Google Sheets cell holds at most 50,000 characters
var HISTORY_KEEP = 20;                // versions kept per content section
var EVENTS_MAX = 20000;               // analytics rows kept (oldest are trimmed)
var SESSION_HOURS = 12;
var MAX_UPLOAD_BYTES = 5 * 1024 * 1024;   // per file (inquiry attachments and pictures)
var DHAKA_OFFSET_MIN = 360;           // Asia/Dhaka is fixed UTC+6 (no daylight saving)
var INQUIRY_EXT = ['csv', 'xlsx', 'xls', 'pdf', 'zip', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
var IMAGE_TYPES = { 'image/png': 1, 'image/jpeg': 1, 'image/webp': 1, 'image/gif': 1, 'image/avif': 1 };
var INQUIRY_STATUS = ['new', 'reviewing', 'replied', 'won', 'lost', 'archived'];
var MESSAGE_STATUS = ['new', 'read', 'replied', 'archived'];
var BOOKING_STATUS = ['proposed', 'confirmed', 'cancelled', 'expired'];
var BOOKING_DEFAULTS = {
  slotMinutes: 30, workdays: [0, 1, 2, 3, 4], startHourDhaka: 10, endHourDhaka: 18,
  leadTimeMinutes: 180, calendarDaysAhead: 20, maxDays: 12, blockedDateKeys: []
};

/* ---------------------------------------------------------------------
 * Entry points
 * ------------------------------------------------------------------- */
function doGet(e) {
  return respond(function () {
    var action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'ping') return { ok: true, service: 'smfr-portfolio-sheets', time: new Date().toISOString() };
    if (action === 'version') return { ok: true, version: withLock(contentVersion) };
    if (action === 'content') return withLock(function () { return { ok: true, version: contentVersion(), items: contentAll() }; });
    return fail(404, 'Not found');
  });
}

function doPost(e) {
  return respond(function () {
    var body;
    try { body = JSON.parse((e && e.postData && e.postData.contents) || ''); } catch (err) { return fail(400, 'Invalid request.'); }
    if (!body || typeof body !== 'object' || typeof body.action !== 'string') return fail(400, 'Invalid request.');
    var pub = PUBLIC_ACTIONS[body.action];
    if (pub) return pub(body);
    var adm = ADMIN_ACTIONS[body.action];
    if (adm) {
      if (body.action !== 'login') requireAdmin(body.token);
      return adm(body);
    }
    return fail(404, 'Not found');
  });
}

/** Runs a handler and turns the result (or a thrown ApiError) into a JSON response. */
function respond(fn) {
  var out;
  try {
    out = fn();
  } catch (err) {
    if (err && err.__api) out = { ok: false, status: err.status, error: err.message };
    else {
      console.error(err && err.stack ? err.stack : String(err));
      out = { ok: false, status: 500, error: 'Something went wrong. Please try again.' };
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function fail(status, message) { throw { __api: true, status: status, message: message }; }

/* ---------------------------------------------------------------------
 * Setup (run ONCE from the editor: select "setup" → Run)
 * ------------------------------------------------------------------- */
function setup() {
  var password = CONFIG.ADMIN_PASSWORD;
  if (!password || password === 'CHANGE-THIS-TO-A-LONG-PASSWORD' || password.length < 12) {
    throw new Error('Edit CONFIG at the top of the file first: set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
  }
  if (!validEmail(CONFIG.ADMIN_EMAIL) || CONFIG.ADMIN_EMAIL === 'you@example.com') {
    throw new Error('Edit CONFIG at the top of the file first: set ADMIN_EMAIL to your real e-mail address.');
  }
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props.setProperty('SHEET_ID', ss.getId());

  Object.keys(SHEETS).forEach(function (name) {
    var cols = SHEETS[name];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setNumberFormat('@').setValues([cols]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    // Plain-text format for every cell: keeps ISO dates, phone numbers and "+/=/-" values exactly as typed.
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), cols.length).setNumberFormat('@');
  });
  var blank = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  if (!props.getProperty('MEDIA_FOLDER_ID')) props.setProperty('MEDIA_FOLDER_ID', DriveApp.createFolder('SMFR Portfolio - media').getId());
  if (!props.getProperty('FILES_FOLDER_ID')) props.setProperty('FILES_FOLDER_ID', DriveApp.createFolder('SMFR Portfolio - attachments').getId());
  if (!props.getProperty('SESSION_SECRET')) props.setProperty('SESSION_SECRET', Utilities.getUuid() + Utilities.getUuid());

  var salt = Utilities.getUuid();
  props.setProperty('ADMIN_EMAIL', CONFIG.ADMIN_EMAIL.trim().toLowerCase());
  props.setProperty('ADMIN_SALT', salt);
  props.setProperty('ADMIN_HASH', hashPassword(password, salt));
  props.setProperty('NOTIFY_EMAIL', (CONFIG.NOTIFY_EMAIL || '').trim());

  var msg = 'Setup finished. Next: (1) blank the ADMIN_PASSWORD in CONFIG and save, (2) Deploy → New deployment → Web app.';
  console.log(msg);
  return msg;
}

/** Optional: run from the editor to check that everything is in place. */
function checkSetup() {
  var props = PropertiesService.getScriptProperties();
  var report = {};
  ['SHEET_ID', 'MEDIA_FOLDER_ID', 'FILES_FOLDER_ID', 'SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_HASH'].forEach(function (k) { report[k] = props.getProperty(k) ? 'OK' : 'MISSING — run setup()'; });
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  Object.keys(SHEETS).forEach(function (n) { report['tab:' + n] = ss.getSheetByName(n) ? 'OK' : 'MISSING — run setup()'; });
  report.notify = props.getProperty('NOTIFY_EMAIL') || '(none)';
  console.log(JSON.stringify(report, null, 2));
  return report;
}

/* ---------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------- */
function prop(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function nowIso() { return new Date().toISOString(); }
function newId() { return Utilities.getUuid().replace(/-/g, ''); }
function str(v) { return typeof v === 'string' ? v : ''; }
function trim(v) { return str(v).trim(); }
function validEmail(e) { return typeof e === 'string' && e.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
function toHex(bytes) { return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }
function sha256Hex(s) { return toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }

function withLock(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) { fail(503, 'The server is busy. Please try again in a moment.'); }
  try { return fn(); } finally { lock.releaseLock(); }
}

var _ss = null;
function spreadsheet() {
  if (!_ss) {
    var id = prop('SHEET_ID');
    if (!id) fail(503, 'The site backend is not set up yet. Please contact me directly.');
    _ss = SpreadsheetApp.openById(id);
  }
  return _ss;
}
function sheet(name) {
  var sh = spreadsheet().getSheetByName(name);
  if (!sh) fail(503, 'The site backend is not set up yet. Please contact me directly.');
  return sh;
}

function cell(v) {
  if (v instanceof Date) return v.toISOString();
  return v === null || v === undefined ? '' : String(v);
}

/** All data rows of a tab as objects (every value a string) with the sheet row number in _row. */
function readRows(name) {
  var cols = SHEETS[name], sh = sheet(name), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    cols.forEach(function (c, j) { o[c] = cell(r[j]); });
    return o;
  });
}

function rowValues(name, obj) { return SHEETS[name].map(function (c) { var v = obj[c]; return v === undefined || v === null ? '' : String(v); }); }

function writeRow(name, rowIndex, obj) {
  var sh = sheet(name), cols = SHEETS[name];
  if (rowIndex > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);
  var rg = sh.getRange(rowIndex, 1, 1, cols.length);
  rg.setNumberFormat('@');
  rg.setValues([rowValues(name, obj)]);
}
function appendObj(name, obj) { var sh = sheet(name); writeRow(name, sh.getLastRow() + 1, obj); }

/** Rewrites a whole tab (used for small tabs where rows are removed/replaced in bulk). */
function replaceAllRows(name, objs) {
  var cols = SHEETS[name], sh = sheet(name), last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, cols.length).clearContent();
  if (!objs.length) return;
  if (objs.length + 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), objs.length + 1 - sh.getMaxRows() + 50);
  var rg = sh.getRange(2, 1, objs.length, cols.length);
  rg.setNumberFormat('@');
  rg.setValues(objs.map(function (o) { return rowValues(name, o); }));
}

function findById(name, id) {
  var rows = readRows(name);
  for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
  return null;
}
function deleteRowById(name, id) {
  var r = findById(name, id);
  if (!r) return false;
  sheet(name).deleteRow(r._row);
  return true;
}

/* ---------- abuse protection (no IP available → global + per-key limits) ---------- */
function rateLimit(scope, key, limit, windowSec) {
  var cache = CacheService.getScriptCache();
  var k = 'rl:' + scope + ':' + (key ? sha256Hex(String(key).toLowerCase()).slice(0, 24) : '*');
  var now = Date.now(), raw = cache.get(k), o = raw ? JSON.parse(raw) : null;
  if (!o || now - o.s > windowSec * 1000) o = { s: now, n: 0 };
  o.n++;
  cache.put(k, JSON.stringify(o), Math.min(21600, windowSec + 5));
  if (o.n > limit) fail(429, 'Too many attempts. Please try again later.');
}

function notify(subject, lines) {
  var to = prop('NOTIFY_EMAIL');
  if (!to) return;
  try { MailApp.sendEmail({ to: to, subject: '[Portfolio] ' + subject, body: lines.join('\n') }); } catch (e) { console.warn('notify failed: ' + e); }
}

/* ---------------------------------------------------------------------
 * PUBLIC actions (visitors)
 * ------------------------------------------------------------------- */
var PUBLIC_ACTIONS = {
  contact: function (b) {
    var n = trim(b.name), e = trim(b.email), s = trim(b.subject), m = trim(b.message);
    rateLimit('contact', null, 40, 600);
    if (validEmail(e)) rateLimit('contact-email', e, 3, 600);
    if (str(b.website)) return { ok: true };                                           // honeypot
    if (n.length < 2 || n.length > 120) fail(400, 'Please enter your name');
    if (!validEmail(e)) fail(400, 'Please enter a valid email');
    if (s.length > 160) fail(400, 'Subject is too long');
    if (m.length < 10) fail(400, 'Please write a short message (at least 10 characters)');
    if (m.length > 4000) fail(400, 'Message is too long');
    appendObj('messages', { id: newId(), created_at: nowIso(), status: 'new', name: n, email: e, subject: s, message: m });
    notify('New message from ' + n, ['Name: ' + n, 'Email: ' + e, 'Subject: ' + s, '', m]);
    return { ok: true };
  },

  newsletter: function (b) {
    var e = trim(b.email), src = (trim(b.source) || 'footer').slice(0, 40);
    rateLimit('newsletter', null, 60, 600);
    if (validEmail(e)) rateLimit('newsletter-email', e, 3, 600);
    if (str(b.website)) return { ok: true };
    if (!validEmail(e)) fail(400, 'Please enter a valid email address');
    withLock(function () {
      var low = e.toLowerCase(), rows = readRows('subscribers'), hit = null;
      for (var i = 0; i < rows.length; i++) if (rows[i].email === low) { hit = rows[i]; break; }
      if (hit) { hit.active = 'true'; writeRow('subscribers', hit._row, hit); }
      else appendObj('subscribers', { id: newId(), created_at: nowIso(), email: low, source: src, active: 'true' });
    });
    return { ok: true };
  },

  faq_feedback: function (b) {
    rateLimit('faq', null, 200, 600);
    if (!/^faq-[a-z0-9-]{1,120}$/.test(str(b.slug)) || typeof b.helpful !== 'boolean') fail(400, 'Validation failed');
    appendObj('faq_feedback', { id: newId(), created_at: nowIso(), slug: b.slug, helpful: b.helpful ? 'true' : 'false' });
    return { ok: true };
  },

  track: function (b) {
    try { rateLimit('track', null, 120, 60); } catch (err) { return { ok: true }; }   // never error, silently drop
    var ev = trim(b.event);
    if (!ev || ev.length > 60) return { ok: true };
    var sh = sheet('events');
    appendObj('events', { created_at: nowIso(), event: ev, label: trim(b.label).slice(0, 200), path: trim(b.path).slice(0, 300), referrer: trim(b.referrer).slice(0, 300) });
    if (sh.getLastRow() > EVENTS_MAX + 1) sh.deleteRows(2, 5000);                      // keep the tab from growing forever
    return { ok: true };
  },

  /* ---- project inquiries (+ attachments in Drive) ---- */
  submit_inquiry: function (b) {
    rateLimit('inquiry', null, 30, 600);
    var email = trim(b.email);
    if (validEmail(email)) rateLimit('inquiry-email', email, 3, 600);
    if (str(b.website)) return { ok: true, id: 'ok' };
    var f = {
      name: trim(b.name), company: trim(b.company), email: email, whatsapp: trim(b.whatsapp), country: trim(b.country),
      service_category: trim(b.serviceCategory), project_title: trim(b.projectTitle), description: trim(b.description),
      business_goal: trim(b.businessGoal), deliverable: trim(b.deliverable), budget_range: trim(b.budgetRange),
      deadline: trim(b.deadline), contact_method: trim(b.contactMethod)
    };
    if (f.name.length < 2 || f.name.length > 120) fail(400, 'Please enter your name');
    if (!validEmail(f.email)) fail(400, 'Please enter a valid email');
    if (f.service_category.length < 1 || f.service_category.length > 80) fail(400, 'Please choose a service category');
    if (f.project_title.length < 3 || f.project_title.length > 160) fail(400, 'Please add a short project title');
    if (f.description.length < 30) fail(400, 'Please describe the project (at least 30 characters)');
    if (f.description.length > 6000 || f.business_goal.length > 2000 || f.deliverable.length > 500 || f.company.length > 160 ||
        f.whatsapp.length > 40 || f.country.length > 80 || f.budget_range.length > 60 || f.deadline.length > 60) fail(400, 'One of the fields is too long');
    if (f.contact_method.length < 1 || f.contact_method.length > 40) fail(400, 'Please choose a contact method');
    var id = newId(), t = nowIso();
    f.id = id; f.created_at = t; f.updated_at = t; f.status = 'new'; f.admin_notes = ''; f.attachments = '[]';
    appendObj('inquiries', f);
    notify('New project inquiry: ' + f.project_title, ['From: ' + f.name + ' <' + f.email + '>', 'Service: ' + f.service_category, 'Budget: ' + f.budget_range,
      'Deadline: ' + f.deadline, 'Preferred contact: ' + f.contact_method, '', f.description, '', 'Open the Admin → Inquiries tab (or the "inquiries" tab of your Google Sheet).']);
    return { ok: true, id: id };
  },

  upload_inquiry_file: function (b) {
    rateLimit('attach', null, 60, 600);
    var id = str(b.inquiryId);
    if (!/^[a-z0-9]{20,40}$/.test(id)) fail(400, 'Invalid request.');
    var name = str(b.fileName), ext = (name.split('.').pop() || '').toLowerCase();
    if (!name || name.length > 120 || !/^[A-Za-z0-9._-]+$/.test(name) || INQUIRY_EXT.indexOf(ext) === -1) fail(400, 'One of the files is not allowed.');
    var data = str(b.data);
    if (!data || data.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 16) fail(400, 'One of the files is not allowed.');
    var bytes;
    try { bytes = Utilities.base64Decode(data); } catch (err) { fail(400, 'One of the files is not allowed.'); }
    if (!bytes || bytes.length < 1 || bytes.length > MAX_UPLOAD_BYTES) fail(400, 'One of the files is not allowed.');

    return withLock(function () {
      var row = findById('inquiries', id);
      if (!row || Date.now() - Date.parse(row.created_at) > 30 * 60 * 1000) fail(404, 'Inquiry not found or expired.');
      var list = parseJson(row.attachments, []);
      if (list.length >= 5) fail(400, 'Maximum 5 files allowed.');
      var mime = (str(b.mimeType) || 'application/octet-stream').slice(0, 100);
      var file = DriveApp.getFolderById(prop('FILES_FOLDER_ID')).createFile(Utilities.newBlob(bytes, mime, id.slice(0, 8) + '_' + name));
      list.push({ id: newId(), file_name: name, file_path: file.getId(), file_size: bytes.length, mime_type: mime, url: file.getUrl() });
      row.attachments = JSON.stringify(list);
      row.updated_at = nowIso();
      writeRow('inquiries', row._row, row);
      return { ok: true };
    });
  },

  abort_inquiry: function (b) {
    var id = str(b.inquiryId);
    if (!/^[a-z0-9]{20,40}$/.test(id)) return { ok: true };
    withLock(function () {
      var row = findById('inquiries', id);
      if (row && Date.now() - Date.parse(row.created_at) < 30 * 60 * 1000) removeInquiryRow(row);
    });
    return { ok: true };
  },

  /* ---- discovery-call bookings ---- */
  booking_summary: function () {
    return withLock(function () {
      var cfg = bookingCfg(), now = Date.now();
      // proposals nobody confirmed for 30 days expire
      readRows('bookings').forEach(function (r) {
        if (r.status === 'proposed' && now - Date.parse(r.created_at) > 30 * 86400000) { r.status = 'expired'; writeRow('bookings', r._row, r); }
      });
      var taken = takenSlots(), counts = {};
      bookableDays(now, cfg).forEach(function (day) {
        var n = 0;
        slotsForDay(day, cfg).forEach(function (s) { if (Date.parse(s) >= now + cfg.leadTimeMinutes * 60000 && !taken[s]) n++; });
        counts[day] = n;
      });
      return { counts: counts };
    });
  },

  booking_taken: function (b) {
    var date = str(b.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(400, 'Invalid date. Use YYYY-MM-DD.');
    var list = readRows('bookings').filter(function (r) { return (r.status === 'proposed' || r.status === 'confirmed') && dhakaParts(Date.parse(r.slot_utc)).key === date; })
      .map(function (r) { return r.slot_utc; }).sort();
    return { taken: list };
  },

  create_booking: function (b) {
    var email = trim(b.email);
    rateLimit('book', null, 40, 600);
    if (validEmail(email)) rateLimit('book-email', email, 3, 600);
    if (str(b.website)) return { ok: true, id: 'ok' };
    var name = trim(b.name), agenda = trim(b.agenda), wa = trim(b.whatsapp), tzName = trim(b.tzName), off = Number(b.tzOffset);
    if (name.length < 2 || name.length > 120) fail(400, 'Please enter your name');
    if (!validEmail(email)) fail(400, 'Please enter a valid email');
    if (agenda.length < 10 || agenda.length > 1000) fail(400, 'Please describe what you want to discuss (at least 10 characters)');
    if (wa.length > 40 || tzName.length > 60 || !isFinite(off) || off < -840 || off > 840) fail(400, 'Validation failed');
    var slotMs = /^\d{4}-\d{2}-\d{2}T/.test(str(b.slot)) ? Date.parse(b.slot) : NaN;
    return withLock(function () {
      var cfg = bookingCfg();
      if (isNaN(slotMs) || !isValidSlot(slotMs, cfg)) fail(400, 'That time is no longer available — please pick another slot.');
      var slot = new Date(slotMs).toISOString();
      if (takenSlots()[slot]) fail(409, 'That slot was just taken — please choose a different time.');
      var id = newId(), t = nowIso();
      appendObj('bookings', { id: id, created_at: t, updated_at: t, status: 'proposed', name: name, email: email, whatsapp: wa, agenda: agenda, slot_utc: slot, tz_offset: String(Math.trunc(off)), tz_name: tzName });
      notify('New call booking: ' + name, ['Slot (Dhaka): ' + dhakaParts(slotMs).key + ' ' + ('0' + dhakaParts(slotMs).hour).slice(-2) + ':' + ('0' + dhakaParts(slotMs).minute).slice(-2),
        'From: ' + name + ' <' + email + '>', 'Agenda: ' + agenda, '', 'Confirm or cancel it in Admin → Bookings.']);
      return { ok: true, id: id };
    });
  },

  manage_booking: function (b) {
    rateLimit('manage', null, 60, 600);
    var ref = str(b.ref), email = trim(b.email), action = str(b.verb);   // "verb": the body's own "action" field names the route
    if (!/^[a-z0-9]{20,40}$/.test(ref)) fail(400, 'Please enter the reference ID from your confirmation.');
    if (!validEmail(email)) fail(400, 'Please enter the email you booked with');
    if (action !== 'lookup' && action !== 'cancel') fail(400, 'Validation failed');
    return withLock(function () {
      var r = findById('bookings', ref);
      if (!r || r.email.toLowerCase() !== email.toLowerCase()) fail(404, 'No proposal found for that reference ID and email combination.');
      if (action === 'lookup') return { ok: true, status: r.status, slotUtc: r.slot_utc, tzName: r.tz_name || null, createdAt: r.created_at, name: r.name };
      if (r.status !== 'proposed') {
        fail(409, r.status === 'cancelled' ? 'This proposal was already cancelled.'
          : 'This proposal can no longer be cancelled here (status: ' + r.status + '). Please reach out on WhatsApp.');
      }
      r.status = 'cancelled'; r.updated_at = nowIso();
      writeRow('bookings', r._row, r);
      return { ok: true, status: 'cancelled', slotUtc: r.slot_utc };
    });
  }
};

/* ---------- booking rules (same as src/lib/booking.ts; business timezone Asia/Dhaka) ---------- */
function parseJson(s, fallback) { try { var v = JSON.parse(s); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; } }

function bookingCfg() {
  var saved = null;
  contentAll().forEach(function (it) { if (it.key === 'bookingSettings') saved = it.value; });
  var cfg = {};
  Object.keys(BOOKING_DEFAULTS).forEach(function (k) { cfg[k] = BOOKING_DEFAULTS[k]; });
  if (saved && typeof saved === 'object') Object.keys(saved).forEach(function (k) { if (k in BOOKING_DEFAULTS) cfg[k] = saved[k]; });
  return cfg;
}
function dhakaParts(ms) {
  var d = new Date(ms + DHAKA_OFFSET_MIN * 60000);
  return { key: d.toISOString().slice(0, 10), dow: d.getUTCDay(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}
function bookableDays(nowMs, cfg) {
  var out = [], base = Date.parse(dhakaParts(nowMs).key + 'T00:00:00Z');
  for (var i = 0; i < cfg.calendarDaysAhead && out.length < cfg.maxDays; i++) {
    var d = new Date(base + i * 86400000), key = d.toISOString().slice(0, 10);
    if (cfg.workdays.indexOf(d.getUTCDay()) > -1 && cfg.blockedDateKeys.indexOf(key) === -1) out.push(key);
  }
  return out;
}
function slotsForDay(dayKey, cfg) {
  var total = Math.floor(((cfg.endHourDhaka - cfg.startHourDhaka) * 60) / cfg.slotMinutes), base = Date.parse(dayKey + 'T00:00:00Z') - DHAKA_OFFSET_MIN * 60000, out = [];
  for (var i = 0; i < total; i++) out.push(new Date(base + (cfg.startHourDhaka * 60 + i * cfg.slotMinutes) * 60000).toISOString());
  return out;
}
function isValidSlot(ms, cfg) {
  if (ms % 60000 !== 0) return false;
  var p = dhakaParts(ms);
  if (p.minute % cfg.slotMinutes !== 0) return false;
  if (p.hour < cfg.startHourDhaka || p.hour >= cfg.endHourDhaka) return false;
  if (cfg.workdays.indexOf(p.dow) === -1) return false;
  if (bookableDays(Date.now(), cfg).indexOf(p.key) === -1) return false;
  return ms >= Date.now() + cfg.leadTimeMinutes * 60000;
}
function takenSlots() {
  var m = {};
  readRows('bookings').forEach(function (r) { if (r.status === 'proposed' || r.status === 'confirmed') m[r.slot_utc] = true; });
  return m;
}

/* ---------------------------------------------------------------------
 * Website content (one JSON document per section, split into ≤40,000-char cells)
 * ------------------------------------------------------------------- */
function chunkify(s) {
  var out = [];
  for (var i = 0; i < s.length; i += CHUNK) out.push(s.slice(i, i + CHUNK));
  return out.length ? out : [''];
}

/** [{key, value, updated_at}] for every saved section. */
function contentAll() {
  var groups = {}, order = [];
  readRows('content').forEach(function (r) {
    if (!groups[r.key]) { groups[r.key] = { parts: [], updated_at: r.updated_at }; order.push(r.key); }
    groups[r.key].parts.push({ p: Number(r.part), j: r.json });
    if (r.updated_at > groups[r.key].updated_at) groups[r.key].updated_at = r.updated_at;
  });
  var out = [];
  order.forEach(function (k) {
    var g = groups[k];
    g.parts.sort(function (a, b) { return a.p - b.p; });
    var value = parseJson(g.parts.map(function (x) { return x.j; }).join(''), undefined);
    if (value !== undefined) out.push({ key: k, value: value, updated_at: g.updated_at });
  });
  return out;
}

function contentVersion() {
  var rows = readRows('content'), max = '', keys = {};
  rows.forEach(function (r) { keys[r.key] = true; if (r.updated_at > max) max = r.updated_at; });
  return (max || 'none') + ':' + Object.keys(keys).length;
}

function validKey(k) { return typeof k === 'string' && /^[A-Za-z0-9_]{1,60}$/.test(k); }

function contentWriteRows(key, valueJson, stamp) {
  return chunkify(valueJson).map(function (c, i) { return { key: key, part: String(i), json: c, updated_at: stamp }; });
}

function saveContent(key, value) {
  var json = JSON.stringify(value);
  if (json === undefined || json.length > 1500000) fail(400, 'This content is too large to save.');
  var t = nowIso(), rows = readRows('content'), hist = readRows('content_history');
  var old = rows.filter(function (r) { return r.key === key; });
  var kept = rows.filter(function (r) { return r.key !== key; });
  if (old.length) {
    // the previous version moves into the history; only the newest HISTORY_KEEP versions of this key stay
    var oldJson = old.slice().sort(function (a, b) { return Number(a.part) - Number(b.part); }).map(function (r) { return r.json; }).join('');
    var hid = String(Date.now());
    chunkify(oldJson).forEach(function (c, i) { hist.push({ id: hid, key: key, part: String(i), json: c, saved_at: t }); });
    var ids = {};
    hist.forEach(function (h) { if (h.key === key) ids[h.id] = true; });
    var keep = Object.keys(ids).sort(function (a, b) { return Number(b) - Number(a); }).slice(0, HISTORY_KEEP);
    hist = hist.filter(function (h) { return h.key !== key || keep.indexOf(h.id) > -1; });
    replaceAllRows('content_history', hist);
  }
  replaceAllRows('content', kept.concat(contentWriteRows(key, json, t)));
  return { key: key, value: value, updated_at: t };
}

/* ---------------------------------------------------------------------
 * Admin authentication (e-mail + password → signed session token)
 * ------------------------------------------------------------------- */
function hashPassword(password, salt) {
  var h = salt + ':' + password;
  for (var i = 0; i < 1000; i++) h = sha256Hex(h + salt);
  return h;
}
function safeEqual(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function sign(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, prop('SESSION_SECRET'))).replace(/=+$/, '');
}
function makeToken(email) {
  var exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({ e: email, x: exp })).replace(/=+$/, '');
  return { token: payload + '.' + sign(payload), expiresAt: exp };
}
function requireAdmin(token) {
  var t = str(token), dot = t.indexOf('.');
  if (dot < 1 || !prop('SESSION_SECRET')) fail(401, 'Please sign in again.');
  var payload = t.slice(0, dot), sig = t.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) fail(401, 'Please sign in again.');
  while (payload.length % 4) payload += '=';   // the token is stored without padding; the decoder wants it
  var data = parseJson(Utilities.newBlob(Utilities.base64DecodeWebSafe(payload)).getDataAsString(), null);
  if (!data || typeof data.x !== 'number' || data.x < Date.now() || data.e !== prop('ADMIN_EMAIL')) fail(401, 'Your session expired. Please sign in again.');
  return data.e;
}

/* ---------------------------------------------------------------------
 * ADMIN actions (need a valid token, except "login")
 * ------------------------------------------------------------------- */
var ADMIN_ACTIONS = {
  login: function (b) {
    var cache = CacheService.getScriptCache(), fails = Number(cache.get('login-fails') || 0);
    if (fails >= 10) fail(429, 'Too many failed sign-in attempts. Please wait 15 minutes and try again.');
    var email = trim(b.email).toLowerCase(), password = str(b.password);
    var ok = prop('ADMIN_HASH') && safeEqual(email, prop('ADMIN_EMAIL')) & safeEqual(hashPassword(password, prop('ADMIN_SALT')), prop('ADMIN_HASH'));
    if (!ok) {
      cache.put('login-fails', String(fails + 1), 900);
      Utilities.sleep(1000);
      fail(401, 'Invalid email or password.');
    }
    cache.remove('login-fails');
    var t = makeToken(prop('ADMIN_EMAIL'));
    return { ok: true, token: t.token, email: prop('ADMIN_EMAIL'), expiresAt: t.expiresAt };
  },

  whoami: function () { return { ok: true, email: prop('ADMIN_EMAIL') }; },

  dashboard: function () {
    var now = Date.now(), d30 = now - 30 * 86400000, d14 = now - 14 * 86400000;
    var inq = readRows('inquiries'), msg = readRows('messages'), bk = readRows('bookings'), sub = readRows('subscribers'),
      fb = readRows('faq_feedback'), ev = readRows('events');
    function top(rows, field, n) {
      var c = {};
      rows.forEach(function (r) { if (r[field]) c[r[field]] = (c[r[field]] || 0) + 1; });
      return Object.keys(c).map(function (k) { var o = { n: c[k] }; o[field] = k; return o; }).sort(function (a, b) { return b.n - a.n; }).slice(0, n);
    }
    var recent = ev.filter(function (r) { return Date.parse(r.created_at) > d30; });
    var daily = {};
    ev.forEach(function (r) { if (Date.parse(r.created_at) > d14) { var k = r.created_at.slice(0, 10); daily[k] = (daily[k] || 0) + 1; } });
    return {
      new_inquiries: inq.filter(function (r) { return r.status === 'new'; }).length, total_inquiries: inq.length,
      new_messages: msg.filter(function (r) { return r.status === 'new'; }).length, total_messages: msg.length,
      proposed_bookings: bk.filter(function (r) { return r.status === 'proposed'; }).length,
      upcoming_bookings: bk.filter(function (r) { return (r.status === 'proposed' || r.status === 'confirmed') && Date.parse(r.slot_utc) >= now; }).length,
      subscribers: sub.filter(function (r) { return r.active === 'true'; }).length,
      events_30d: recent.length,
      faq_helpful: fb.filter(function (r) { return r.helpful === 'true'; }).length,
      faq_unhelpful: fb.filter(function (r) { return r.helpful !== 'true'; }).length,
      top_events: top(recent, 'event', 10), top_paths: top(recent, 'path', 10),
      daily_events: Object.keys(daily).sort().map(function (k) { return { day: k, n: daily[k] }; })
    };
  },

  list: function (b) {
    var sh = str(b.sheet), rows;
    if (sh === 'inquiries') {
      rows = readRows('inquiries').map(function (r) { var o = strip(r); o.inquiry_attachments = parseJson(r.attachments, []); delete o.attachments; return o; })
        .sort(byDesc('created_at')).slice(0, 300);
    } else if (sh === 'messages') {
      rows = readRows('messages').map(strip).sort(byDesc('created_at')).slice(0, 300);
    } else if (sh === 'bookings') {
      rows = readRows('bookings').map(function (r) { var o = strip(r); o.tz_offset = Number(o.tz_offset); return o; }).sort(byDesc('slot_utc')).slice(0, 300);
    } else if (sh === 'subscribers') {
      rows = readRows('subscribers').map(function (r) { var o = strip(r); o.active = r.active === 'true'; return o; }).sort(byDesc('created_at')).slice(0, 2000);
    } else fail(400, 'Unknown list.');
    return { ok: true, rows: rows };
  },

  update: function (b) {
    var sh = str(b.sheet), id = str(b.id), patch = b.patch && typeof b.patch === 'object' ? b.patch : {};
    return withLock(function () {
      var r = findById(sh, id);
      if (!r || ['inquiries', 'messages', 'bookings', 'subscribers'].indexOf(sh) === -1) fail(404, 'Not found.');
      if (sh === 'inquiries') {
        if ('status' in patch) { if (INQUIRY_STATUS.indexOf(patch.status) === -1) fail(400, 'Invalid status.'); r.status = patch.status; }
        if ('admin_notes' in patch) r.admin_notes = str(patch.admin_notes).slice(0, 4000);
      } else if (sh === 'messages') {
        if ('status' in patch) { if (MESSAGE_STATUS.indexOf(patch.status) === -1) fail(400, 'Invalid status.'); r.status = patch.status; }
      } else if (sh === 'bookings') {
        if ('status' in patch) {
          if (BOOKING_STATUS.indexOf(patch.status) === -1) fail(400, 'Invalid status.');
          if ((patch.status === 'proposed' || patch.status === 'confirmed') && r.status !== patch.status) {
            var taken = readRows('bookings').some(function (o) { return o.id !== r.id && o.slot_utc === r.slot_utc && (o.status === 'proposed' || o.status === 'confirmed'); });
            if (taken) fail(409, 'Another active booking already holds this time slot.');
          }
          r.status = patch.status;
        }
      } else if (sh === 'subscribers') {
        if ('active' in patch) r.active = patch.active === true ? 'true' : 'false';
      }
      if (SHEETS[sh].indexOf('updated_at') > -1) r.updated_at = nowIso();
      writeRow(sh, r._row, r);
      return { ok: true };
    });
  },

  remove: function (b) {
    var sh = str(b.sheet), id = str(b.id);
    if (['inquiries', 'messages', 'bookings', 'subscribers'].indexOf(sh) === -1) fail(404, 'Not found.');
    return withLock(function () {
      var r = findById(sh, id);
      if (!r) return { ok: true };
      if (sh === 'inquiries') removeInquiryRow(r); else sheet(sh).deleteRow(r._row);
      return { ok: true };
    });
  },

  /* ---- site content ---- */
  contentAll: function () { return { ok: true, items: withLock(contentAll) }; },

  contentSave: function (b) {
    if (!validKey(b.key)) fail(400, 'Invalid content key.');
    return withLock(function () { return { ok: true, item: saveContent(b.key, b.value) }; });
  },

  contentDelete: function (b) {
    if (!validKey(b.key)) fail(400, 'Invalid content key.');
    return withLock(function () {
      var rows = readRows('content'), hist = readRows('content_history'), old = rows.filter(function (r) { return r.key === b.key; });
      if (old.length) {   // keep the removed version in the history so it can be restored
        var oldJson = old.slice().sort(function (a, c) { return Number(a.part) - Number(c.part); }).map(function (r) { return r.json; }).join('');
        var hid = String(Date.now());
        chunkify(oldJson).forEach(function (c, i) { hist.push({ id: hid, key: b.key, part: String(i), json: c, saved_at: nowIso() }); });
        replaceAllRows('content_history', hist);
      }
      replaceAllRows('content', rows.filter(function (r) { return r.key !== b.key; }));
      return { ok: true };
    });
  },

  contentHistory: function (b) {
    if (!validKey(b.key)) fail(400, 'Invalid content key.');
    return withLock(function () {
      var groups = {};
      readRows('content_history').forEach(function (h) {
        if (h.key !== b.key) return;
        if (!groups[h.id]) groups[h.id] = { id: Number(h.id), saved_at: h.saved_at, parts: [] };
        groups[h.id].parts.push({ p: Number(h.part), j: h.json });
      });
      var items = Object.keys(groups).map(function (k) {
        var g = groups[k];
        g.parts.sort(function (a, c) { return a.p - c.p; });
        return { id: g.id, saved_at: g.saved_at, value: parseJson(g.parts.map(function (x) { return x.j; }).join(''), null) };
      }).sort(function (a, c) { return c.id - a.id; }).slice(0, HISTORY_KEEP);
      return { ok: true, items: items };
    });
  },

  /* ---- picture library (files in Drive, metadata in the "media" tab) ---- */
  mediaList: function () {
    return { ok: true, items: readRows('media').map(mediaOut).sort(byDesc('created_at')).slice(0, 500) };
  },

  mediaFindByHash: function (b) {
    var h = str(b.sha256), hit = null;
    readRows('media').forEach(function (r) { if (r.sha256 === h && h) hit = r; });
    return { ok: true, asset: hit ? mediaOut(hit) : null };
  },

  mediaUpload: function (b) {
    var f = checkImage(b);
    return withLock(function () {
      var dup = null;
      readRows('media').forEach(function (r) { if (r.sha256 === f.hash) dup = r; });
      if (dup) return { ok: true, duplicate: true, asset: mediaOut(dup) };
      var row = storeImage(f, trim(b.alt), trim(b.caption));
      return { ok: true, duplicate: false, asset: mediaOut(row) };
    });
  },

  /**
   * Replaces the FILE of a library picture. Drive cannot swap the bytes of an existing
   * file from a script, so a new file is created and every place on the website that used
   * the old picture is switched to the new one automatically.
   */
  mediaReplace: function (b) {
    var f = checkImage(b), oldId = str(b.id);
    return withLock(function () {
      var old = findById('media', oldId);
      if (!old) fail(404, 'Picture not found.');
      var clash = false;
      readRows('media').forEach(function (r) { if (r.sha256 === f.hash && r.id !== oldId) clash = true; });
      if (clash) fail(409, 'That picture is already in the library as another entry — use that one instead.');
      var row = storeImage(f, old.alt, old.caption, old._row);
      // point everything that used the old picture at the new one
      var rows = readRows('content'), changed = false, stamp = nowIso();
      var items = contentAll(), rewritten = [];
      items.forEach(function (it) {
        var json = JSON.stringify(it.value);
        if (json.indexOf(oldId) > -1) rewritten.push({ key: it.key, json: json.split(oldId).join(row.id) });
      });
      if (rewritten.length) {
        var keysDone = {}; rewritten.forEach(function (r) { keysDone[r.key] = true; });
        var rest = rows.filter(function (r) { return !keysDone[r.key]; });
        rewritten.forEach(function (r) { rest = rest.concat(contentWriteRows(r.key, r.json, stamp)); });
        replaceAllRows('content', rest);
        changed = true;
      }
      try { DriveApp.getFileById(oldId).setTrashed(true); } catch (e) { /* already gone */ }
      return { ok: true, asset: mediaOut(row), contentUpdated: changed };
    });
  },

  mediaMeta: function (b) {
    return withLock(function () {
      var r = findById('media', str(b.id));
      if (!r) fail(404, 'Picture not found.');
      r.alt = str(b.alt).slice(0, 300); r.caption = str(b.caption).slice(0, 500); r.updated_at = nowIso();
      writeRow('media', r._row, r);
      return { ok: true };
    });
  },

  mediaDelete: function (b) {
    return withLock(function () {
      var r = findById('media', str(b.id));
      if (!r) return { ok: true };
      try { DriveApp.getFileById(r.id).setTrashed(true); } catch (e) { /* already gone */ }
      sheet('media').deleteRow(r._row);
      return { ok: true };
    });
  }
};

/* ---------- admin helpers ---------- */
function strip(r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== '_row') o[k] = r[k]; }); return o; }
function byDesc(field) { return function (a, b) { return a[field] < b[field] ? 1 : a[field] > b[field] ? -1 : 0; }; }

function removeInquiryRow(row) {
  parseJson(row.attachments, []).forEach(function (a) {
    try { DriveApp.getFileById(a.file_path).setTrashed(true); } catch (e) { /* already gone */ }
  });
  sheet('inquiries').deleteRow(row._row);
}

function mediaUrl(id) { return 'https://lh3.googleusercontent.com/d/' + id; }
function mediaOut(r) {
  return {
    id: r.id, path: r.id, url: mediaUrl(r.id), file_name: r.file_name, mime_type: r.mime_type, size_bytes: Number(r.size_bytes),
    width: r.width ? Number(r.width) : null, height: r.height ? Number(r.height) : null, sha256: r.sha256 || null,
    alt: r.alt || '', caption: r.caption || '', created_at: r.created_at
  };
}

function checkImage(b) {
  var mime = str(b.mimeType), name = str(b.fileName).slice(0, 120), hash = str(b.sha256), data = str(b.data);
  if (!IMAGE_TYPES[mime]) fail(400, 'Only PNG, JPG, WEBP, GIF or AVIF pictures are allowed.');
  if (!/^[a-f0-9]{64}$/.test(hash)) fail(400, 'Invalid picture hash.');
  if (!data || data.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 16) fail(400, 'The picture is larger than 5 MB.');
  var bytes;
  try { bytes = Utilities.base64Decode(data); } catch (e) { fail(400, 'The picture could not be read.'); }
  if (!bytes || !bytes.length || bytes.length > MAX_UPLOAD_BYTES) fail(400, 'The picture is larger than 5 MB.');
  return { mime: mime, name: name || 'image', hash: hash, bytes: bytes, width: Number(b.width) || '', height: Number(b.height) || '' };
}

function storeImage(f, alt, caption, replaceRow) {
  var safe = f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image';
  var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }[f.mime];
  var file = DriveApp.getFolderById(prop('MEDIA_FOLDER_ID')).createFile(Utilities.newBlob(f.bytes, f.mime, f.hash.slice(0, 10) + '-' + safe + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var t = nowIso();
  var row = { id: file.getId(), file_name: f.name, mime_type: f.mime, size_bytes: String(f.bytes.length), width: String(f.width), height: String(f.height),
    sha256: f.hash, alt: alt || '', caption: caption || '', created_at: t, updated_at: t };
  if (replaceRow) writeRow('media', replaceRow, row); else appendObj('media', row);
  return row;
}
