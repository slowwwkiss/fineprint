# DEMO-SCRIPT.md — FinePrint demo video (≤ 3 minutes)

Record in a **real Chrome desktop (139+)**, on the **deployed demo URL**,
after SETUP.md step 7 passes (first real Nano run done). Narrate in
clear, natural English (or record silent and add English subtitles —
the rules require English or English subtitles). No face cam needed;
screen + voice is enough. Total target: **2:30**.

## 0:00–0:15 — Hook (show the problem)
- Screen: a dense freelance contract on screen (or the sample in the app).
- Say: "Most people sign contracts they never really read. FinePrint
  reads them for you — in plain language — and the short ones never
  leave your device."

## 0:15–0:45 — On-device analysis (the star)
- Click the **freelance contract sample** → point at the route preview:
  "Short document — will prefer on-device."
- Click **Download on-device model** (if not downloaded) → progress bar.
- Click **Explain this document**.
- Point at the badge as it appears: **ON-DEVICE · GEMINI NANO** +
  "this document never left your device."
- Scroll the summary + one red flag + one obligation. Say: "Private,
  offline, free — Gemini Nano, on this machine."

## 0:45–1:15 — Cloud fallback (long document)
- Click the **lease sample** → point at the route preview: "Long
  document — will run in the cloud, in chunks."
- Click **Explain**. Point at the badge: **CLOUD · GEMINI 2.5 FLASH**,
  chunk note, latency.
- Say: "Long documents don't fit the on-device model, so the same SDK
  hands them to Gemini in the cloud — then synthesises one verdict."

## 1:15–1:50 — Q&A + compare + privacy mode
- Ask: "Can the landlord raise my rent?" → show the answer + its badge.
- Toggle **Stay on this device**, re-run a short analysis → say: "This
  mode never sends anything to a server."
- (Optional, 10s) Compare: paste a tweaked clause, show stricter/looser.

## 1:50–2:30 — How it works + close
- Scroll to "How the hybrid engine works" → point at the Firebase
  products list (AI Logic, App Check, Auth, Firestore, Remote Config).
- Say: "One SDK — Firebase AI Logic hybrid inference — on-device when
  it can, cloud when it must. Free, no account. FinePrint — read before
  you sign."
- End card: app name + repo URL + demo URL (5 seconds, static).

## Recording checklist
- [ ] Real Chrome 139+ desktop, demo URL loaded, Nano downloaded
- [ ] Short sample → ON-DEVICE badge on camera; long sample → CLOUD badge
- [ ] No real personal data anywhere on screen (samples only)
- [ ] Audio clear, or English subtitles added
- [ ] Length ≤ 3:00 (target 2:30) · upload to YouTube as Public
- [ ] Title: "FinePrint — Understand any contract in plain language
      (#BuildHybridAI 2026)" · link in description: repo + demo URL
