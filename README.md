# FinePrint — Understand any contract in plain language

**Built for #BuildHybridAI 2026** (Google / Firebase, via Devpost).
Grand Prize $10,000 · Best Web/Chrome App $3,000 · Total $30,000.

FinePrint reads contracts, terms of service and leases, and explains them
like a friend would: what you are agreeing to, what could hurt you, and
what you have to do. **Short documents never leave your device** — they are
analysed on-device by Gemini Nano. Long documents fall back to Gemini in
the cloud. One SDK — Firebase AI Logic hybrid inference — decides, and
every answer tells you which engine wrote it.

## Why this is a hybrid-inference app, not a chatbot wrapper

- **Privacy is the reason for on-device.** A contract is the most private
  text most people own. Analysing it on-device means it never leaves the
  reader's machine — that is a real product reason to prefer the local
  model, not a demo trick.
- **Length is the reason for the cloud.** Gemini Nano's context is small.
  Long documents are chunked and analysed by Gemini 2.5 Flash, then
  synthesised into one verdict. The fallback is part of the design.
- **The hybrid behaviour is visible.** Every verdict carries a badge read
  from `response.inferenceSource` — `ON-DEVICE · GEMINI NANO` or
  `CLOUD · GEMINI 2.5 FLASH` — plus latency, character count and the
  routing reason. Judges can see the SDK working; they do not have to
  take our word for it.
- **"Stay on this device" is a real mode** (`InferenceMode.ONLY_ON_DEVICE`):
  the document is never sent to any server, and the app says so — and
  fails honestly instead of silently falling back.

## Firebase products used

| Product | What it does here |
|---|---|
| **AI Logic** | Hybrid inference: `PREFER_ON_DEVICE` (Nano ↔ Gemini 2.5 Flash), `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`; `initializeDeviceModel` pre-downloads Nano on a user gesture |
| **App Check** | reCAPTCHA v3 protects cloud calls (debug token in development) |
| **Authentication** | Anonymous sign-in — no account needed |
| **Firestore** | Analysis history, per anonymous user |
| **Remote Config** | Routing thresholds (`on_device_max_chars`, `cloud_chunk_chars`, `cloud_model`, `enable_compare`) — tunable without a redeploy |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 — on-device works with zero setup
npm run build      # -> dist/
npm run verify     # gate checks: files, parsing, SDK wiring, secrets, tests, build
```

**Zero-setup demo:** with no Firebase project configured, the app runs in
placeholder mode — on-device analysis works in a real Chrome desktop
(Gemini Nano needs downloading first: click "Download on-device model"),
while cloud features explain politely that they need a project. To unlock
the cloud path, follow the one-time checklist in [SETUP.md](SETUP.md)
(create a Firebase project, paste the web config into `.env`).

## Project layout

```
index.html            — app shell
src/main.js           — UI wiring
src/ai.js             — hybrid inference layer (routing, prompts, parsing)
src/firebase-config.js— config + placeholder mode
src/firebase-app.js   — one shared Firebase app instance
src/store.js          — history (Firestore, localStorage fallback)
src/remoteConfig.js   — routing thresholds
src/samples.js        — 3 sample documents (2 short = on-device, 1 long = cloud)
src/styles.css        — styling
scripts/verify-app.sh — gate checks
scripts/test-logic.mjs— unit tests for the pure logic (20 checks)
scripts/ui-smoke.mjs  — headless-Chrome UI smoke test (dev tool)
scripts/nano-test*.mjs— Prompt API probing (dev tool)
```

## How routing works

| Document | Engine | Why |
|---|---|---|
| ≤ 3,000 chars (Remote Config) | `PREFER_ON_DEVICE` | Nano if present, cloud fallback by the SDK |
| > 3,000 chars | `PREFER_IN_CLOUD`, chunked | Too long for the on-device model |
| "Stay on this device" on | `ONLY_ON_DEVICE` | Privacy choice — never leaves the device |

Thresholds come from Remote Config; the values above are the defaults
used when Remote Config is unavailable.

## Submission

See [SUBMISSION-DRAFT.md](SUBMISSION-DRAFT.md) for the Devpost fields
(title, description, links) and the pre-submit checklist. Demo video
storyboard: [DEMO-SCRIPT.md](DEMO-SCRIPT.md).

## Licence

Apache License 2.0 — see [LICENSE](LICENSE).
