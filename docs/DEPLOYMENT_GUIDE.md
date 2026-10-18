# Google Sheets ডাটাবেজ দিয়ে সাইট চালু করা — ধাপে ধাপে গাইড

এই গাইড শেষ করলে আপনার কাছে থাকবে:

- 🌐 **GitHub Pages-এ লাইভ ওয়েবসাইট** (বিনামূল্যে)
- 📊 **Google Sheet = আপনার ডাটাবেজ** — Contact বার্তা, Project inquiry, Booking, Subscriber সব আপনার নিজের Google Sheet-এ জমা হবে (আপনি সরাসরি দেখতে, ফিল্টার করতে, ডাউনলোড করতে পারবেন)
- 📁 **Google Drive = ফাইল রাখার জায়গা** — ক্লায়েন্টের পাঠানো ফাইল (ব্যক্তিগত ফোল্ডারে) ও আপনার আপলোড করা ছবি
- 🔐 **`/admin` প্যানেল** — আপনার নিজের ইমেইল + পাসওয়ার্ড দিয়ে লগইন, সাইটের সব কনটেন্ট সেখান থেকে বদলানো
- ✉️ ঐচ্ছিক: নতুন inquiry/বার্তা/booking এলে **আপনার ইমেইলে নোটিফিকেশন**

> **কোনো Supabase, কোনো সার্ভার, কোনো খরচ নেই।** সব কিছু আপনার Google অ্যাকাউন্ট ও GitHub-এ চলে।

---

## ০. কীভাবে কাজ করে (১ মিনিটে বুঝে নিন)

```
 দর্শক ──▶ আপনার সাইট (GitHub Pages, static ফাইল)
                │  ফর্ম জমা / booking / admin
                ▼
        Google Apps Script "Web app"  ◀── একটি ছোট কোড-ফাইল (Code.gs), আপনার Google Sheet-এর সঙ্গে যুক্ত
                │
        ┌───────┴────────┐
        ▼                ▼
   Google Sheet      Google Drive
   (সব ডেটা)        (ফাইল ও ছবি)
```

- সাইটের কনটেন্ট (Admin থেকে বদলানো লেখা/ছবি) Sheet-এ সংরক্ষিত থাকে। **Publish** করলে GitHub Actions সেটি Sheet থেকে এনে নতুন করে সাইট বানায় (আগের মতোই)।
- Web app-এর ঠিকানা (`https://script.google.com/macros/s/…/exec`) সাইটের কোডে প্রকাশ্য থাকে — এতে সমস্যা নেই। দর্শক শুধু ফর্ম পাঠাতে পারে; **Admin-এর যেকোনো কাজে আপনার পাসওয়ার্ড লাগে**।

### জেনে রাখুন (সীমাবদ্ধতা)

| বিষয় | বিবরণ |
|---|---|
| সংযুক্ত ফাইলের আকার | প্রতিটি ফাইল সর্বোচ্চ **৫ MB**, সর্বোচ্চ ৫টি (Google Apps Script-এর অনুরোধ-আকার নিরাপদ রাখতে) |
| স্প্যাম প্রতিরোধ | Apps Script দর্শকের IP দেখতে পায় না; তাই সুরক্ষা হলো: লুকানো honeypot ঘর + একই ইমেইল থেকে ১০ মিনিটে ৩টির বেশি নয় + সামগ্রিক সীমা |
| গতি | প্রতিটি ফর্ম জমা হতে সাধারণত ১–৩ সেকেন্ড লাগে (Sheet-এ লেখার সময়) |
| ইমেইল নোটিফিকেশন | Google প্রতিদিন সীমিত সংখ্যক ইমেইল পাঠাতে দেয় (সাধারণ Gmail-এ প্রায় ১০০টি; Google বদলাতে পারে) |
| ছবি Replace | Google Drive-এ ফাইলের ভেতর বদলানো যায় না; তাই "Replace" করলে নতুন ফাইল বানিয়ে সাইটের যেখানে পুরনো ছবি ছিল সব জায়গায় নতুনটি বসিয়ে দেওয়া হয় (স্বয়ংক্রিয়) |
| Admin পাসওয়ার্ড ভুল | পরপর ১০ বার ভুল হলে ১৫ মিনিটের জন্য লগইন বন্ধ |

