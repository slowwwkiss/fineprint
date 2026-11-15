# SETUP.md — one-time Firebase setup (for the main agent)

FinePrint works on-device with **zero setup** (placeholder mode — see
README.md). The steps below unlock the **cloud path** (long documents,
compare, Firestore history, Remote Config) and the **hosted demo** the
judges will open. All free tier; no billing card needed for text
inference.

## 1. Create the Firebase project (browser, Google account)

1. Open the [Firebase console](https://console.firebase.google.com/) and
   sign in with the project Google account.
2. **Add project** → name it `fineprint` (any name works) → continue.
3. When asked about Google Analytics: **disable it** (not needed).
4. Create the project and wait for provisioning.

## 2. Register the web app and copy the config

1. In the project: **Build → (gear) Project settings → Your apps →
   Web app (`</>`)** → nickname `fineprint-web` → **Register app**.
2. Copy the `firebaseConfig` values into the project's `.env`
   (see `.env.example`): `apiKey`, `authDomain`, `projectId`,
   `storageBucket`, `messagingSenderId`, `appId`.
3. **Do NOT commit `.env`.** It is gitignored. The deployed demo gets
   the same values as build-time env vars (step 6).

## 3. Enable Firebase AI Logic

1. In the Firebase console: **Build → AI Logic** (or search "AI Logic").
2. Click **Get started** and follow the guided setup. Choose the
   **Gemini Developer API** backend (the free one).
3. The guided setup enforces App Check — that is expected; step 4
   covers it.
4. Note the default cloud model is Gemini 2.5 Flash (what the app uses).

## 4. App Check — reCAPTCHA v3 (production) + debug token (dev)

1. **Build → App Check → Apps → fineprint-web → reCAPTCHA v3 →
   Configure.** The console creates the reCAPTCHA keys for you.
2. Copy the **site key** (public) into `.env` as
   `VITE_APPCHECK_SITE_KEY=`.
3. For local development only: the app also accepts the debug-token
   flow — set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in the
   browser console before load, copy the printed debug token, and
   register it under **App Check → Manage debug tokens**. Debug tokens
   are accepted in submissions per the contest rules, but the deployed
   demo must use reCAPTCHA v3 so it works for every visitor.

## 5. Auth, Firestore, Remote Config

1. **Build → Authentication → Sign-in method → Anonymous → Enable.**
2. **Build → Firestore Database → Create database** → start in
   **production mode** → pick a region → create. Then **Rules** and
   paste:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/analyses/{docId} {
         allow read, write: if request.auth != null
           && request.auth.uid == userId;
       }
     }
   }
   ```
   (Each anonymous user only ever sees their own history.)
3. **Run → Remote Config → Add parameters** (all optional — the app
   has identical local defaults):
   - `on_device_max_chars` = `3000`
   - `cloud_chunk_chars` = `6000`
   - `cloud_model` = `gemini-2.5-flash`
   - `enable_compare` = `true`

## 6. Build the demo with the real config + deploy

```bash
cd fineprint
# .env already filled in from step 2 + 4
npm install
npm run verify     # must be all-green before deploy
npm run build      # -> dist/
```

Deploy `dist/` to any static host. Two options, in order of preference:

- **Firebase Hosting** (nicest URL, same project):
  `npm install -g firebase-tools && firebase login && firebase init hosting`
  (choose `dist` as the public directory, SPA rewrite: yes) then
  `firebase deploy --only hosting`.
- **GitHub Pages** (no extra login): push the repo, enable Pages on the
  `main` branch (`/docs` or a `gh-pages` deploy of `dist/`). The app
  uses relative asset paths (`base: './'`), so a project sub-path works.

The deployed URL goes in the Devpost submission ("hosted project" link)
and in the demo video description.

## 7. Smoke-test the deployed demo (real Chrome desktop)

1. Open the demo URL in Chrome 139+ on desktop.
2. Click a **short sample** → "Download on-device model" → wait for the
   download → **Explain this document**. Expect the badge
   `ON-DEVICE · GEMINI NANO` and the line "this document never left your
   device."
3. Click the **long sample** (lease). Expect the badge
   `CLOUD · GEMINI 2.5 FLASH` and the chunk note.
4. Ask a question, run a compare, reload the page — history should list
   the analysis (Firestore).
5. Record the demo video following [DEMO-SCRIPT.md](DEMO-SCRIPT.md).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Firebase is not configured yet" | `.env` missing or empty — cloud is refused on purpose; on-device still works in a real Chrome |
| Cloud call fails with App Check error | reCAPTCHA v3 site key missing/wrong, or App Check enforcement on with no token — redo step 4 |
| "On-device model is not available" | Chrome < 139, non-desktop Chrome, or the model has not downloaded — click "Download on-device model" (needs a click; the Prompt API refuses downloads without a user gesture) |
| History empty after reload | Firestore rules (step 5) or anonymous auth disabled |
| `vite build` chunk-size warning | Expected — the Firebase SDK is ~670 KB. It is a warning, not an error. |
