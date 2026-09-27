# PhoenixCare

**Rise stronger, every day.**

A multi-doctor telehealth consultation platform — patients discover and book verified
doctors for video/audio/chat/in-clinic consultations, pay online, receive digital
prescriptions, and keep a health records vault. Doctors manage availability, run
consultations, and write prescriptions. Admins verify doctor KYC, manage users, and
watch platform analytics.

This repo is a monorepo with three apps sharing one backend:

```
PhoenixCare/
  backend/   Express + MongoDB REST API, JWT auth, Socket.io signaling
  web/       React (Vite) + Tailwind — patient, doctor, and admin experiences
  mobile/    React Native (Expo) — shares the backend's API contract
```

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express, MongoDB/Mongoose, JWT (access + refresh), Zod validation, Socket.io |
| Web | React 18 (Vite), Tailwind CSS, Framer Motion, React Router, Zustand, Recharts (admin analytics) |
| Mobile | React Native (Expo), React Navigation, React Native Reanimated, Zustand |
| Video/Audio | WebRTC with a built-in Socket.io signaling server — no third-party SDK keys required to run locally. Swap in Agora/Twilio for TURN relay at scale by pointing client ICE config at their servers; the signaling layer is unchanged. |
| Payments | Razorpay (order creation + signature verification + webhook). Runs in a self-consistent stub mode with no keys configured, so the booking flow completes end-to-end in local/demo use. |
| File storage | Cloudinary, with a local-disk fallback (`backend/uploads/`) when no Cloudinary credentials are set — used today for prescription PDFs. |
| Notifications | Twilio (SMS/WhatsApp) and Firebase Cloud Messaging (push) — real SDK integration, logs to console in stub mode without credentials. |

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Requires a running MongoDB instance (`MONGODB_URI` in `.env`, defaults to
`mongodb://127.0.0.1:27017/phoenixcare`). Every third-party credential
(Cloudinary, Razorpay, Twilio, FCM, Agora) is optional — the app degrades to a
logged/stubbed integration when a credential is missing, so you can run the full
booking → payment → prescription flow with zero external accounts.

```bash
npm run seed   # creates an admin, a demo patient, and 8 verified demo doctors
npm run dev    # http://localhost:5000, Swagger docs at /api-docs
```

Demo accounts (password for all: `Phoenix@123`):

- Admin: `admin@phoenixcare.demo`
- Patient: `patient@phoenixcare.demo`
- Doctors: `doctor1@phoenixcare.demo` … `doctor8@phoenixcare.demo`

### 2. Web app

```bash
cd web
npm install
npm run dev   # http://localhost:5173 — proxies /api/v1 and /socket.io to the backend on :5000
```

### 3. Mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or launch an emulator. Update
`app.json → expo.extra.apiBaseUrl` to your machine's LAN IP (not `localhost`) when
testing on a physical device, since the phone can't resolve your dev machine's
`localhost`.

## What's implemented vs. scaffolded

Built feature-by-feature in the requested order, and verified end-to-end in a
browser against the real backend (seeded data, real MongoDB, real JWT sessions):

- **Auth** — signup/login, OTP request+verify (SMS/WhatsApp/email — logs the code in
  dev when no Twilio creds are set), JWT access + refresh tokens with rotation,
  role-based access (patient/doctor/admin).
- **Doctor discovery** — search, specialty/city/language/mode/fee/rating filters,
  sorting, pagination, doctor profile with reviews.
- **Booking** — availability/slot generation (doctor side), atomic slot claiming
  (prevents double-booking), multi-step booking flow (mode → slot → intake form →
  payment → animated confirmation), cancellation, virtual waiting room.
- **Video/audio/chat consultation** — WebRTC peer connection with Socket.io
  signaling (offer/answer/ICE relay), mic/camera controls, real-time persisted chat.
- **Digital prescriptions** — structured prescription writer (diagnosis, medicines,
  lab tests, advice), PDF generation (pdfkit), download link, ownership-checked
  access.
- **Payments** — Razorpay order creation + signature verification + webhook
  handler with commission/payout split calculation, runs in stub mode without keys.
- **Admin panel** — doctor KYC verification queue, user management, analytics
  dashboard (Recharts: consultations/day, revenue, top doctors, status funnel),
  payment/payout tracking, review moderation, campaign notifications.
- **Health records vault** — upload/list/delete, Cloudinary or local-disk storage.
- **Security & compliance groundwork** — helmet, rate limiting, Mongo sanitization,
  Zod validation on every route, audit-log middleware on sensitive
  reads (prescriptions, health records), password hashing (bcrypt).
- **Notifications** — real email (Nodemailer/SMTP, stub-logs without credentials) and
  installable Web Push (self-generated VAPID keys, no Firebase account needed) for
  booking/cancellation/prescription/KYC events, plus an in-app notification center.
- **Engagement & wellness** — Duolingo-style streaks/XP/levels/badges; daily rotating
  health tips; a water-intake tracker, sleep tracker, step/activity tracker, and
  weight/BMI tracker (all feed the same streak); gym-aware calorie & protein targets
  with a curated high-protein food list; medication reminders with scheduled push/email
  notifications (checked every minute by an in-process scheduler — see
  `backend/src/services/medicationReminderService.js`).

**Mobile app** ships a real, working scaffold — splash animation, onboarding
carousel, auth screens, doctor search/profile — wired to the *same* backend and
API-client pattern as web, but does not yet port the full booking/video/prescription
flow (the web app is the reference implementation for that).

**Known gaps to close next**: pharmacy/medicine ordering, lab test booking,
family-member-aware booking UI, i18n beyond the scaffolded structure, ABDM/ABHA
integration, subscription plans, mobile parity for booking/video/prescriptions and
the wellness widgets, and the heavier AI-powered ideas (symptom checker, food-photo
calorie recognition, AI health coach) — those need real ML/vision model integration
and are a separate project, not a drop-in addition.

## Live deployment

- Web: deployed on Vercel (Root Directory `web`, `VITE_API_BASE_URL` env var pointing
  at the Render backend).
- Backend: deployed on Render via `render.yaml` (Blueprint), MongoDB Atlas for the
  database. Free tier spins down when idle — first request after a quiet period takes
  ~30-50s to wake up.
- Mobile: `mobile/eas.json` has a `preview` build profile (plain installable APK, not
  a Play Store bundle). Build it with `npx eas-cli login` then `npm run build:apk` —
  Expo's cloud build gives a hosted download link/QR code. A local build (no Expo
  account needed) is also possible via `expo prebuild` + Gradle, but needs the
  Android SDK/NDK installed and can hit native-module compile issues Reanimated
  introduces; the cloud build is the reliable path.

## API docs

Swagger UI: `http://localhost:5000/api-docs` once the backend is running.

## Security notes for going to production

- Rotate `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` and every third-party secret in
  `.env` — the checked-in `.env.example` values are placeholders only.
- Chat messages are stored in MongoDB today without field-level encryption; add
  encryption-at-rest (or an encrypted-fields library) before handling real PHI.
- `backend/uploads/` (local file fallback) is not access-controlled by anything
  other than an unguessable filename — put Cloudinary (or S3 + signed URLs) in
  front of it for real patient documents.
