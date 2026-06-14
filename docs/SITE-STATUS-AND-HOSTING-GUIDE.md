# Jalaram Computers — Site Status, Problems & Hosting Options

**Purpose of this document:** A plain-English picture of where the website stands today, what needs fixing before (and after) going live, and realistic paths forward — written with **hosting in India** in mind.

**Last updated:** June 2026

---

## 1. What this website is

Jalaram Computers is a **small-business e-commerce site** for a computer shop in Mumbai: products (laptops, accessories, etc.), services (repairs, networking, CCTV), cart, checkout, customer accounts, and an **admin panel** to manage products and orders.

It is **not** built like Shopify or WordPress. It is:

- Several **HTML pages** (home, shop, cart, checkout, admin, etc.)
- Styled with **Tailwind CSS**
- Powered by one large JavaScript file (`cart-system.js`) for the shop side
- A separate **admin dashboard** built inside `admin.html`
- **Firebase** (Google’s cloud) used as the online database when configured

There is **no traditional “backend server”** that stores products in MySQL or handles payments securely on the server. Most logic runs **in the visitor’s browser**.

---

## 2. How it works today (simple version)

Think of two storage places:

### A. The visitor’s browser (localStorage)

The browser keeps a local copy of things like:

| What | Stored as |
|------|-----------|
| Shopping cart | `cart_items` |
| Wishlist | `wishlist_items` |
| Product list (cache) | `products_catalog` |
| Your orders (copy) | `customer_orders` |
| Shop address & GST info (copy) | `jalaram_store_details` |
| “Logged in” fake session (sometimes) | `fallback_customer_session` |

**Important:** This data lives **only on that phone/laptop/browser**. Clear site data → cart and cache disappear.

### B. Firebase in the cloud (when set up)

When `firebase-applet-config.json` is configured:

- **Firestore** holds products, orders, shop settings, contact queries
- **Firebase Auth** can hold real customer accounts (email/password or Google)
- Admin can **sync** local changes up to the cloud
- The shop page **listens** for cloud updates so prices/products can change live

**Today’s pattern:** Browser storage is treated as the **main working copy**. Firebase is a **sync layer** on top — not the single source of truth. That is the root of many “this doesn’t feel like a real shop” issues.

### C. Local development vs live hosting

On your computer, `npm run dev` runs a small **Express server** (`server.ts`) that:

- Serves pages at clean URLs (`/shop` instead of `/shop.html`)
- **Injects** `cart-system.js` into every page automatically
- Cleans up leftover code from the original design export tool (Superdesign)

**Problem for going live:** Firebase Hosting (the planned deploy target) serves the **raw HTML files** from the `public/` folder. It does **not** run `server.ts`. So unless we fix the HTML files directly, the live site may **not load the shop logic** the same way your local machine does.

---

## 3. What works well already

Not everything is broken. These parts are in reasonable shape:

- **Visual design** — Professional-looking pages, mobile layout, admin dark/light theme
- **Page structure** — Home, shop, product detail, cart, checkout, services, contact, admin
- **Firebase rules file** — Basic security idea is there (admin email restricted, public can read products)
- **Admin panel features** — Products (with images/video), orders, promos, repairs, billing UI, settings
- **Firestore collections** — Products, orders, settings are already modeled
- **Deploy path exists** — README describes Firebase Hosting + custom domain
- **Indian context in content** — ₹ pricing, GST field, Mumbai address, UPI-style payment UI

You have a **strong front end** and a **workable admin**. The gaps are mostly **architecture, security, and payments** — not “start from zero.”

---

## 4. Current problems (honest list)

### 4.1 Data lives in the wrong place

Products and orders are mirrored in the browser and in Firebase. Admin and shop can **disagree** if sync fails or someone uses two devices.

**Real shops:** Cloud database is the truth. Browser only holds the cart (and maybe login session).

### 4.2 Demo / fallback behaviour

Built so the site “always works” even offline or without Firebase:

- **Empty cart gets 2 demo products** automatically (HP laptop + mouse) on first visit
- **Fake customer accounts** can be created in localStorage if Firebase fails — not real sign-ups
- **Large embedded demo product catalog** in JavaScript if the cloud is empty
- **Simulated payments** (JalaPay / Razorpay UI) — no server verifies that money was actually received

Fine for a preview. **Not fine for real customers paying real money.**

### 4.3 Admin security is weak

- Admin opens with a **hardcoded password** in the website source (`admin` / `Jalaram@Admin2026!`)
- That is stored in **sessionStorage** — not real server-side auth
- **Separate Google login** only for syncing to Firebase — confusing two-step process
- Anyone who views page source or guesses the password can open the admin UI

### 4.4 Dev vs production mismatch

