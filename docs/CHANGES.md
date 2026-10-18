# কী বদলানো হয়েছে এবং কেন

আপনার শর্ত: **শুধু GitHub (হোস্টিং) + Supabase (ডাটাবেজ)**, আর একটি Admin panel — তাই architecture সম্পূর্ণ বদলাতে হয়েছে।
UI, ডিজাইন, লেখা, ফর্মের আচরণ ও validation আগের মতোই।

| পরিবর্তন | কারণ |
|---|---|
| **Static export** (`output: 'export'`) → GitHub Pages | GitHub Pages সার্ভার চালায় না। পুরো সাইট আগে থেকেই HTML হয়ে যায় (SEO-র জন্য সেরা) |
| `src/app/api/*` (সব server route), Prisma, `pg`, Vercel/Docker ফাইল **বাদ** | সার্ভার নেই; ডাটাবেজ এখন সরাসরি Supabase |
| **`supabase/schema.sql`** — ১১টি table, index, FK, RLS, Storage bucket/policy | Supabase PostgreSQL; ভিজিটর সরাসরি কোনো table পড়তে/লিখতে পারে না |
| ভিজিটরের কাজ → **SQL function (RPC)**: submit_contact, submit_inquiry, create_booking, manage_booking … | আগের API route-গুলোর validation, honeypot, **IP rate-limit**, slot যাচাই এখন ডাটাবেজেই; booking slot-এ unique index (race condition নেই) |
| `src/lib/api-client.ts` | পুরনো `/api/*` কলের হুবহু চুক্তি রেখে Supabase কল করে — তাই কম্পোনেন্টের লজিক বদলায়নি |
| ফাইল আপলোড → ব্রাউজার থেকে সরাসরি Supabase Storage (private bucket) | Vercel-এর ৪.৫ MB সীমা নেই; ফের ১০ MB/ফাইল। আপলোড কেবল সদ্য-তৈরি inquiry-র ফোল্ডারে (≤৫টি, ৩০ মিনিটের মধ্যে) |
| **Admin panel `/admin`** (Supabase Auth + `admins` table + RLS) | আপনার পূর্ণ নিয়ন্ত্রণ; noindex + robots-এ বন্ধ |
| **Content engine**: `site_content` table → build-time `overrides.json` → `profile.ts` | সাইটের সব লেখা Admin থেকে সম্পাদনা; তবু আউটপুট static HTML (SEO) |
| **Per-page SEO overrides** (`pageSeo`), robots.txt (`/admin` বন্ধ), sitemap.xml (শুধু canonical URL) | SEO নিয়ন্ত্রণ। sitemap থেকে `/#fragment` URL বাদ দিয়েছি — সার্চ ইঞ্জিন fragment উপেক্ষা করে, তাই ওগুলো কেবল হোমপেজের ডুপ্লিকেট |
| `scripts/seo-audit.mjs` | title/description/canonical/h1/OG/JSON-LD/ডুপ্লিকেট/sitemap/robots স্বয়ংক্রিয় যাচাই |
| GitHub Actions: `deploy.yml` (push + ৩০-মিনিট কনটেন্ট-চেক + manual), `ci.yml` (lint, typecheck, build, SEO audit, DB security tests) | স্বয়ংক্রিয় ও পুনরুৎপাদনযোগ্য deploy |
| `REQUIRE_SUPABASE` fail-safe | Supabase না পেলে CI build থামে — admin-এর সম্পাদিত কনটেন্ট হারিয়ে ডিফল্ট কনটেন্ট লাইভ হবে না |
| Geist ফন্ট npm প্যাকেজ থেকে; `ignoreBuildErrors` বাদ; `@types/node` | নেটওয়ার্ক-নির্ভর build নয়; টাইপ-এরর লুকানো হয় না |

