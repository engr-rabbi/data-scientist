# Common Errors & Fixes

## Deploy / GitHub

| লক্ষণ | কারণ ও সমাধান |
|---|---|
| Deploy workflow লাল: `NEXT_PUBLIC_API_URL is not set` | GitHub → Settings → Secrets and variables → Actions → **Variables** ট্যাবে `NEXT_PUBLIC_API_URL` (Web app URL) ও `NEXT_PUBLIC_SITE_URL` দিন (Secrets ট্যাবে নয়) |
| Deploy: `could not fetch content: …` | `NEXT_PUBLIC_API_URL` ভুল/অসম্পূর্ণ (`…/exec`-এ শেষ হতে হবে) বা Web app-এর "Who has access" `Anyone` নয়। ব্রাউজারে `<URL>?action=ping` খুলে `{"ok":true…}` আসে কিনা দেখুন। Google মাঝেমধ্যে সাময়িক ত্রুটি দেয় — স্ক্রিপ্ট ৪ বার চেষ্টা করে; তবু ব্যর্থ হলে Run workflow আবার চালান |
| `Get Pages site failed` / Pages deploy ব্যর্থ | Settings → Pages → Source = **GitHub Actions** করুন |
| সাইট খোলে কিন্তু **ডিজাইন/CSS নেই, বোতাম কাজ করে না** (শুধু লেখা দেখা যায়) | সাইট সাব-ফোল্ডারে (`user.github.io/RepoName/`) চলছে আর কোড/ঠিকানা সেটির জন্য প্রস্তুত নয়। দুটি জিনিস মিলিয়ে দেখুন: **(১)** আপনি কোডের সর্বশেষ সংস্করণ (সাব-ফোল্ডার সমর্থন সহ) push করেছেন; **(২)** GitHub Variable `NEXT_PUBLIC_SITE_URL` = `https://username.github.io/RepoName` — পথসহ, শেষে `/` নয়, **বড়-ছোট হাতের অক্ষর repo-নামের সাথে হুবহু মিলতে হবে** → Actions → Deploy site → Run workflow। যাচাই: `NEXT_PUBLIC_SITE_URL=<ঠিকানা> npm run build && npm run check:subpath` — "failing to load: 0" হওয়া উচিত। ব্রাউজারে F12 → Network ট্যাবে লাল (404) ফাইলগুলো দেখলেও কারণ বোঝা যায় |
| sitemap/canonical-এ `localhost` বা `example.com` | `NEXT_PUBLIC_SITE_URL` variable ঠিক করে workflow আবার চালান |
| `/about` খোলে না, `/about.html` খোলে | সাধারণত DNS/cache; GitHub Pages `.html` ছাড়াও সার্ভ করে। কিছুক্ষণ পর আবার; Pages-এর Source ঠিক আছে কিনা দেখুন |
| `git push` প্রত্যাখ্যাত (`non-fast-forward`) | repo-তে README ছিল। `git pull --rebase origin main --allow-unrelated-histories` তারপর push |
| `.env` ভুলে GitHub-এ গেছে | `.env`-এ শুধু প্রকাশ্য ঠিকানা থাকার কথা, গোপন কিছু নেই। তবু `git rm --cached .env`, commit, push। (Web app URL ফাঁস হলে ক্ষতি সীমিত: Admin-এর কাজে পাসওয়ার্ড লাগে। চাইলে নতুন deployment বানিয়ে URL বদলান) |
| Scheduled auto-publish চলছে না | Public repo-তে ৬০ দিন কোনো কার্যকলাপ না থাকলে GitHub scheduled workflow বন্ধ করে। Actions ট্যাব → Enable। মাঝেমধ্যে একটি commit দিন |

## Admin

