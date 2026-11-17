# Unfazed – Practice Management App for Therapists

A full-stack MERN application that lets independent therapists manage clients, bookings, payments, session notes and chat in one place.

Built by **Prashant Bapanpalli** as the major project of the Unlox × Outpro India full-stack web development internship (May – October 2026). Developed with AI-assisted tools; I am studying each module in depth so that I can explain how it works.

**Tech stack:** MongoDB · Express · React (Vite, Tailwind) · Node.js · Socket.io · Razorpay · JWT · PDFKit · TipTap

Two folders: `unfazed-backend` (Node, Express, MongoDB) and `unfazed-frontend` (React, Vite, Tailwind).

## Run it
Needs Node 18+ and MongoDB (local, or a free MongoDB Atlas URI).

```
cd unfazed-backend
cp .env.example .env          # set MONGO_URI (and JWT_SECRET)
npm install
npm run seed                  # demo data: sharma@example.com / password123, link /dr-sharma
npm run dev                   # http://localhost:5000

cd ../unfazed-frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```
Backend tests: `npm test` (41 end-to-end checks; the API must be running).
Set `CLIENT_URL` in the backend `.env` to the frontend URL (CORS).

## Payments
With no Razorpay keys, the app runs in **mock mode**: the Pay button confirms instantly, no money moves.
To go live add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and point the Razorpay webhook to `/api/payments/webhook`.

## Features (7 modules)
1. **Branded profile** - `/:slug` is a public page (about, services, prices, Book button). Open Graph meta tags are set at runtime; real WhatsApp previews would need server-side rendering (known limitation).
2. **Client CRM** - clients with search, filter, sort and tags. The client card combines sessions, payments, packages and notes in one view. Consent (time, IP, version) is stored at intake.
3. **Scheduling** - therapist sets weekly hours, days off, buffer, session lengths (30/45/60/90). The server generates slots in the therapist's timezone and sends UTC; the browser shows them in the client's timezone. Double booking is impossible because an active session holds a unique `slotKey` (unique sparse index). Unpaid bookings are held for a short time and then expire.
4. **Payments** - GST-aware pricing, Razorpay order, signature verification, webhook verified on the raw body, confirmation is idempotent (safe to run twice), PDF invoices, 3/6/12-session packages that auto-deduct credits.
5. **Notes** - rich text (TipTap), Free / SOAP / DAP templates. Notes are *private* or *shared*; clients can only read through `SessionNote.sharedForClient()`, which cannot return private notes.
6. **Subscription tiers** - one Entitlement service answers "can this therapist do X?" from tier settings stored in the database (client cap, templates, analytics depth, leads, chat). Nothing compares tier names in code. Blocked calls return `403 UPGRADE_REQUIRED` and the UI shows one shared upgrade prompt. Free: 3 clients, Pro: 25, Premium: unlimited + chat + full analytics.
7. **Chat, notifications, analytics** - Socket.io chat authenticated with the same JWT, typing indicator, read receipts, file upload (Premium). Notifications use an event bus with a WhatsApp stub plus a scheduler for 24h reminders and follow-ups. Analytics use MongoDB aggregation pipelines (revenue trend, active clients; full plan adds no-show rate and top clients).

## Known limitations
- Tested locally against FerretDB (a MongoDB-compatible engine); use real MongoDB or Atlas for normal use.
- Subscription upgrade is instant (demo); a real product would charge first.
- WhatsApp sending is a stub that logs the message.
