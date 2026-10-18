# Production Testing Checklist

`https://yourdomain.com` ধরে সবগুলো যাচাই করুন।

## ক. Deploy ও SEO ফাইল
- [ ] GitHub → Actions → **Deploy site** সবুজ ✅
- [ ] `/robots.txt` খোলে: `Allow: /`, `Disallow: /admin`, `Sitemap: https://yourdomain.com/sitemap.xml`
- [ ] `/sitemap.xml` খোলে; সব URL আপনার ডোমেইনে (`localhost`/`example.com` নয়), ১৫টির মতো URL
- [ ] সব পেজ খোলে: `/`, `/about`, `/services`, `/projects`, `/case-studies`, `/skills`, `/experience`, `/certifications`, `/kaggle`, `/testimonials`, `/book-a-call`, `/start-a-project`, `/contact`
- [ ] একটি ভুল URL (`/xyz`) আপনার 404 পেজ দেখায়
- [ ] পেজে Right-click → View Source: `<title>`, `meta description`, `canonical` (আপনার ডোমেইন), `og:image`, JSON-LD আছে
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) ও [PageSpeed Insights](https://pagespeed.web.dev) চালিয়েছেন
- [ ] Search Console-এ sitemap জমা দিয়েছেন
- [ ] `/admin` পেজের source-এ `noindex` আছে

## খ. ফর্ম ও Database (প্রতিটির পর Google Sheet-এর ট্যাব / Admin দেখুন)
- [ ] Contact ফর্ম → `messages` ট্যাব
- [ ] Newsletter → `subscribers`; একই email আবার দিলে ডুপ্লিকেট হয় না
- [ ] FAQ "helpful?" → `faq_feedback`
- [ ] Booking: slot বুক → `bookings` (proposed); একই slot আবার → "just taken"
- [ ] Booking lookup (Reference ID + email) ও cancel কাজ করে
- [ ] Project inquiry (ফাইল ছাড়া) → `inquiries`
- [ ] Project inquiry (১–২টি ফাইল সহ) → `inquiries`-এর `attachments` কলামে ফাইলের তথ্য + Drive `SMFR Portfolio - attachments`-এ ফাইল; Admin → Inquiries থেকে ফাইল খোলে
- [ ] ৫ MB-এর বেশি / `.exe` ফাইল দিলে বন্ধুত্বপূর্ণ error
- [ ] একই ইমেইল দিয়ে ফর্ম ৪ বার দ্রুত পাঠালে ৪র্থবার "Too many attempts" (rate limit)
- [ ] `NOTIFY_EMAIL` দিলে নতুন বার্তা/inquiry/booking-এ ইমেইল আসে

## গ. Admin
- [ ] `/admin` লগইন কাজ করে; ভুল পাসওয়ার্ডে error
- [ ] ভুল ইমেইল/পাসওয়ার্ডে "Invalid email or password."; ১০ বার ভুলে ১৫ মিনিট লকআউট
- [ ] Dashboard-এ সংখ্যা মেলে
- [ ] Inquiry-র status বদল/note/delete; Message; Booking confirm/cancel/.ics; Subscribers CSV
- [ ] Content & SEO: যেকোনো লেখা বদলে **Save** → **Publish** → ২–৪ মিনিট পর লাইভ সাইটে নতুন লেখা, **View Source-এও**
- [ ] Per-page SEO: `/about`-এর title বদলে publish → `<title>` বদলায়
- [ ] Media: ছবি আপলোড → URL কপি → profile photo ঘরে বসিয়ে publish → ছবি বদলায় (ছবি তখন সাইটের নিজস্ব `/media/…` ঠিকানা থেকে আসে)
- [ ] Restore version / Reset to default কাজ করে
- [ ] *Section headings & button labels*: "Deep Dives" বদলে Publish → হোমপেজে নতুন শিরোনাম
- [ ] *Homepage sections*: Pricing লুকিয়ে Publish → হোমপেজে Pricing নেই; ক্রম বদলও মিলছে
- [ ] *Top menu links*: একটি আইটেম যোগ ও একটি মুছে Publish → ওপরের মেনুতে প্রতিফলিত; নতুন লিংক ক্লিক করলে ঠিক জায়গায় যায়
- [ ] 🛠 *Services*: **+ Add new service** (ছবি + alt + CTA সহ) → Save → Publish → হোমপেজ ও `/services`-এ নতুন কার্ড
- [ ] একটি service **Inactive** করে Publish → সাইট থেকে সরে গেছে; আবার Active → ফিরেছে
- [ ] 📁 *Projects*: নতুন project (ছবি, Additional images, Results, Case-study link সহ) → Publish → কার্ড ও Details পপ-আপে সব দেখায়; ★ Featured ব্যাজ
- [ ] Project **Unpublished** করলে `/projects` ও হোমপেজ থেকে সরে; Case study Unpublished করলে তার পেজ আর থাকে না, sitemap-এও নেই
- [ ] ↑↓ দিয়ে ক্রম বদলে Publish → সাইটে একই ক্রম
- [ ] 💬 *Testimonials*: একটি যোগ → Publish → "What Clients Say"-এ কার্ড; সব Unpublished হলে placeholder ফেরে
- [ ] 🖼 *Media*: একই ছবি দুবার আপলোড → "reused" বার্তা, লাইব্রেরিতে একটিই; Alt text সেভ; ব্যবহৃত ছবি Delete করতে গেলে "Used in" সতর্কতা
- [ ] Media → Replace file → সাইটের যেখানে পুরনো ছবি ছিল সবখানে নতুনটি; Publish করে লাইভে মিলিয়ে দেখুন
- [ ] Drive → `SMFR Portfolio - media`-তে ফাইল সংখ্যা = Media library-র ছবির সংখ্যা (Replace-এর পুরনো ফাইল Trash-এ যায়)

## ঘ. নিরাপত্তা
- [ ] Admin ছাড়া ডেটা পড়া যায় না — টার্মিনালে (আপনার Web app URL দিয়ে):
  ```bash
  curl -sL "<WEB_APP_URL>" -H "Content-Type: text/plain" -d '{"action":"list","sheet":"inquiries"}'
  curl -sL "<WEB_APP_URL>" -H "Content-Type: text/plain" -d '{"action":"dashboard","token":"fake"}'
  ```
  প্রত্যাশিত: `"status":401` ("Please sign in again") — **কোনো ডেটা নয়**।
- [ ] Drive-এ `SMFR Portfolio - attachments` ফোল্ডার **ব্যক্তিগত** (Share করা নেই)
- [ ] Google Sheet-টি অন্য কারও সঙ্গে শেয়ার করা নেই
- [ ] আপনার Google অ্যাকাউন্টে 2-Step Verification চালু
- [ ] `Code.gs`-এ `ADMIN_PASSWORD: ''` (ফাঁকা) — আসল পাসওয়ার্ড কোডে নেই
- [ ] সাইটের JS/GitHub repo-তে কোনো গোপন তথ্য নেই; `.env` repo-তে নেই

## ঙ. অপারেশন
- [ ] GitHub Variables দুটিই সেট (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`)
- [ ] Custom domain-এ HTTPS enforced
- [ ] **৬০ দিন repo-তে কোনো commit না হলে GitHub scheduled workflow বন্ধ করে দেয়**; তখন Actions ট্যাবে আবার চালু করুন
- [ ] Google Sheet-এর মাসিক ব্যাকআপ (File → Download) নীতি ঠিক করেছেন
- [ ] `Code.gs` আপডেট করলে **নতুন Version** Deploy করার নিয়ম জানা আছে (`docs/DEPLOYMENT_GUIDE.md` ধাপ ১২)
