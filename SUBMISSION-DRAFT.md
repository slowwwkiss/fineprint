# SUBMISSION-DRAFT.md — #BuildHybridAI 2026 (Devpost)

**Contest:** https://firebasehybridaihackathon.devpost.com/
**Deadline:** Sun 30 Nov 2026 14:00 PT = **Mon 1 Dec 2026 05:00 WIB**
**Judging:** 10–16 Dec 2026 PT · **Winners announced:** on or around 21 Dec 2026
**Platform selected:** Web (Chrome) — also eligible for Grand Prize.
**Prizes aimed at:** Grand Prize $10,000 · Best Web/Chrome App $3,000.

> DO NOT SUBMIT from this draft alone. The main agent submits via the
> Devpost form after the checklist at the bottom is green.

## Title

**FinePrint — Understand any contract in plain language, privately**

## Tagline (one line)

Paste a contract, get the truth in plain English — short documents are
analysed on your device by Gemini Nano, long ones by Gemini in the cloud.

## Description (Devpost "text description")

FinePrint explains contracts, terms of service and leases in plain
language: what you are agreeing to, what could hurt you, and what you
have to do. It is built on Firebase AI Logic hybrid inference — one SDK
call that runs on-device when a local model is available and falls back
to the cloud when it is not.

**How Firebase AI Logic is used.** The app creates one hybrid model
with `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE,
inCloudParams: { model: 'gemini-2.5-flash' } })`. Short documents
(≤ 3,000 characters, a Remote Config threshold) go to Gemini Nano in
Chrome via the Prompt API — private, offline and free. Long documents
are chunked and analysed by Gemini 2.5 Flash in the cloud, then
synthesised into a single verdict. A "Stay on this device" mode uses
`InferenceMode.ONLY_ON_DEVICE` and never sends the document to any
server. Every answer carries its `response.inferenceSource`, shown as a
badge (ON-DEVICE · GEMINI NANO / CLOUD · GEMINI 2.5 FLASH) with latency
and the routing reason, so the hybrid behaviour is visible in the product
itself, not just claimed here. The on-device model is pre-downloaded on
a user gesture via `model.initializeDeviceModel()`.

**Other Firebase products.** App Check (reCAPTCHA v3) protects the
cloud calls; anonymous Authentication signs users in with no account;
Firestore stores each user's analysis history; Remote Config holds the
routing thresholds so they can be tuned without a redeploy.

**Why it matters.** A contract is the most private text most people
own — analysing it on-device is a real privacy win, not a demo trick.
And most people sign things they do not understand: FinePrint's
plain-language summary, red-flag detector, obligations checklist and
key-facts table turn a 12-page lease into a 2-minute read. It is free,
needs no account, and works offline for short documents.

**What I built during the submission period (15–30 Nov 2026).** The
entire app is new for this hackathon: Vite + Firebase JS SDK 13.3.0
web app (index.html, src/ai.js hybrid layer, src/store.js,
src/remoteConfig.js, 3 built-in sample documents), 20 unit tests,
headless-Chrome UI smoke tests, and this submission package. No
pre-existing code was reused.

## Links (fill in at submit time)

- **Public repo:** https://github.com/slowwwkiss/fineprint
  (Apache-2.0, public — Firebase AI Logic imported AND called at runtime
  in `src/ai.js`; no secrets in the repo, placeholder config only.)
- **Hosted demo:** https://slowwwkiss.github.io/fineprint/
  (or the Firebase Hosting URL — update this line when deployed)
- **Demo video (YouTube, public, ≤ 3 min, English):** _link after recording_
  (storyboard: DEMO-SCRIPT.md)

## Pre-submit checklist

- [ ] Firebase project created + web config in `.env` (SETUP.md steps 1–5)
- [ ] `npm run verify` all-green (37 checks: files, parsing, SDK wiring,
      no secrets, 20 unit tests, vite build, sample coverage)
- [ ] Deployed demo smoke-tested in a real Chrome desktop (SETUP.md step 7):
      short sample → ON-DEVICE badge; long sample → CLOUD badge;
      Q&A + compare + history all work
- [ ] Repo public on GitHub, Apache-2.0 LICENSE visible, no `.env` committed
- [ ] Demo video recorded + uploaded to YouTube (public, ≤ 3 min, English)
- [ ] Devpost form filled: title, tagline, description (above), repo URL,
      demo URL, video URL, platform = Web (Chrome)
- [ ] Submit before **Mon 1 Dec 2026 05:00 WIB** (30 Nov 14:00 PT)