## দ্বিতীয় ধাপে যা যোগ হয়েছে
| পরিবর্তন | কারণ |
|---|---|
| `uiText` — শিরোনাম/লেবেল **পুনঃনামকরণ** (`tx()` + `SectionHeading`), তালিকা স্বয়ংক্রিয়ভাবে `scripts/extract-ui-text.mjs` দিয়ে তৈরি (৭৫টি লেখা) | হার্ড-কোড করা সেকশন-শিরোনাম admin থেকে বদলানো। নতুন শিরোনাম কোডে যোগ হলে CI (`--check`) মনে করিয়ে দেয় তালিকা হালনাগাদ করতে |
| `homeSections` — হোমপেজের সেকশন **দেখানো/লুকানো/সাজানো** (`src/app/page.tsx`) | "সেকশন সরানো/যোগ" |
| `homeOnlyLinks` — "Pages" মেনুর হার্ড-কোড লিংক এখন সম্পাদনযোগ্য; `navLinks` যোগ/মোছা/নাম বদল | মেনু নিয়ন্ত্রণ |
| `Service.image` + কার্ড ও পপ-আপে ছবি | সেবার অংশে ছবি |
| Admin: ছবি-ঘর (প্রিভিউ + Media থেকে বাছাই + সরাসরি আপলোড), সেকশন-সাজানোর editor, শিরোনাম-editor | ব্যবহারযোগ্যতা |

## তৃতীয় ধাপ — পূর্ণ কনটেন্ট ম্যানেজমেন্ট
| পরিবর্তন | কারণ |
|---|---|
| `src/config/collections.ts` — ১৫টি কনটেন্ট-ধরনের ফিল্ড-সংজ্ঞা; `collection-manager.tsx` — একই **তালিকা → যোগ → সম্পাদনা (live preview) → Preview → Save → Publish** স্ক্রিন সবার জন্য | ডেভেলপার ছাড়াই যোগ/সম্পাদনা/মোছা/ক্রম/Active-Inactive/Featured |
| `published` / `featured` ফ্ল্যাগ; বন্ধ আইটেম build-এর সময়ই বাদ (`profile.ts`) | মোছা ছাড়াই লুকানো; বন্ধ Case-study-র পেজ/sitemap-ও থাকে না |
| `Service`: `imageAlt`, `imageCaption`, `ctaLink`; `Project`: `summary`, `description`, `results`, `images`, `caseStudyUrl`, `visualAlt`, `visualCaption`, `isDemo`, `featured` — সাইটে প্রদর্শন সহ | আপনার তালিকার সব ফিল্ড |
| `testimonials` (নতুন কালেকশন) + `testimonials.tsx` | আগে শুধু placeholder ছিল; এখন আসল রিভিউ-কার্ড |
| `media_assets` টেবিল + `media.ts` + Media library: SHA-256 ডুপ্লিকেট-রোধ, স্বয়ংক্রিয় resize/WebP, alt/caption, Replace, Used-in, নিরাপদ Delete, ছবি-বাছাই (My library / Built-in) | "একই ছবি duplicate করে স্টোরেজ নষ্ট করা যাবে না" |
| Admin সাইডবার-নেভিগেশন; পুরনো জেনেরিক JSON ফর্ম এখন শুধু "Site settings, menu & SEO"-তে | ব্যবহারযোগ্যতা |
| Services কার্ডের বোতামে এখন `ctaLabel` (যেমন "Analyze My Data") দেখায় (আগে সব কার্ডে "Start This Project") | আপনার "CTA Text" ফিল্ড কার্যকর করতে। ডিফল্ট ফিরিয়ে আনতে CTA text-এ "Start This Project" লিখুন |

