# NOTES.md — FinePrint build log

## 2026-11-15 — gate check + build (all times WIB)

- **21:56** — Gate check from the live Devpost page + Official Rules
  (fetched, not assumed). See GATE-CHECK.md. Verdict: GO.
- **21:58** — Firebase JS SDK 13.3.0 + Vite 8.3.8 installed. SDK API
  verified from the installed package types (not from memory):
  `InferenceMode` (prefer_on_device / only_on_device / only_in_cloud /
  prefer_in_cloud), `HybridParams { mode, onDeviceParams?, inCloudParams? }`,
  `GenerativeModel.initializeDeviceModel()`, `response.inferenceSource`
  (`on_device` | `in_cloud`).
- **22:00** — Prompt API probed in the VM's Chromium:
  - Headless shell (Chrome 159): `LanguageModel` exists,
    `availability()` = `"downloadable"`.
  - Full Chromium (headless=new): availability `"unavailable"` — the
    feature flag gating model execution is disabled in that build.
  - With a simulated user gesture (CDP `userGesture: true`), `create()`
    resolves in 0.3s and `prompt()` returns:
    *"On-device model is not available in Chromium, this API is just
    echoing back the input"*.
  - **Conclusion: the VM's headless Chromium CANNOT run Gemini Nano for
    real — it is an echo stub.** The on-device path is real, tested
    code (SDK + Prompt API), but a live Nano run needs a real Chrome
    desktop. The demo video must be recorded there (see DEMO-SCRIPT.md),
    and the deployed demo must be smoke-tested there (SETUP.md step 7).
    The app is designed for exactly this: on-device works with zero
    setup in a real Chrome; the cloud path needs the Firebase project.
- **22:05** — App scaffolded (Vite + vanilla JS): index.html, main.js,
  ai.js, firebase-config.js, firebase-app.js, store.js,
  remoteConfig.js, samples.js (3 docs), styles.css.
- **22:06** — UI smoke test in headless Chrome (CDP): page loads,
  3 sample buttons, route preview correct (911-char sample ->
  "prefer ON-DEVICE"), stay-on-device toggle updates preview,
  history empty state correct. First run exposed the raw
  "Firebase is not configured" throw as a console.error.
- **22:08** — **Placeholder-mode architecture** (key design decision):
  the SDK only requires config fields to be *present*, so with no real
  project the app hands it clearly-marked placeholders. On-device
  inference then works with zero setup (it never touches a server),
  while cloud features refuse politely before trying. `getFirebaseApp()`
  never throws for a missing project anymore. Single shared app instance
  (fixes the duplicate-app hazard: `initializeApp` called from three
  modules now goes through one getter).
- **22:10** — Error translation fixed: with placeholder config, ANY SDK
  throw becomes the friendly "Firebase is not configured yet" message
  (the raw error leaked the placeholder project id + a raw
  firebasevertexai URL). Re-tested: friendly message, zero JS errors.
- **22:12** — `decideRoute()` extracted as a pure, exported function
  (testability); `parseAnalysis()` hardened (JSON-in-fences, missing
  fields, garbage input — never throws).
- **22:13** — Unit tests found a real bug: `import.meta.env` is
  undefined in plain Node, so `firebase-config.js` threw at import.
  Fixed with `((typeof import.meta !== 'undefined' && import.meta.env) || {})`.
  Unit tests: **20/20 pass**.
- **22:15** — `scripts/verify-app.sh` written (37 checks). First run:
  37 pass, 3 fail — the 3 failures were the not-yet-written docs
  (README/SETUP/SUBMISSION-DRAFT), now written.
- **22:16** — Apache-2.0 LICENSE fetched from apache.org (11,358 bytes).
- **22:18** — `vite build` passes (dist/index.html 8.1 kB, JS bundle
  669 kB — Firebase SDK; the chunk-size warning is expected).

## Design decisions (why)

1. **Vanilla JS + Vite, no framework.** Fewer moving parts, faster to
   verify, and the repo is readable by judges in one sitting.
2. **Contract explainer, not a generic chatbot.** Privacy is a genuine
   reason to prefer on-device; length is a genuine reason for the cloud.
   The hybrid routing is the product, not a checkbox.
3. **Visible `inferenceSource` badges.** Judges grade "how effectively
   Firebase AI Logic hybrid inference is used" — the badge proves it
   per answer, from the response object itself.
4. **Placeholder mode.** The submitted repo contains no real keys (the
   rules forbid production secrets in the repo), yet the demo still
   works on-device for anyone who opens it. Cloud activates with a
   one-time `.env` + deploy.
5. **Graceful degradation everywhere.** Remote Config → local defaults.
   Firestore → localStorage. App Check → skipped with an honest status
   when no site key is configured. Nothing ever fails silently.

## Known limitations (honest)

- **On-device inference has never run for real in this VM** (echo stub
  only — see 22:00 above). The code path is the documented SDK path
  and the Prompt API calls are correct, but the first real Nano run
  must happen in a real Chrome desktop, on the deployed demo, before
  the video is recorded. That is the single highest-risk item left.
- **Cloud path untested end-to-end** (no Firebase project yet — the
  main agent creates it per SETUP.md). The SDK calls are the documented
  ones; the first live cloud call is a checklist item in SETUP.md step 7.
- **Nano's context is small** — that is why the on-device threshold is
  3,000 chars and long docs go to the cloud by design.
- **No PDF upload** (only .txt/.md + paste). PDF parsing (pdf.js) was
  cut for scope; paste covers the demo and the samples.
- **Q&A is single-turn** (on-device inference supports single-turn text
  generation only, per the Firebase docs). Multi-turn chat would need
  the cloud model with history — deliberately out of scope.

## Remaining work (main agent)

1. Firebase project + `.env` + App Check + Auth + Firestore + Remote
   Config (SETUP.md steps 1–5) — needs a Google account in the browser.
2. Deploy the demo (SETUP.md step 6) + smoke test in real Chrome
   (step 7) — including the first REAL Nano run.
3. Record the demo video (DEMO-SCRIPT.md) + upload to YouTube.
4. Create the public repo `slowwwkiss/fineprint`, push with RAW text
   (see the double-base64 lesson in MEMORY.md — `create_or_update_file`
   encodes content itself), enable Pages if using GitHub Pages.
5. Submit on Devpost before 1 Dec 2026 05:00 WIB (SUBMISSION-DRAFT.md).