| লক্ষণ | সমাধান |
|---|---|
| "The backend is not configured" | `.env` / GitHub Variables-এ `NEXT_PUBLIC_API_URL` নেই; দিয়ে আবার build/deploy করুন |
| `Invalid email or password.` | `CONFIG`-এর `ADMIN_EMAIL`/`ADMIN_PASSWORD` যা দিয়ে `setup` চালিয়েছিলেন তা-ই দিন। ভুলে গেলে `CONFIG`-এ নতুন দিয়ে `setup` আবার চালান (গাইড ধাপ ১৩) |
| `Too many failed sign-in attempts` | পরপর ১০ বার ভুল — ১৫ মিনিট অপেক্ষা করুন |
| `Please sign in again` / সেশন শেষ | লগইন ১২ ঘণ্টা মেয়াদের। আবার ঢুকুন |
| Save-এ `The server is busy` | একই সময়ে আরেকটি কাজ চলছিল; কয়েক সেকেন্ড পর আবার চেষ্টা করুন |
| `The server is temporarily unavailable` | Google-এর স্ক্রিপ্ট সাময়িক ব্যস্ত/কোটা শেষ। এক মিনিট পর আবার। দীর্ঘস্থায়ী হলে Apps Script → **Executions** ট্যাবে ত্রুটি দেখুন |
| লগইন পেজ আসে না / সব অনুরোধ ব্যর্থ, DevTools-এ CORS ত্রুটি | Deploy-এর "Who has access" = **Anyone** নয়। Manage deployments → ✏️ Edit → Anyone → New version → Deploy |
| `Code.gs` বদলালাম কিন্তু লাইভে আগের আচরণ | নতুন **Version** Deploy করা হয়নি (গাইড ধাপ ১২) |
| Save হলো কিন্তু সাইটে দেখা যাচ্ছে না | সাইট static; **Publish** করুন (বা ৩০ মিনিট অপেক্ষা)। Publish ট্যাবে "live: … database: …" মিলিয়ে দেখুন। ব্রাউজার cache-ও (Ctrl+F5) |
| "Publish now" → GitHub 404 | repo নাম `owner/repo` ঠিক আছে? workflow ফাইল `deploy.yml`? token-এ **Actions: Read and write** আছে ও শুধু এই repo-র জন্য? |
| "Publish now" → 403/401 | token মেয়াদোত্তীর্ণ বা অনুমতি কম |
| Inquiry-র ফাইল খুলছে না | ফাইল Drive-এর ব্যক্তিগত ফোল্ডারে; যে Google অ্যাকাউন্টে স্ক্রিপ্ট বানিয়েছেন **সেই অ্যাকাউন্টে ব্রাউজারে লগইন** আছে কিনা দেখুন |
| Content ফর্মে "structure changed" | কোনো তালিকাকে লেখায় (বা উল্টো) বদলেছেন। JSON ভিউতে ঠিক করুন, অথবা Restore version / Reset |
| ভুল JSON লিখে সেকশন নষ্ট | Restore version (ইতিহাসে শেষ ২০টি সংস্করণ) বা Reset to default |
| `This content is too large to save` | একটি সেকশনের JSON ১.৫ MB-এর বেশি। বড় লেখা/ছবির ডেটা কমান (ছবি Media library-তে রাখুন, JSON-এ ঠিকানা দিন) |

## কনটেন্ট ও ছবি

| লক্ষণ | সমাধান |
|---|---|
| Media library-তে ছবি আপলোড ব্যর্থ | ছবি ≤৫ MB (অপ্টিমাইজের পর) ও PNG/JPG/WEBP/GIF/AVIF কিনা; `checkSetup` চালিয়ে Drive ফোল্ডার `OK` কিনা দেখুন। অফিস/স্কুল Google Workspace হলে অ্যাডমিন "Anyone with the link" শেয়ারিং বন্ধ রাখতে পারে — তখন ব্যক্তিগত Gmail ব্যবহার করুন |
| "Cannot save yet — #3: … is required" | সেই আইটেমের নাম/শিরোনাম খালি; পূরণ করুন বা আইটেমটি মুছুন |
| Save করলাম, সাইটে বদলায়নি | সাইট static — **Publish** করুন (বা ≤৩০ মিনিট)। Active/Published টিক আছে কিনা দেখুন |
| আইটেম সাইটে আসছে না | অবস্থা *Inactive/Unpublished* নয় তো? তালিকায় ধূসর দেখায় |
| নতুন project-এর category ড্রপডাউনে নেই | Site settings → "Project filter categories"-এ আগে যোগ করুন |
| "already in the library — reused" | ঠিক আছে — একই ছবি আগেই ছিল, নতুন কপি হয়নি |
| "still over 5 MB after optimisation" | ছবির রেজোলিউশন/মান কমিয়ে আবার দিন |
| ছবি Replace করার পর পুরনো দেখাচ্ছে | Replace নতুন ফাইল বানিয়ে সাইটের সব জায়গা নতুনটিতে বদলায় — তারপর **Publish** করতে হবে। ব্রাউজার ক্যাশ হলে Ctrl+F5 |
| ছবি Delete করার পর সাইটে ভাঙা ছবি | ছবিটি তখনও কোনো আইটেমে ছিল ("Used in" দেখতে হতো) — সেই আইটেমে অন্য ছবি দিন, Publish করুন |
| Case-study লিংক 404 | সেটি Unpublished, বা slug বদলেছে — slug শুধু প্রথম publish-এর আগে বদলান |

## ফর্ম / Visitor