Local dev injects scripts via Express. Production Firebase Hosting may not. **Risk:** Site looks fine on localhost but shop/cart/Firebase don’t work the same online.

### 4.5 Code is hard to maintain

- ~7,900 lines in one file (`cart-system.js`)
- ~3,850 lines inside `admin.html` (duplicate product/order logic)
- Two different Firebase library versions (admin vs shop)

Fixing one bug or adding one feature takes longer than it should.

### 4.6 Payments not production-ready

Checkout shows payment options, but verification is **client-side simulation**. For legal and business reasons, Indian e-commerce needs **Razorpay (or similar) with server-side confirmation** before marking an order “Paid.”

### 4.7 Email notifications

Order emails can use **Gmail API from the browser** with a Google token. Fragile and not how production systems send mail. Better: server/Cloud Function or a service like **ZeptoMail, SendGrid, or AWS SES (Mumbai region)**.

---

## 5. What “going live soon” actually requires

Minimum bar for a **respectable** launch in India:

| Must have | Why |
|-----------|-----|
| Site loads correctly on hosting (not just localhost) | Customers can browse and buy |
| Products & orders in **cloud database** | You manage stock from admin; orders aren’t lost |
| **Real admin login** (not password in source) | Protect your business data |
| **Real payments** (Razorpay recommended) | UPI, cards, netbanking — with proof of payment |
| **Custom domain** (e.g. jalaramcomputers.in / .com) | Trust and SEO |
| Firebase API key restricted to your domain | Stops abuse of your cloud project |
| HTTPS | Expected by browsers and payment gateways |

Nice to have soon after launch:

- Order confirmation email/SMS
- GST invoice PDF (partially there in admin)
- Google Analytics / basic SEO
- Backup/export of orders

---

## 6. Hosting in the Indian context

You will see many options in India. Here is how they fit **this** project.

### Option A — Firebase Hosting + Firestore (already in the project)

**What it is:** Google hosts your static files on a global CDN. Database and auth stay on Firebase. Firestore can use a **Mumbai (asia-south1)** region for lower latency in India.

**Typical cost:**

- **Spark (free):** Hosting free tier, limited Firestore/Auth — OK for very small traffic
- **Blaze (pay-as-you-go):** Needed if you add Cloud Functions for Razorpay; often **₹0–₹2,000/month** early on for a small shop, scales with orders/traffic

**Domain:** Buy `.in` or `.com` from GoDaddy India, Hostinger, BigRock (~₹500–₹1,500/year). Point DNS to Firebase Hosting (they guide you).

**Pros for you:**

- Already configured in this repo (`firebase/firebase.json`)
- Works well with current Firebase Auth + Firestore
- Fast SSL and CDN (good for Mumbai customers)
- No server to patch or restart
- Razorpay webhooks fit naturally via **Cloud Functions**

**Cons:**

- Vendor lock-in to Google Firebase
- Blaze plan needs a card; billing in USD (small amounts)
- You still need code fixes before deploy (script injection, auth, payments)

**Verdict:** **Best match for this codebase** if you want to host within weeks, not months.

---

### Option B — Indian shared hosting (Hostinger, BigRock, GoDaddy cPanel)

**What it is:** ₹99–₹399/month “unlimited hosting” — usually **PHP + MySQL**, cPanel, email accounts.

**Pros:**

- Cheap, familiar in India
- Includes email `@yourdomain.com`
- Hindi/English support

**Cons for this project:**

- **Poor fit.** This site is not PHP/WordPress. You’d upload static HTML only — **no** `server.ts`, no Node, no easy Razorpay webhooks unless they support Node (most don’t on basic plans).
- Firebase would still be separate (browser talks to Google directly).
- You’d maintain **two** systems: Hostinger for files, Firebase for data.

**Verdict:** Only makes sense if you **rebuild as WordPress/WooCommerce** or pure static brochure site **without** this admin/Firestore setup. Not recommended for the current project as-is.

---

### Option C — VPS in India (AWS Mumbai, DigitalOcean Bangalore, Linode)

**What it is:** Your own small server (Linux). You run Node.js, nginx, PM2, etc.

**Typical cost:** ₹500–₹3,000+/month depending on size

**Pros:**

- Full control
- Can run Node API, Razorpay webhooks, email, cron jobs in one place
- Data stays in India (compliance comfort for some businesses)

**Cons:**

- **You** (or a developer) manage updates, security, backups, SSL
- More setup time before launch
- Overkill unless you’re moving to a **custom backend**

**Verdict:** Good **long-term** if you outgrow Firebase or want everything on one Indian server. **Not the fastest path** to host “soon” with the current code.

---

### Option D — Static hosts (Vercel, Netlify, Cloudflare Pages)

