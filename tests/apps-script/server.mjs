// A local stand-in for the DEPLOYED Apps Script web app. It runs the real Code.gs (via harness.mjs) and
// reproduces how Google serves it: every answer is HTTP 200 JSON, the first response is a 302 redirect to
// a "googleusercontent" echo URL, only text/plain (CORS-simple) POSTs are accepted, no pre-flight support.
import http from 'node:http'
import { createWorld } from './harness.mjs'

export async function startFakeGas(port = 0, worldOpts = {}) {
  const w = createWorld(worldOpts)
  w.install({ NOTIFY_EMAIL: worldOpts.notify || '' })
  const pending = new Map(); let seq = 0
  const srv = http.createServer((req, res) => {
    const base = `http://127.0.0.1:${srv.address().port}`
    const url = new URL(req.url, base)
    if (url.pathname.startsWith('/echo/')) {
      const id = url.pathname.slice(6); const body = pending.get(id); pending.delete(id)
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }); return res.end(body ?? '{}')
    }
    if (req.method === 'OPTIONS') { res.writeHead(405); return res.end() }
    const finish = (out) => { const id = String(++seq); pending.set(id, JSON.stringify(out)); res.writeHead(302, { location: `${base}/echo/${id}` }); res.end() }
    if (req.method === 'GET' && url.pathname === '/exec') return finish(w.get(Object.fromEntries(url.searchParams)))
    if (req.method === 'POST' && url.pathname === '/exec') {
      if (!/^text\/plain/.test(req.headers['content-type'] || '')) { res.writeHead(415); return res.end('only simple text/plain POSTs') }
      let data = ''; req.on('data', (c) => (data += c)); req.on('end', () => finish(w.post(data))); return
    }
    res.writeHead(404); res.end()
  })
  await new Promise((r) => srv.listen(port, '127.0.0.1', r))
  return { w, srv, url: `http://127.0.0.1:${srv.address().port}/exec`, close: () => new Promise((r) => srv.close(r)) }
}