## চতুর্থ ধাপ — সাব-ফোল্ডারে হোস্টিং ঠিক করা (`user.github.io/Data-Scientist/`)
| সমস্যা / পরিবর্তন | কারণ |
|---|---|
| লাইভ সাইটে CSS/JS/ফন্ট/ছবি সব 404 — পেজ "লোড হচ্ছে না" | সাইট `/Data-Scientist/` পথে ছিল, কিন্তু সব ফাইল-ঠিকানা root-relative (`/_next/…`, `/profile-photo.jpg`, `/about`) ছিল। আমি সমস্যাটি পুনরুৎপাদন করেছি: ৬৫টি ঠিকানার ৬৫টিই ভাঙা |
| `next.config.ts`: `NEXT_PUBLIC_SITE_URL`-এর পথ থেকে `basePath` স্বয়ংক্রিয় নির্ণয় | কোনো নতুন সেটিং লাগে না; user site / custom domain-এ আগের মতোই |
| `src/lib/base-path.ts` → `withBase()` — ছবির `src`, সাধারণ `<a href>`, `window.location` ও admin প্রিভিউয়ে (১৪টি জায়গা) | `next/image` (unoptimized), `<img>`, `<a>` নিজে prefix পায় না। ডেটায় পথ বহনযোগ্য (`/images/x.jpg`) থাকে, দেখানোর সময় prefix বসে |
| `scripts/check-subpath.mjs` (`npm run check:subpath`) — GitHub Pages-এর মতো সার্ভ করে প্রতিটি লিংক/স্ক্রিপ্ট/স্টাইল/ছবি ফেচ করে | এই ধরনের ভুল ভবিষ্যতে ধরার জন্য; CI-তে সাব-পাথ build + এই পরীক্ষা, Deploy-তেও সতর্কতা |
| SEO audit সাব-পাথ বোঝে | sitemap-এর পথ prefix-সহ মেলানো |

## সীমাবদ্ধতা (সৎভাবে)
- **Project site (`user.github.io/repo`)-এ `robots.txt` কার্যকর হয় না** — Google শুধু হোস্টের root থেকে পড়ে। সেরা SEO-র জন্য repo-র নাম `username.github.io` রাখুন বা custom domain নিন।
- **Preview আনুমানিক**: ডিজাইনের কাছাকাছি কার্ড দেখায়; হুবহু রূপ Publish-এর পর। "View on website" বর্তমান লাইভ রূপ দেখায়।
- **Display order** = তালিকার ক্রম (↑↓ / সংখ্যা-ঘর)। ড্র্যাগ-অ্যান্ড-ড্রপ নেই।
- নতুন service-এর **icon** ৭টি বিদ্যমান আইকন থেকে বাছতে হয়।
- নতুন project **category** আগে "Project filter categories"-এ (Site settings) যোগ করতে হয়, তারপর ড্রপডাউনে আসে।
- Case-study/Insight-এর গভীর কাঠামো (results, sections) জেনেরিক তালিকা-ফর্মে সম্পাদিত হয়।
- ছবি ছোট করা (resize/WebP) ব্রাউজারের canvas-এ হয় — আমি এটি আসল ব্রাউজারে চালাইনি (নিচে "যাচাই")।
- শিরোনাম পুনঃনামকরণ কেবল তালিকাভুক্ত লেখা (সেকশন-শিরোনাম + মেনু/বোতাম) ও `Section heading`-এ চলে। কম্পোনেন্টের ভেতরের ছোট লেবেল/বর্ণনা (যেমন কার্ডের বোতাম "Details") এখনো কোডে — অন্য কোনো লেখা চাইলে বলুন, তালিকায় যোগ করা সহজ।
- কেস-স্টাডির নিজস্ব পেজের (`/case-studies/<slug>`) ভেতরের শিরোনাম পুনঃনামকরণের আওতায় নেই (সেগুলো গতিশীল)।
- **Admin edit-এর পর লাইভ হতে rebuild লাগে (২–৪ মিনিট)** — static সাইটের স্বাভাবিক মূল্য।
- **ইমেইল/webhook notification নেই** (আগের `OWNER_WEBHOOK_URL`)। সার্ভার ছাড়া এটি বিশুদ্ধ GitHub+Supabase-এ সহজ নয়; Admin Dashboard-এ "New" সংখ্যা দেখায়। (চাইলে পরে Supabase Database Webhook যোগ করা যায়।)
- **Calendar subscription URL (ICS feed) নেই**; পরিবর্তে Admin → Bookings থেকে `.ics` ডাউনলোড।
- **HTTP response header** (CSP, HSTS ইত্যাদি) GitHub Pages-এ কাস্টমাইজ করা যায় না। (HTTPS enforce করা যায়।)
- **Rate limit** IP-ভিত্তিক (Supabase-এর `x-forwarded-for` হেডার)। একই IP-র অনেক ব্যবহারকারী একসাথে সীমা ছুঁতে পারে।
- **Anon key প্রকাশ্য** (নকশা অনুযায়ী) — তাই ডাটাবেজের RLS/function-ই একমাত্র সুরক্ষা। এজন্য ৯৩টি স্বয়ংক্রিয় নিরাপত্তা পরীক্ষা আছে (`npm run db:test`)।
- ভিজিটর Storage-এ ফাইল আপলোডের পর ব্যর্থ হলে বিচ্ছিন্ন ফাইল থেকে যেতে পারে (বিরল)।
- কিছু page title ৬০ অক্ষরের বেশি লম্বা (মূল কনটেন্ট) — Admin → Per-page SEO থেকে ছোট করুন।