| লক্ষণ | কারণ ও সমাধান |
|---|---|
| ফর্মে "The site backend is not configured" | build-এর সময় `NEXT_PUBLIC_API_URL` ছিল না → Variable দিয়ে আবার deploy |
| "Something went wrong" / "temporarily unavailable" | Google-এর স্ক্রিপ্ট সাময়িক ব্যস্ত বা দৈনিক কোটা শেষ। ব্রাউজারে `<URL>?action=ping` খুলে দেখুন; Apps Script → **Executions**-এ ত্রুটি দেখুন |
| সব ফর্ম ব্যর্থ, কনসোলে CORS/redirect ত্রুটি | Deploy-এর "Who has access" **Anyone** করুন; `/exec` ঠিকানা (`/dev` নয়) ব্যবহার করুন |
| "Too many attempts" (429) | অন্তর্ভুক্ত সীমা: একই ইমেইল থেকে ১০ মিনিটে ৩টির বেশি নয় (এবং সামগ্রিক সীমা)। অপেক্ষা করুন |
| "That time is no longer available" | slot পেরিয়ে গেছে / ছুটির দিন / lead time (৩ ঘণ্টা) / নিয়ম বদলেছে। পেজ রিফ্রেশ। Booking নিয়ম Admin → Content → "Booking rules" |
| Booking-এর ক্যালেন্ডার admin বদলানোর পরও পুরনো | Booking গ্রিড সাইটের build-এ থাকে; **Publish** করুন। (সার্ভার-পক্ষ নিয়ম তাৎক্ষণিক কার্যকর — পুরনো স্লট বুক করলে ভদ্র error আসে) |
| ফাইল আপলোডে "Could not upload your attachments" | ফাইল ≤**৫ MB** ও অনুমোদিত ধরন (CSV/XLSX/XLS/PDF/ZIP/DOCX/PNG/JPG/WEBP) কিনা; সর্বোচ্চ ৫টি ফাইল। ব্যর্থ হলে অর্ধেক-জমা inquiry নিজে মুছে যায় |
| Drive-এ ফাইল আছে কিন্তু inquiry নেই | বিরল (নেটওয়ার্ক মাঝপথে কাটলে)। `SMFR Portfolio - attachments` ফোল্ডার থেকে হাতে মুছুন |
| ইমেইল নোটিফিকেশন আসছে না | `NOTIFY_EMAIL` ফাঁকা বা ভুল (Code.gs `CONFIG` বদলে `setup` আবার চালান); Google-এর দৈনিক ইমেইল সীমা; স্প্যাম ফোল্ডার |

## Local

| লক্ষণ | সমাধান |
|---|---|
| `npm run build` — "NEXT_PUBLIC_API_URL not set — building with the default content" | স্বাভাবিক (`.env` না থাকলে)। আপনার সম্পাদিত কনটেন্ট দেখতে `.env`-এ Web app URL বসান |
| Build-এ `REQUIRE_BACKEND` ত্রুটি | শুধু CI-তে চালু; লোকালে `REQUIRE_BACKEND` সেট করবেন না |
| `npm start` | `./out` ফোল্ডার সার্ভ করে (`npm run build` আগে)। `.env`-এ `NEXT_PUBLIC_SITE_URL` অবশ্যই `http://localhost:3000` রাখুন |
| `npm run backend:test` | ব্যাকএন্ড (Code.gs) ও ক্লায়েন্টের স্বয়ংক্রিয় টেস্ট। কোনো Google অ্যাকাউন্ট লাগে না — Google সার্ভিসের অনুকরণ ব্যবহার করে |
| `Port 3000 is in use` | `npx next dev -p 3001` |

## Google-সংক্রান্ত

| লক্ষণ | সমাধান |
|---|---|
| `setup` চালালে "Edit CONFIG…" ত্রুটি | `ADMIN_EMAIL` আসল ইমেইল ও `ADMIN_PASSWORD` ≥১২ অক্ষরের দিন |
| "Authorization required" বারবার | **Review permissions → Advanced → Go to … (unsafe) → Allow** — স্ক্রিপ্টটি আপনার নিজের, তাই নিরাপদ |
| `checkSetup`-এ `MISSING` | `setup` আবার চালান (ডেটা মোছে না) |
| Sheet-এ ট্যাব নেই / কলাম মুছে ফেলেছেন | `setup` আবার চালালে ট্যাব ও হেডার ফিরে আসে (আগের ডেটা থাকে)। **কলামের ক্রম/নাম বদলাবেন না** |
| তারিখ/ফোন নম্বর অদ্ভুত দেখাচ্ছে | কোষগুলো "Plain text" ফরম্যাটে থাকে — ফরম্যাট বদলাবেন না |
| Quota exceeded / "Service invoked too many times" | Google-এর দৈনিক সীমা; পরের দিন (প্যাসিফিক সময় মধ্যরাত) পুনরায় চালু হয়। বেশি ট্র্যাফিকে `events` ট্র্যাকিং ছোট রাখুন |