**What it is:** Upload static site; they give you CDN + HTTPS.

**Pros:**

- Free/cheap tiers, easy deploy from Git
- Fast globally (Cloudflare has strong presence in India)

**Cons:**

- Same as Firebase Hosting for static files — **still need Firebase (or another DB)** for products/orders
- Razorpay webhooks need **serverless functions** (Vercel/Netlify functions) — extra setup
- Another platform to learn alongside Firebase

**Verdict:** Viable alternative to Firebase Hosting for **files only**. Doesn’t simplify database/auth — you’d still use Firestore or rebuild backend.

---

### Option E — All-in-one Indian SaaS (Shopify India, WooCommerce on managed WordPress)

**What it is:** Pay monthly for a ready-made shop platform.

**Pros:**

- Payments, GST, shipping plugins, support
- Launch fastest with **no custom code**
- Razorpay/PayU integrations ready-made

**Cons:**

- **Throw away or sideline** most of this custom site
- Monthly fees (Shopify ~$20+/month; managed WP ~₹500–₹2,000/month)
- Less custom design/control unless you pay more

**Verdict:** Best if the priority is **“sell online next week”** and custom features matter less than reliability.

---

## 7. Three realistic routes for *this* project

### Route 1 — “Fix and ship on Firebase” (recommended for soon hosting)

**Idea:** Keep the current HTML/vanilla JS site. Fix critical gaps. Deploy to **Firebase Hosting** + **Firestore** + **Razorpay via Cloud Functions**.

**What changes:**

1. Add shop scripts directly to HTML (fix dev/prod mismatch)
2. Remove demo cart seed and fake account fallbacks
3. Admin login → **Firebase Auth only** (your Google/admin email)
4. Firestore becomes **source of truth** for products/orders (browser cache optional)
5. Integrate **Razorpay** (Indian standard; UPI, cards, netbanking)
6. Point domain to Firebase; restrict API keys

| Pros | Cons |
|------|------|
| Uses what you already built | Still custom code to maintain |
| Can launch in **weeks** with focused work | Firebase costs money at scale (usually small at first) |
| Razorpay + GST invoice path is clear | Two monolith JS files remain until Phase 2 cleanup |
| Good performance in India with Mumbai Firestore | Needs developer time for payment Functions |
| README/deploy steps mostly apply | |

**Rough effort:** 2–4 weeks part-time with a developer familiar with Firebase + Razorpay.

**Monthly running cost (estimate):** Domain ₹100/month + Firebase Blaze ₹0–₹1,500 + Razorpay ~2% per transaction.

---

### Route 2 — “Static site on Hostinger + Firebase for data only”

**Idea:** Upload `public/` folder to cheap Indian hosting for the website files; keep Firebase for database/auth from the browser.

| Pros | Cons |
|------|------|
| Familiar Indian hosting + `@yourdomain` email | **Two vendors** to manage |
| Low file hosting cost | Must manually ensure every HTML page loads `cart-system.js` |
| Firebase still handles products/orders | cPanel upload is manual unless you automate |
| | Razorpay webhooks still need Cloud Functions (Firebase or elsewhere) |
| | No real advantage over Firebase Hosting for static files |

**Rough effort:** Similar fixes as Route 1, plus hosting setup on cPanel.

**Verdict:** Possible, but **more hassle than Route 1** with no clear benefit. Only choose if you strongly want cPanel email on the same bill and accept extra complexity.

---

### Route 3 — “Rebuild backend properly” (VPS or Firebase Functions + cleaner architecture)

**Idea:** Introduce a real **API layer**: Node server or Cloud Functions that own products, orders, payments, and admin actions. Front end becomes thinner.

| Pros | Cons |
|------|------|
| How “proper” production shops are built | **Longest timeline** (1–3 months) |
| Easier to audit security and payments | Higher upfront dev cost |
| Can host API on AWS Mumbai if required | Might still keep Firebase or move to Postgres |
| Easier to add SMS (MSG91), WhatsApp, Tally export later | |

**Rough effort:** 1–3 months depending on scope.

**Verdict:** Right if this shop will grow large or need strict compliance. **Wrong** if you must host in **days or 1–2 weeks**.

---

### Route 4 — “Move to Shopify / WooCommerce” (platform switch)

**Idea:** Use this site as design reference; run the store on a platform.

| Pros | Cons |
|------|------|
| Fastest **reliable** payments and admin | Loses custom admin and current codebase |
| Indian payment plugins ready | Monthly platform fees |
| Less technical debt | Design may not match 1:1 |

**Verdict:** Consider if hosting date is **immediate** and no developer time is available for Route 1.

---

## 8. Side-by-side summary