---

## ১. যা যা লাগবে

- একটি **Google অ্যাকাউন্ট** (Gmail হলেই চলবে)
- একটি **GitHub অ্যাকাউন্ট**
- কম্পিউটারে **Node.js 22** ([nodejs.org](https://nodejs.org), LTS) — পরীক্ষা: `node -v`
- কম্পিউটারে **Git** ([git-scm.com](https://git-scm.com)) — পরীক্ষা: `git --version`
- এই প্রজেক্ট ফোল্ডার (zip Extract করে, যেমন `C:\projects\smfr-portfolio`)

---

## ২. ধাপ ১ — Google Sheet বানান

1. [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**।
2. ওপরে বাঁদিকে নাম দিন: **`SMFR Portfolio Database`**।
3. আর কিছু করতে হবে না (ট্যাব ও কলাম স্ক্রিপ্ট নিজেই বানাবে)।

---

## ৩. ধাপ ২ — কোড (Apps Script) বসান

1. Sheet-এ ওপরের মেনুতে **Extensions → Apps Script** ক্লিক করুন। নতুন ট্যাবে কোড-এডিটর খুলবে।
2. বাঁদিকে ফাইলের তালিকায় `Code.gs` আছে, ভেতরে `function myFunction() {}` লেখা। **সব লেখা মুছে ফেলুন** (Ctrl+A, Delete)।
3. প্রজেক্ট ফোল্ডারে `google-apps-script/Code.gs` ফাইলটি Notepad/VS Code-এ খুলুন → **সব কপি (Ctrl+A, Ctrl+C)** → Apps Script এডিটরে **পেস্ট (Ctrl+V)**।
4. ওপরে **💾 Save** (Ctrl+S)। ওপরে প্রজেক্টের নাম "Untitled project" থাকলে ক্লিক করে নাম দিন `SMFR Backend`।

### (ঐচ্ছিক কিন্তু ভালো) টাইমজোন সেট
বাঁদিকের **⚙ Project Settings** → "Show *appsscript.json* manifest file in editor"-এ টিক দিন → এডিটরে `appsscript.json` খুলে সেটি `google-apps-script/appsscript.json`-এর লেখা দিয়ে বদলে Save করুন। (এতে টাইমজোন `Asia/Dhaka` হবে।)

---

## ৪. ধাপ ৩ — আপনার তথ্য বসান (CONFIG)

`Code.gs`-এর একদম ওপরে `CONFIG` অংশ খুঁজুন:

```js
var CONFIG = {
  ADMIN_EMAIL: 'you@example.com',
  ADMIN_PASSWORD: 'CHANGE-THIS-TO-A-LONG-PASSWORD',
  NOTIFY_EMAIL: ''
};
```

বদলান:

| ঘর | কী দেবেন |
|---|---|
| `ADMIN_EMAIL` | `/admin`-এ লগইনের জন্য আপনার ইমেইল (যেকোনো ইমেইল হতে পারে) |
| `ADMIN_PASSWORD` | **কমপক্ষে ১২ অক্ষরের দীর্ঘ পাসওয়ার্ড** — যেমন কয়েকটি শব্দ মিলিয়ে `blue-river-lamp-9-tiger`। অন্য কোথাও ব্যবহার করা পাসওয়ার্ড দেবেন না |
| `NOTIFY_EMAIL` | নতুন inquiry/বার্তা/booking-এর খবর পেতে চাইলে আপনার ইমেইল; না চাইলে `''` রাখুন |

**Save** (Ctrl+S)।

---

## ৫. ধাপ ৪ — `setup` চালান (একবারই)

1. এডিটরের ওপরে ফাংশন-ড্রপডাউন (Run বোতামের পাশে) থেকে **`setup`** বেছে নিন।
2. **▶ Run** ক্লিক করুন।
3. **"Authorization required"** (অনুমতি) বক্স আসবে → **Review permissions** → আপনার Google অ্যাকাউন্ট বেছে নিন।
4. "**Google hasn't verified this app**" সতর্কতা আসবে — এটি স্বাভাবিক, কারণ স্ক্রিপ্টটি আপনার নিজের বানানো:
   - নিচে **Advanced** → **Go to SMFR Backend (unsafe)** ক্লিক করুন
   - **Allow** দিন (এটি আপনার Sheet, Drive ও ইমেইল পাঠানোর অনুমতি চায় — শুধু আপনার নিজের অ্যাকাউন্টেই)
5. নিচে **Execution log**-এ দেখাবে: `Setup finished. Next: (1) blank the ADMIN_PASSWORD…`

এখন Sheet-এ ফিরে দেখুন: নিচে ৯টি ট্যাব তৈরি হয়েছে (`inquiries`, `messages`, `bookings`, `subscribers`, `faq_feedback`, `events`, `content`, `content_history`, `media`), আর আপনার Google Drive-এ দুটি ফোল্ডার: **`SMFR Portfolio - media`** ও **`SMFR Portfolio - attachments`**।

> ⚠️ `content`, `content_history`, `media` ট্যাব **হাতে বদলাবেন না** — Admin প্যানেল সেগুলো চালায়। বাকিগুলো দেখতে/ফিল্টার/ডাউনলোড করতে পারেন।

### সব ঠিক আছে কিনা যাচাই
ফাংশন-ড্রপডাউনে **`checkSetup`** বেছে **Run** করুন। Execution log-এ সবকিছুর পাশে `OK` থাকলে ঠিক আছে। `MISSING` দেখালে `setup` আবার চালান।

---

## ৬. ধাপ ৫ — পাসওয়ার্ড কোড থেকে মুছুন (নিরাপত্তা)

`setup` আপনার পাসওয়ার্ডের শুধু **এনক্রিপ্টেড হ্যাশ** রেখেছে। এবার কোড থেকে আসল পাসওয়ার্ড মুছে ফেলুন:

```js
ADMIN_PASSWORD: '',
```

**Save** করুন। (পাসওয়ার্ড বদলাতে চাইলে পরে নতুন পাসওয়ার্ড বসিয়ে `setup` আবার চালান, তারপর আবার মুছুন।)

---

## ৭. ধাপ ৬ — Web app হিসেবে Deploy করুন

1. এডিটরের ডানদিকে ওপরে **Deploy → New deployment**।
2. **⚙ (gear) আইকন → Web app** বেছে নিন।
3. পূরণ করুন:
   - **Description:** `v1`
   - **Execute as:** **Me (আপনার ইমেইল)**
   - **Who has access:** **Anyone** ← ⚠️ খুব গুরুত্বপূর্ণ। (`Anyone with Google account` নয়, শুধু `Anyone`। নইলে দর্শকরা ফর্ম পাঠাতে পারবে না।)
4. **Deploy** ক্লিক করুন (প্রয়োজনে আবার Authorize করুন)।
5. **Web app URL** দেখাবে — এটি **কপি করুন**। দেখতে এমন:
   ```
   https://script.google.com/macros/s/AKfycb......................................./exec
   ```
   এটি নোটপ্যাডে সংরক্ষণ করুন (পরে Manage deployments থেকেও পাবেন)।

> `/exec`-এ শেষ হওয়া ঠিকানাটিই লাগবে। `/dev`-এ শেষ হওয়া "Test deployment" ঠিকানা ব্যবহার করবেন না।

### যাচাই
ব্রাউজারে ঠিকানার শেষে `?action=ping` জুড়ে খুলুন:
```
https://script.google.com/macros/s/AKfycb.../exec?action=ping
```
এমন লেখা আসলে সফল: `{"ok":true,"service":"smfr-portfolio-sheets",...}`

- Google লগইন পেজ আসলে → "Who has access" ভুল; **Manage deployments → ✏️ Edit → Anyone** করে নতুন Version-এ Deploy করুন।

---

## ৮. ধাপ ৭ — লোকাল পিসিতে চালিয়ে দেখুন

### ক) `.env` ফাইল

প্রজেক্ট ফোল্ডারে টার্মিনাল খুলুন:

```bash
# Windows PowerShell
Copy-Item .env.example .env
# Windows Command Prompt
copy .env.example .env
# Mac / Linux
cp .env.example .env
```

`.env` খুলে দুটি মান বসান:

```
NEXT_PUBLIC_API_URL="https://script.google.com/macros/s/AKfycb.../exec"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### খ) চালান

```bash
npm ci
npm run dev
```

ব্রাউজারে **http://localhost:3000** খুলুন।

### গ) পরীক্ষা

| কী করবেন | কী দেখবেন |
|---|---|
| Contact ফর্মে একটি বার্তা পাঠান | Google Sheet-এর **`messages`** ট্যাবে নতুন সারি (আর `NOTIFY_EMAIL` দিলে ইমেইল) |
| `/start-a-project` থেকে একটি ছোট CSV ফাইলসহ inquiry পাঠান | **`inquiries`** ট্যাবে সারি; **Drive → `SMFR Portfolio - attachments`**-এ ফাইল |
| http://localhost:3000/admin খুলে লগইন করুন (ধাপ ৩-এর ইমেইল ও পাসওয়ার্ড) | Dashboard, Inquiries, Messages… সব ট্যাব খোলে |
| Admin → **Kaggle activities** → নতুন আইটেম যোগ করে Save | Sheet-এর **`content`** ট্যাবে `kaggleActivities` নামে সারি |

> প্রথমবার সাড়া আসতে ৫–১০ সেকেন্ড লাগতে পারে (Google-এর স্ক্রিপ্ট "জেগে উঠছে")। পরে দ্রুত হয়।

লোকালের জন্য `npm run build` ও `npm start` (production-এর মতো দেখা) এবং কোড-মান যাচাই:

```bash
npm run lint           # কোড স্টাইল
npm run typecheck      # টাইপ যাচাই
npm run test:admin     # সব স্বয়ংক্রিয় টেস্ট (ব্যাকএন্ড টেস্টসহ)
```

---

## ৯. ধাপ ৮ — GitHub-এ তুলুন ও লাইভ করুন

### ক) নতুন repository

1. [github.com/new](https://github.com/new) → নাম দিন।
   - সবচেয়ে সহজ: নাম **`username.github.io`** (আপনার GitHub username দিয়ে) → সাইট `https://username.github.io` ঠিকানায় চলবে।
   - অন্য নাম দিলে সাইট `https://username.github.io/নাম` ঠিকানায় চলবে (বড়-ছোট হাতের অক্ষর হুবহু মিলতে হবে)।
2. **README / .gitignore যোগ করবেন না** (ফাঁকা repo)।

### খ) কোড push

প্রজেক্ট ফোল্ডারের টার্মিনালে:

```bash
git init -b main
git add .
git status
```

⚠️ `git status`-এ **`.env` থাকলে থামুন** (`.env.example` থাকা ঠিক)। `.env` সাধারণত বাদ পড়ে যায়।

```bash
git commit -m "Initial commit"
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

(`git push`-এ লগইন চাইলে GitHub username ও পাসওয়ার্ডের জায়গায় **Personal Access Token** দিন, অথবা Git Credential Manager-এর ব্রাউজার লগইন।)

### গ) GitHub Pages চালু

Repo → **Settings → Pages → Build and deployment → Source: `GitHub Actions`**।

### ঘ) দুটি Variable যোগ

Repo → **Settings → Secrets and variables → Actions → `Variables` ট্যাব → New repository variable**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | ধাপ ৬-এ কপি করা Web app URL (`…/exec` পর্যন্ত) |
| `NEXT_PUBLIC_SITE_URL` | সাইটের পূর্ণ ঠিকানা, **শেষে `/` নয়** |

`NEXT_PUBLIC_SITE_URL`-এর মান:

- User site (`username.github.io` repo): `https://username.github.io`
- নিজের ডোমেইন: `https://yourdomain.com`
- Project site: `https://username.github.io/RepoName` (পথসহ)

> এগুলো প্রকাশ্য মান — **Variables** ট্যাবে দিন, Secrets নয়।

### ঙ) Deploy চালান

Repo → **Actions → Deploy site → Run workflow**। ২–৪ মিনিটে তিনটি ধাপ (Has content changed? → Build → Publish) সবুজ ✅ হলে সাইট লাইভ।

---

## ১০. ধাপ ৯ — লাইভ সাইটে যাচাই

`docs/PRODUCTION_CHECKLIST.md` ধরে পুরো তালিকা দেখুন। দ্রুত পরীক্ষা:

| # | করুন | প্রত্যাশিত |
|---|---|---|
| 1 | লাইভ সাইটের Contact ফর্ম পাঠান | `messages` ট্যাবে সারি |
| 2 | Newsletter-এ ইমেইল দিন | `subscribers` ট্যাবে সারি |
| 3 | `/book-a-call`-এ একটি সময় প্রস্তাব করুন | `bookings` ট্যাবে `proposed` সারি; একই সময় আবার → "just taken" |
| 4 | `/admin` → লগইন | Dashboard-এ সংখ্যা মেলে |
| 5 | Admin → Services-এ একটি লেখা বদলে **Save** → **Publish** | ২–৪ মিনিট পর সাইটে নতুন লেখা |
| 6 | Admin → Media library → ছবি আপলোড | Drive-এর `SMFR Portfolio - media` ফোল্ডারে ছবি |

---

## ১১. প্রতিদিনের ব্যবহার

- **Inquiry / বার্তা / Booking দেখা:** সরাসরি Google Sheet-এর ট্যাবে (ফিল্টার, সাজানো, CSV ডাউনলোড সব আছে), অথবা `/admin`-এর ট্যাবে (স্ট্যাটাস বদলানো, নোট লেখা, ফাইল খোলা)।
- **ক্লায়েন্টের ফাইল খোলা:** Admin → Inquiries → inquiry খুলে ফাইলের নামে ক্লিক। ফাইল Drive-এ ব্যক্তিগত; **আপনি আপনার Google অ্যাকাউন্টে লগইন থাকলে** খুলবে।
- **সাইটের লেখা/ছবি বদলানো:** Admin → সেকশন বেছে বদলান → **Save** → **Publish** (স্বয়ংক্রিয়ভাবেও ≤৩০ মিনিটে লাইভ হয়)।
- **ব্যাকআপ:** Google Sheet → File → **Download → Excel/CSV**, অথবা File → **Make a copy**। মাসে একবার করার অভ্যাস করুন। Sheet-এর File → **Version history**-ও আছে।
- **সাইট মন্থর/ত্রুটি:** Sheet-এর `events` ট্যাব দর্শকের ক্লিকের হিসাব রাখে (২০,০০০ সারির বেশি হলে পুরনোগুলো নিজে মুছে যায়)।

---

## ১২. কোড (Code.gs) আপডেট করলে — ⚠️ নতুন Version Deploy করতেই হবে

`Code.gs`-এ কিছু বদলালে (বা নতুন zip-এর `Code.gs` বসালে) শুধু Save করলে **লাইভে পরিবর্তন আসে না**। করণীয়:

1. **Deploy → Manage deployments**।
2. আপনার Web app deployment-এর পাশে **✏️ Edit**।
3. **Version** → **New version** বেছে নিন → **Deploy**।

এতে Web app URL **একই থাকে**, শুধু কোড নতুন হয়। (কখনো "New deployment" বানাবেন না — তাহলে নতুন URL হবে ও GitHub Variable বদলাতে হবে।)

## ১৩. Admin পাসওয়ার্ড বা ইমেইল বদলানো

1. `Code.gs`-এর `CONFIG`-এ নতুন `ADMIN_EMAIL` / `ADMIN_PASSWORD` বসান → Save।
2. `setup` আবার **Run** করুন (নিরাপদ — ডেটা মোছে না)।
3. `ADMIN_PASSWORD` আবার `''` করে Save করুন।
4. পুরনো লগইন সেশন থাকলেও সেগুলো ১২ ঘণ্টায় শেষ হয়; তাৎক্ষণিক বাতিল করতে Apps Script → **⚙ Project Settings → Script properties** থেকে `SESSION_SECRET` মুছে `setup` আবার চালান।

## ১৪. আগে Supabase ব্যবহার করে থাকলে

- পুরনো `NEXT_PUBLIC_SUPABASE_URL` ও `NEXT_PUBLIC_SUPABASE_ANON_KEY` GitHub Variables থেকে **মুছে** দিতে পারেন।
- Supabase-এ থাকা পুরনো Contact/Inquiry/Booking ডেটা প্রয়োজন হলে Supabase Table Editor থেকে CSV এক্সপোর্ট করে Google Sheet-এর সংশ্লিষ্ট ট্যাবের কলামের সঙ্গে মিলিয়ে পেস্ট করতে পারেন (কলামের নাম একই রাখা হয়েছে: `name`, `email`, `created_at`, …)।
- সাইটের কনটেন্ট (Admin-এ সম্পাদিত লেখা) নতুন করে বসাতে: পুরনো Admin থেকে প্রতিটি সেকশনের **Raw JSON** কপি করে নতুন Admin-এর একই সেকশনের **JSON** ভিউতে পেস্ট করে Save করুন।

---

## ১৫. নিরাপত্তার সারসংক্ষেপ

- ✅ দর্শক শুধু ফর্ম জমা ও সময়-বুকিং করতে পারে; ডেটা পড়তে/মুছতে পারে না।
- ✅ Admin-এর প্রতিটি কাজে আপনার পাসওয়ার্ডে তৈরি স্বাক্ষরিত টোকেন লাগে (১২ ঘণ্টা মেয়াদ)। পাসওয়ার্ড কোডে নেই, শুধু হ্যাশ।
- ✅ ক্লায়েন্টের ফাইল Drive-এ **ব্যক্তিগত** ফোল্ডারে; শুধু আপনি খুলতে পারেন।
- ✅ Admin-এর ফর্মে ও Sheet-এ সংরক্ষিত লেখা "plain text" — `=`, `+` দিয়ে শুরু হওয়া লেখা সূত্র (formula) হিসেবে চলে না।
- ⚠️ **আপনার Google অ্যাকাউন্টের নিরাপত্তা** এখন ডেটার নিরাপত্তা — ২-ধাপ যাচাই (2-Step Verification) চালু করুন।
- ⚠️ Sheet-টি অন্য কারও সঙ্গে শেয়ার করবেন না (শেয়ার করলে তারা সব ক্লায়েন্ট-ডেটা দেখতে পাবে এবং স্ক্রিপ্টও বদলাতে পারবে)।
- ⚠️ GitHub repo-তে `.env` তুলবেন না (যদিও তাতে শুধু প্রকাশ্য ঠিকানা থাকে)।

সমস্যায় পড়লে: **`docs/TROUBLESHOOTING.md`**।
