# Jalaram Computers

E-commerce website for **Jalaram Computers & IT Solutions** — computers, laptops, accessories, repair services, networking, and CCTV solutions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, Vanilla JS, Tailwind CSS, Iconify |
| Local server | Node.js, Express, TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google + email) |
| Hosting (recommended) | Firebase Hosting |

## Project Structure

```
jalaram-computers/
├── public/                  # Static site (deployed to Firebase Hosting)
│   ├── index.html           # Home
│   ├── shop.html            # Product catalog
│   ├── product.html         # Product detail
│   ├── cart.html            # Shopping cart
│   ├── checkout.html        # Checkout
│   ├── order-confirmed.html # Order confirmation
│   ├── services.html        # IT services
│   ├── about.html           # About us
│   ├── contact.html         # Contact us
│   ├── admin.html           # Admin dashboard
│   └── assets/
│       ├── js/              # tailwind, cart-system, iconify, etc.
│       ├── css/             # Font stylesheets
│       └── images/          # Logo, product images
├── firebase/                # Firebase config & security rules
├── server.ts                # Local dev server (URL rewriting)
└── package.json
```

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy Firebase config:
   ```bash
   cp public/firebase-applet-config.example.json public/firebase-applet-config.json
   ```
   Fill in your Firebase project credentials.

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

### Pages

| URL | Page |
|-----|------|
| `/` | Home |
| `/shop` | Shop |
| `/product` | Product detail |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/order-confirmed` | Order confirmed |
| `/services` | IT services |
| `/about` | About us |
| `/contact` | Contact us |
| `/admin` | Admin console |

## Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in and select your project:
   ```bash
   firebase login
   firebase use axial-willow-281505
   ```

3. Deploy hosting and Firestore rules:
   ```bash
   cd firebase
   firebase deploy --only hosting,firestore:rules
   ```

4. Connect your custom domain in **Firebase Console → Hosting → Add custom domain**.

## Environment Variables

See `.env.example`. For local dev, only `PORT` is used by `server.ts`. Firebase config lives in `public/firebase-applet-config.json`.

## Security Notes

- Firestore rules restrict admin writes to `gohilriteshs@gmail.com`
- Orders: anyone can create (guest checkout); only admin/owner can read
- Restrict your Firebase API key to your domain in Firebase Console
- Razorpay is not production-ready yet — uses test/simulated keys

## Roadmap

- [ ] Real Razorpay integration with server-side webhook verification
- [ ] Split `cart-system.js` into modules
- [ ] Blog and FAQ pages
- [ ] Stronger admin auth (Firebase Auth, not sessionStorage)
- [ ] Cloud Functions for payment verification