| | Route 1: Fix + Firebase | Route 2: Hostinger + Firebase | Route 3: Full backend | Route 4: Shopify/Woo |
|--|-------------------------|-------------------------------|----------------------|----------------------|
| **Time to launch** | Weeks | Weeks | Months | Days–1 week |
| **Fits current code** | ✅ Best | ⚠️ OK | ⚠️ Major rewrite | ❌ Replace |
| **Indian payments** | Razorpay + Functions | Same | Razorpay on server | Built-in plugins |
| **Monthly cost** | Low–medium | Low | Medium | Medium |
| **Maintenance** | Medium | Medium–high | Lower long-term | Low (platform handles) |
| **Custom admin you built** | Kept | Kept | Kept/improved | Lost |

---

## 9. Recommended path (if hosting soon)

**Primary recommendation: Route 1 — Fix and ship on Firebase Hosting.**

Reasons:

1. The project is **already set up** for Firebase Hosting and Firestore.
2. Firebase + Mumbai region is **fine for Indian customers** (latency and reliability).
3. **Razorpay** integrates well with Firebase Cloud Functions (webhook verifies payment before order is marked paid).
4. You keep the custom design and admin you invested in.
5. Fixes are **targeted**, not a full rewrite.

**Suggested order of work:**

| Phase | What | Why |
|-------|------|-----|
| **Before first deploy** | Fix HTML so shop JS loads on live site; remove admin password from source; use Firebase Auth for admin | Site actually works + basic security |
| **Before taking money** | Razorpay live keys + webhook; remove simulated payment | Legal and business trust |
| **Before marketing** | Firestore as source of truth; remove demo cart/products | Real catalog behaviour |
| **After launch** | Split large JS files; order emails via ZeptoMail/SES; SMS optional | Easier maintenance |

---

## 10. Indian-specific checklist before go-live

- [ ] **Domain** registered (.in or .com) — GoDaddy India, Hostinger, etc.
- [ ] **GST** details correct on invoices and checkout
- [ ] **Razorpay** business account (KYC completed) — UPI/cards settle to your bank
- [ ] **Privacy policy & refund policy** pages linked (placeholders exist; review with shop owner)
- [ ] **Firebase Blaze** plan if using Cloud Functions (card required)
- [ ] **Firestore region** — prefer `asia-south1` (Mumbai) when creating project
- [ ] **API key restrictions** in Google Cloud Console — only your domain
- [ ] **Admin access** — only owner email(s), not shared password
- [ ] Test on **mobile + Jio/Airtel data** — not just office WiFi
- [ ] Test **clear browser data** — cart empty, no surprise demo items (after fixes)

---

## 11. Glossary (only where needed)

| Term | Plain meaning |
|------|----------------|
| **localStorage** | Small storage inside the browser; cleared when user clears site data |
| **Firestore** | Google’s cloud database; stores JSON-like documents (products, orders) |
| **Firebase Auth** | Google’s login system (email/password, Google sign-in) |
| **Firebase Hosting** | Google serves your HTML/CSS/JS files on HTTPS with a CDN |
| **Cloud Functions** | Small server code that runs in Google’s cloud when triggered (e.g. Razorpay webhook) |
| **Razorpay** | Indian payment gateway (UPI, cards, netbanking) |
| **CDN** | Copies your site files to servers worldwide so pages load faster |
| **Webhook** | Payment gateway calls your server to say “payment succeeded” — you must verify this server-side |

---

## 12. Decision questions (for shop owner + developer)

Answer these to pick a route confidently:

1. **Launch deadline?** (This week / this month / flexible)
2. **Will you take online payments on day one**, or “order on WhatsApp” first?
3. **Who maintains the site** after launch? (Developer / family / agency)
4. **Budget for monthly tools?** (₹0 only / ₹500–₹2000 / more)
5. **Is the custom admin essential**, or would Shopify admin be acceptable?

If deadline is **this month** and custom admin matters → **Route 1**.  
If deadline is **immediate** and no dev time → **Route 4**.  
If building for **years and high volume** → **Route 3** after a Route 1 launch.

---

## 13. Related files in this repo

| File | Role |
|------|------|
| `public/` | All website pages and assets |
| `public/assets/js/cart-system.js` | Shop, cart, checkout, customer auth |
| `public/admin.html` | Admin dashboard |
| `public/firebase-applet-config.json` | Firebase connection (create from `.example`; do not commit secrets) |
| `firebase/firestore.rules` | Who can read/write cloud data |
| `firebase/firebase.json` | Hosting and deploy config |
| `server.ts` | Local dev only — not used in production hosting |

---

*This document describes the architecture as of June 2026. Update it when major hosting or payment decisions are made.*
