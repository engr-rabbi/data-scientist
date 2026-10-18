// In-memory simulation of the Google services used by google-apps-script/Code.gs
// (SpreadsheetApp, DriveApp, PropertiesService, CacheService, LockService, Utilities, ContentService, MailApp).
//
// It deliberately reproduces behaviours that bite in the real thing, so the tests catch them:
//   • a Sheets cell NOT formatted as plain text ("@") turns "123" into a number, ISO timestamps into
//     Dates, "true" into a boolean and "=1+1" into a formula
//   • a range outside the sheet grid throws
//   • the script lock is NOT re-entrant (waiting for a lock you already hold would hang for real)
//   • base64 decoding of an unpadded web-safe string is rejected (strict mode)
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const CODE_PATH = path.resolve(HERE, '../../google-apps-script/Code.gs')

const signed = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b))
const unsigned = (arr) => Buffer.from(arr.map((b) => b & 255))

export function createWorld(opts = {}) {
  const clock = { now: opts.now ?? Date.UTC(2026, 9, 15, 4, 0, 0) } // Thu 15 Oct 2026, 10:00 Dhaka
  const log = { mails: [], sleeps: 0, trashed: [] }
  const props = new Map()
  const cacheStore = new Map()
  let lockHeld = false

  /* ------------------------------- Date ------------------------------- */
  class FakeDate extends Date {
    constructor(...a) { if (a.length === 0) super(clock.now); else super(...a) }
    static now() { return clock.now }
  }

  /* ------------------------------ Spreadsheet ------------------------------ */
  const coerce = (v, fmt) => {
    if (fmt === '@' || typeof v !== 'string') return v
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v)
    if (v === 'true' || v === 'false') return v === 'true'
    if (v.startsWith('=')) return { formula: v }
    return v
  }
  class Range {
    constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }) }
    check() {
      if (this.r < 1 || this.c < 1 || this.nr < 1 || this.nc < 1) throw new Error('Range coordinates out of bounds')
      if (this.r + this.nr - 1 > this.sh.maxRows || this.c + this.nc - 1 > this.sh.maxCols) throw new Error('The coordinates of the range are outside the dimensions of the sheet.')
    }
    getValues() { this.check(); const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(this.sh.get(this.r + i, this.c + j)); out.push(row) } return out }
    setValues(vals) {
      this.check()
      if (vals.length !== this.nr || vals.some((r) => r.length !== this.nc)) throw new Error(`The number of rows/columns in the data does not match the range (${this.nr}x${this.nc}).`)
      vals.forEach((row, i) => row.forEach((v, j) => this.sh.set(this.r + i, this.c + j, v, true)))
      return this
    }
    setNumberFormat(f) { this.check(); for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.setFmt(this.r + i, this.c + j, f); return this }
    clearContent() { this.check(); for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.set(this.r + i, this.c + j, '', false); return this }
    setFontWeight() { return this }
  }
  class Sheet {
    constructor(name) { this.name = name; this.vals = []; this.fmts = []; this.maxRows = 1000; this.maxCols = 26; this.frozen = 0 }
    get(r, c) { const v = (this.vals[r - 1] || [])[c - 1]; return v === undefined ? '' : v }
    set(r, c, v, convert) { (this.vals[r - 1] ||= [])[c - 1] = convert ? coerce(v, (this.fmts[r - 1] || [])[c - 1]) : v }
    setFmt(r, c, f) { (this.fmts[r - 1] ||= [])[c - 1] = f }
    getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc) }
    getLastRow() { for (let r = this.vals.length; r >= 1; r--) if ((this.vals[r - 1] || []).some((v) => v !== '' && v !== undefined)) return r; return 0 }
    getMaxRows() { return this.maxRows }
    insertRowsAfter(after, n) { this.maxRows += n; this.vals.splice(after, 0, ...Array.from({ length: n }, () => [])); this.fmts.splice(after, 0, ...Array.from({ length: n }, () => [])) }
    deleteRow(r) { this.deleteRows(r, 1) }
    deleteRows(r, n) { if (r < 1 || r + n - 1 > this.maxRows) throw new Error('bad row'); this.vals.splice(r - 1, n); this.fmts.splice(r - 1, n); this.maxRows -= n }
    setFrozenRows(n) { this.frozen = n }
  }
  const spreadsheets = new Map()
  class Spreadsheet {
    constructor(id) { this.id = id; this.sheets = [new Sheet('Sheet1')] }
    getId() { return this.id }
    getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null }
    insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s }
    getSheets() { return this.sheets }
    deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s) }
  }
  const mainSheet = new Spreadsheet('SHEET-ID-123'); spreadsheets.set(mainSheet.id, mainSheet)
  const SpreadsheetApp = {
    getActiveSpreadsheet: () => mainSheet,
    openById: (id) => { const s = spreadsheets.get(id); if (!s) throw new Error('No spreadsheet ' + id); return s },
  }

  /* --------------------------------- Drive --------------------------------- */
  const files = new Map(), folders = new Map()
  class Blob {
    constructor(bytes, type, name) { this.bytes = bytes; this.type = type; this.name = name }
    getBytes() { return signed(this.bytes) }
    getDataAsString() { return this.bytes.toString('utf8') }
    getContentType() { return this.type }
    getName() { return this.name }
  }
  class DriveFile {
    constructor(blob, folderId) { this.id = 'F' + randomUUID().replace(/-/g, '').slice(0, 28); this.blob = blob; this.folderId = folderId; this.sharing = 'PRIVATE'; this.trashed = false; files.set(this.id, this) }
    getId() { return this.id }
    getUrl() { return `https://drive.google.com/file/d/${this.id}/view?usp=drivesdk` }
    setSharing(access, perm) { this.sharing = access + ':' + perm; return this }
    setTrashed(t) { this.trashed = t; if (t) log.trashed.push(this.id); return this }
    getBlob() { return this.blob }
  }
  class Folder {
    constructor(name) { this.name = name; this.id = 'D' + randomUUID().replace(/-/g, '').slice(0, 28); folders.set(this.id, this) }
    getId() { return this.id }
    createFile(blob) { return new DriveFile(blob, this.id) }
  }
  const DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK', PRIVATE: 'PRIVATE' }, Permission: { VIEW: 'VIEW' },
    createFolder: (n) => new Folder(n),
    getFolderById: (id) => { const f = folders.get(id); if (!f) throw new Error('No folder'); return f },
    getFileById: (id) => { const f = files.get(id); if (!f || f.trashed) throw new Error('No file ' + id); return f },
  }

  /* ------------------------ Properties / Cache / Lock ------------------------ */
  const PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => { props.set(k, String(v)) } }) }
  const CacheService = {
    getScriptCache: () => ({
      get: (k) => { const e = cacheStore.get(k); if (!e) return null; if (e.exp <= clock.now) { cacheStore.delete(k); return null } return e.v },
      put: (k, v, ttl = 600) => { if (String(k).length > 250) throw new Error('Key too long'); cacheStore.set(k, { v: String(v), exp: clock.now + ttl * 1000 }) },
      remove: (k) => { cacheStore.delete(k) },
    }),
  }
  const LockService = {
    getScriptLock: () => ({
      waitLock: () => { if (lockHeld) throw new Error('Lock timeout (a lock was requested while already held — real Apps Script would hang)'); lockHeld = true },
      releaseLock: () => { lockHeld = false },
    }),
  }

  /* -------------------------------- Utilities -------------------------------- */
  const b64pad = (s) => s
  const Utilities = {
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    getUuid: () => randomUUID(),
    computeDigest: (_alg, v) => signed(createHash('sha256').update(typeof v === 'string' ? Buffer.from(v, 'utf8') : unsigned(v)).digest()),
    computeHmacSha256Signature: (v, key) => signed(createHmac('sha256', key).update(typeof v === 'string' ? Buffer.from(v, 'utf8') : unsigned(v)).digest()),
    base64Encode: (v) => (typeof v === 'string' ? Buffer.from(v, 'utf8') : unsigned(v)).toString('base64'),
    base64EncodeWebSafe: (v) => (typeof v === 'string' ? Buffer.from(v, 'utf8') : unsigned(v)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'), // padded, like the real one
    base64Decode: (s) => { if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4) throw new Error('Cannot decode base64'); return signed(Buffer.from(s, 'base64')) },
    base64DecodeWebSafe: (s) => { if (!/^[A-Za-z0-9_-]*={0,2}$/.test(s) || s.length % 4) throw new Error('Cannot decode web-safe base64 (strict: padding required)'); return signed(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')) },
    newBlob: (bytes, type = 'application/octet-stream', name = 'blob') => new Blob(unsigned(bytes), type, name),
    sleep: () => { log.sleeps++ },
  }

  /* ------------------------------ Content / Mail ------------------------------ */
  const ContentService = {
    MimeType: { JSON: 'JSON' },
    createTextOutput: (t) => ({ t, mime: null, setMimeType(m) { this.mime = m; return this }, getContent() { return this.t } }),
  }
  const MailApp = { sendEmail: (m) => { log.mails.push(m) } }

  /* ----------------------------- load Code.gs ----------------------------- */
  const ctx = vm.createContext({
    SpreadsheetApp, DriveApp, PropertiesService, CacheService, LockService, Utilities, ContentService, MailApp,
    console: { log() {}, warn() {}, error: opts.verboseErrors ? console.error : () => {} },
    Date: FakeDate, JSON, Math, Object, Array, String, Number, isFinite, isNaN, parseInt, parseFloat, RegExp, Error,
  })
  vm.runInContext(readFileSync(CODE_PATH, 'utf8') + '\n;this.__exports = { doGet, doPost, setup, checkSetup, CONFIG, SHEETS }', ctx, { filename: 'Code.gs' })
  const X = ctx.__exports

  const parse = (out) => JSON.parse(out.getContent())
  return {
    clock, log, props, files, folders, mainSheet, X,
    advance: (ms) => { clock.now += ms },
    post: (body) => parse(X.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body), type: 'text/plain' } })),
    get: (params = {}) => parse(X.doGet({ parameter: params })),
    /** Install like the guide says: edit CONFIG, run setup() */
    install(cfg = {}) {
      Object.assign(X.CONFIG, { ADMIN_EMAIL: 'owner@example.com', ADMIN_PASSWORD: 'a-long-test-password-123', NOTIFY_EMAIL: '' }, cfg)
      return X.setup()
    },
    rows: (tab) => { const sh = mainSheet.getSheetByName(tab); const last = sh.getLastRow(); return last < 2 ? [] : sh.getRange(2, 1, last - 1, X.SHEETS[tab].length).getValues().map((r) => Object.fromEntries(X.SHEETS[tab].map((c, i) => [c, r[i]]))) },
  }
}