## UI/UX উন্নয়ন ও বাগ ফিক্স (Hero · Kaggle · Service CTA · Start a Project)
| পরিবর্তন | কারণ |
|---|---|
| **Hero light theme** (`hero.tsx`) — off-white থেকে হালকা teal/নীল gradient, স্থির data-network নকশা; ambient/looping animation বাদ। Navbar কেবল হোমপেজে গাঢ় লেখা ব্যবহার করে (ভেতরের পাতার dark header আগের মতো) | কালো ব্যাকগ্রাউন্ড সরিয়ে পরিষ্কার, প্রিমিয়াম, ভালো contrast। Primary বাটন `teal-700` (সাদা লেখায় ≥ ৫.৪:১) |
| **Kaggle section** (`kaggle-work.tsx`) — Projects & Case Work-এর ঠিক পরে। ছবি/placeholder, category badge, সংক্ষিপ্ত বিবরণ, technology tag, View Details (dialog), View on Kaggle। `/kaggle` পাতাও একই কার্ড ব্যবহার করে | Kaggle কাজ ছবিসহ দেখানো। ছবি না থাকলে বা লোড না হলে সুন্দর placeholder — layout ভাঙে না |
| **Admin → Kaggle activities** ফর্ম বাড়ানো: Category (Competition/Notebook/Dataset), বিস্তারিত বিবরণ, ছবি (upload/preview/replace/remove), Kaggle URL, Related skills, Technologies, Competition result, Featured, Publish, Display order | সব ফিল্ড admin থেকে পরিচালনা। **Result/Kaggle URL যাচাই করা তথ্য হলেই দিন** — ফাঁকা থাকলে কিছুই দেখানো হয় না; ডিফল্ট ডেটায় কোনো অনুমানকৃত তথ্য নেই |
| `resolveHomeSections` / `mergeHomeSections` — আগে সেভ করা homepage layout-এ নতুন সেকশন থাকলে সেটি শেষে না গিয়ে নিজের জায়গায় বসে; admin editor-ও নতুন সারিটি দেখায় | admin একবার layout সেভ করলে Kaggle সেকশন পাতার তলায় চলে যেত |
| **Service details CTA বাগ** (`services.tsx`) — মূল কারণ: dialog-এর উচ্চতা সীমাহীন ছিল আর ছবি scroll-এলাকার বাইরে ছিল, তাই ছবি থাকলে dialog viewport ছাড়িয়ে নিচের CTA কেটে যেত। এখন: fixed header → একটি scroll body (ছবি + বিবরণ) → **pinned footer-এ CTA**। Freelancer বাটনও যোগ | ছবি থাকুক বা না থাকুক, সব device-এ Start This Project / Upwork / Freelancer সবসময় দৃশ্যমান |
| **Start a Project নেভিগেশন** — `scrollToId('start-project')` এখন হোমপেজে স্ক্রল না করে `/start-a-project` পাতা খোলে (hero, navbar, সব service/CTA); service আগে থেকে নির্বাচিত থাকে। পাতার শিরোনাম "Tell Me About Your Project" | হোমপেজের তলার ফর্মে স্বয়ংক্রিয় স্ক্রল বন্ধ |
| নতুন টেস্ট: `home-sections`, `kaggle` (`npm run test:admin`-এ যুক্ত) | নতুন আচরণ রক্ষা |

