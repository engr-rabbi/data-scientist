process.env.NEXT_PUBLIC_BASE_PATH = '/Data-Scientist/'
const { withBase, BASE_PATH } = await import('../src/lib/base-path')
let n = 0, bad = 0; const ok = (name: string, c: boolean) => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name}`) }
ok('trailing slash of the base path is normalised', BASE_PATH === '/Data-Scientist')
ok('root-relative asset gets the prefix', withBase('/images/a.jpg') === '/Data-Scientist/images/a.jpg')
ok('root-relative page gets the prefix', withBase('/contact') === '/Data-Scientist/contact')
ok('already-prefixed path is not prefixed twice', withBase('/Data-Scientist/images/a.jpg') === '/Data-Scientist/images/a.jpg')
ok('absolute URLs are untouched', withBase('https://x.supabase.co/a.webp') === 'https://x.supabase.co/a.webp' && withBase('//cdn.x/a.js') === '//cdn.x/a.js')
ok('hash, mailto, data: and diagram: values are untouched', ['#faq', 'mailto:a@b.c', 'data:image/png;base64,xx', 'diagram:rag', ''].every((v) => withBase(v) === v))
ok('undefined stays undefined', withBase(undefined) === undefined)
console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} base-path checks passed`); process.exit(bad ? 1 : 0)
