# GATE-CHECK.md — #BuildHybridAI 2026

Checked 15 Nov 2026 ~21:56 WIB from the live Devpost pages (not from
memory). Sources:
- https://firebasehybridaihackathon.devpost.com/ (main page, crawled <1 min before check)
- https://firebasehybridaihackathon.devpost.com/rules (Official Rules)
- https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference
  (Firebase AI Logic hybrid inference docs)
- Installed SDK: firebase 13.3.0 (types inspected in node_modules)

## Verdict: GO — all gates pass

| Gate | Value seen | Time seen |
|---|---|---|
| Prize pool | $30,000 total: Grand $10,000, 1st Runner Up $7,000, 2nd Runner Up $4,000, Best iOS $3,000, Best Android $3,000, Best Web/Chrome $3,000 | 15 Nov 21:56 WIB |
| Submission deadline | Sun 30 Nov 2026 14:00 PT = **Mon 1 Dec 2026 05:00 WIB** | 15 Nov 21:56 WIB |
| Submission period | 11 Nov 2026 13:30 PT – 30 Nov 2026 14:00 PT (open NOW) | 15 Nov 21:56 WIB |
| Judging | 10–16 Dec 2026 PT | 15 Nov 21:56 WIB |
| Winners announced | On or around 21 Dec 2026 12:00 PT (payout December) | 15 Nov 21:56 WIB |
| Entry fee | None. "NO PURCHASE NECESSARY TO ENTER OR WIN." Text inference free within limits; Google Account Quota optional (request windows each Monday; Sprint 3 final: request by Wed 25 Nov 10:00 PT, account sent Fri 27 Nov, valid 4 days) | 15 Nov 21:56 WIB |
| Eligibility | Open to most countries. EXCLUDED: Brazil, Italy, Quebec, Crimea, Cuba, Iran, Syria, North Korea, Sudan, Belarus, Russia + OFAC. **Indonesia is NOT excluded.** Must be above age of majority (user: 27). Solo entry allowed. | 15 Nov 21:56 WIB |
| Platform | Web (Chrome) with Gemini Nano 4 via Firebase AI Logic. Multi-platform preferred, but "an outstanding single-platform app can still win." | 15 Nov 21:56 WIB |
| Required tech | Gen AI app using Firebase AI Logic + supported Firebase products (AppCheck, RemoteConfig, Firestore, Authentication). App Check required; debug tokens accepted in submissions. | 15 Nov 21:56 WIB |
| Repo requirements | Public, open-source licence (Apache preferred, any OSI ok). Must demonstrate Firebase AI Logic at runtime — imported AND actually called, not just named in the README. No production API keys / secrets / PII in the repo. | 15 Nov 21:56 WIB |
| Video | ≤ 3 min, YouTube public, English or English subtitles, must show the project functioning on its platform. | 15 Nov 21:56 WIB |
| Project must be free | Yes — "your project must be available free of charge." | 15 Nov 21:56 WIB |
| Multiple submissions | Allowed if substantially different. | 15 Nov 21:56 WIB |

## Judging criteria (from the Devpost page)

1. **Technological Implementation** — how well the project is built and
   how effectively it uses Firebase AI Logic hybrid inference.
2. **Design** — complete, coherent product experience, not just a proof
   of concept.
3. **Potential Impact** — credible, specific case for solving a real
   problem for a real audience.
4. **Quality of the Idea** — creative, non-obvious use of Firebase AI
   Logic; genuine understanding of the problem space.

## Risks (recorded, not hidden)

1. **On-device testing in this VM is impossible.** The VM's headless
   Chromium Prompt API is an echo stub ("On-device model is not
   available in Chromium, this API is just echoing back the input").
   First real Nano run must happen in a real Chrome desktop on the
   deployed demo — before the video is recorded. (Probed 15 Nov 22:00 WIB.)
2. **Cloud path needs a Firebase project** (main-agent step, SETUP.md).
   Free tier covers text inference; no billing card needed.
3. **Deadline is 15 days out** (1 Dec 05:00 WIB). Build is done;
   remaining work is project setup + deploy + video + submit.

## Blocking constraints

None. No fee, no excluded country, no missing account on the user side
for building (Firebase project creation is a main-agent browser step,
not a blocker for the build itself).