## ডাটাবেজ পরিবর্তন: Supabase → Google Sheets + Google Drive + Apps Script
| পরিবর্তন | কারণ / নোট |
|---|---|
| **নতুন ব্যাকএন্ড** `google-apps-script/Code.gs` (+ `appsscript.json`) — Google Sheet-এ পেস্ট করা একটিই ফাইল। ৯টি ট্যাব = ডাটাবেজ (`inquiries`, `messages`, `bookings`, `subscribers`, `faq_feedback`, `events`, `content`, `content_history`, `media`); Drive-এ ২টি ফোল্ডার (ব্যক্তিগত attachments, প্রকাশ্য media) | Supabase ছাড়া, বিনা খরচে, ডেটা আপনার নিজের Sheet-এ |
| `src/lib/api-client.ts` পুনর্লিখিত — আগের `apiFetch` চুক্তি অক্ষত, তাই **কোনো ফর্ম/পেজ কম্পোনেন্ট বদলায়নি**। `text/plain` POST (CORS pre-flight এড়াতে), Apps Script-এর "সবসময় HTTP 200" উত্তর আবার সঠিক HTTP status-এ রূপান্তর | Apps Script-এর বৈশিষ্ট্য মেনে |
| `src/lib/admin-api.ts` (নতুন) — ইমেইল + পাসওয়ার্ডে লগইন, ১২ ঘণ্টার স্বাক্ষরিত টোকেন; `supabase-browser.ts` বাদ; Admin পেজ, Dashboard/Inquiries/Messages/Bookings/Subscribers/Content/Media প্যানেল নতুন API-তে | Supabase Auth-এর বদলে |
| Admin পাসওয়ার্ড কোডে থাকে না — `setup()` শুধু salted হ্যাশ রাখে; ১০ বার ভুলে ১৫ মিনিট লকআউট | নিরাপত্তা |
| স্প্যাম সুরক্ষা: honeypot + একই ইমেইল ১০ মিনিটে ৩টি + সামগ্রিক সীমা (Apps Script IP দেখে না) | Supabase-এর IP-ভিত্তিক সীমার বিকল্প |
| সংযুক্ত ফাইল ১০ MB → **৫ MB** (সর্বোচ্চ ৫টি) | Apps Script অনুরোধের আকার নিরাপদ রাখতে |
| Media: ছবি Drive-এ; build-এর সময় `scripts/lib/mirror-media.mjs` ছবিগুলো `public/media/`-তে নামিয়ে সাইটের নিজস্ব ঠিকানায় বসায় (ব্যর্থ হলে Drive ঠিকানা থেকে যায়, build থামে না)। "Replace file" এখন নতুন ফাইল বানিয়ে সব ব্যবহার-স্থান নিজে বদলে দেয় | Drive ফাইলের ভেতর বদলানো যায় না; Drive hot-link সীমা এড়াতে |
| `scripts/fetch-content.mjs` Sheet থেকে কনটেন্ট আনে (৪ বার retry); env: `NEXT_PUBLIC_API_URL`, `REQUIRE_BACKEND` | আগের `NEXT_PUBLIC_SUPABASE_*` / `REQUIRE_SUPABASE`-এর বদলে |
| ইমেইল নোটিফিকেশন (ঐচ্ছিক `NOTIFY_EMAIL`) — নতুন inquiry/বার্তা/booking-এ | নতুন সুবিধা |
| **আগের বাগ ঠিক:** `analytics.ts` সরাসরি `fetch('/api/analytics')` ডাকছিল (static সাইটে 404) — এখন `apiFetch`; ফলে ইভেন্ট সত্যিই `events` ট্যাবে যায় | |
| `supabase/` ফোল্ডার, `@supabase/supabase-js` নির্ভরতা ও `db:test` বাদ। নতুন `backend:test` (Code.gs + ক্লায়েন্ট, Google অ্যাকাউন্ট ছাড়াই) | |
| ডকুমেন্ট: `DEPLOYMENT_GUIDE.md` নতুন করে (ধাপে ধাপে, লোকাল + GitHub), `TROUBLESHOOTING.md`, `PRODUCTION_CHECKLIST.md`, `README.md` আপডেট | |
