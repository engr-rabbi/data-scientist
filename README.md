# SMFR Portfolio — Next.js (static) + Google Sheets + GitHub Pages

Data Science / ML / AI portfolio. **হোস্টিং: GitHub Pages · ডাটাবেজ: Google Sheets · ফাইল: Google Drive · ব্যাকএন্ড: Google Apps Script · Admin panel: `/admin`.**

```bash
npm ci
cp .env.example .env       # Apps Script Web app URL + site URL
npm run dev                # http://localhost:3000   (admin: /admin)
```

| Command | কাজ |
|---|---|
| `npm run dev` | ডেভেলপমেন্ট |
| `npm run build` | Google Sheet থেকে কনটেন্ট এনে static সাইট → `./out` |
| `npm start` | `./out` সার্ভ করে দেখা |
| `npm run lint` · `npm run typecheck` | কোড পরীক্ষা |
| `npm run seo:audit` | `./out`-এর SEO পরীক্ষা (robots, sitemap, meta, JSON-LD…) |
| `npm run backend:test` | Google Apps Script ব্যাকএন্ড (Code.gs) ও ক্লায়েন্টের স্বয়ংক্রিয় টেস্ট (Google অ্যাকাউন্ট লাগে না) |
| `npm run test:admin` | Admin editor-এর পরীক্ষা (সব section, ছবি-ঘর, সেকশন-সাজানো, শিরোনাম-নামকরণ) |

**শুরু করুন:** [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) ·
[`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) ·
[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) ·
[`docs/CHANGES.md`](docs/CHANGES.md)

ফাইল: `google-apps-script/Code.gs` (ব্যাকএন্ড — Google Sheet-এ পেস্ট করুন) · `docs/DEPLOYMENT_GUIDE.md` (ধাপে ধাপে গাইড) · `.github/workflows/` (deploy, CI)
