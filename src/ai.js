// ---------------------------------------------------------------------------
// FinePrint — hybrid inference layer (Firebase AI Logic).
//
// This is the core of the entry: ONE SDK call path that runs on-device when
// a local model is available and falls back to the cloud when it is not.
//   - Short / private documents  -> PREFER_ON_DEVICE  (Gemini Nano in Chrome)
//   - Long documents            -> PREFER_IN_CLOUD   (Gemini 2.5 Flash)
//   - "Stay on this device"     -> ONLY_ON_DEVICE    (never touches a server)
// Every AI answer carries its inference source (response.inferenceSource),
// which the UI shows as a badge — the hybrid behaviour is visible, not
// just claimed in the README.
// ---------------------------------------------------------------------------

import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { isFirebaseConfigured } from './firebase-config.js';
import { getFirebaseApp } from './firebase-app.js';

// Remote-config-driven routing thresholds (defaults used when Remote
// Config is unavailable — see remoteConfig.js).
export const DEFAULTS = {
  onDeviceMaxChars: 3000,
  cloudChunkChars: 6000,
  cloudModel: 'gemini-2.5-flash'
};

let ai = null;

function ensureAI() {
  if (ai) return ai;
  // The app instance always initialises (real config, or placeholders —
  // see firebase-config.js). On-device inference works with placeholders;
  // cloud calls are guarded in generate() instead of here.
  if (!ai) ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() });
  return ai;
}

const NOT_CONFIGURED = new Error(
  'Firebase is not configured yet, so the cloud path cannot run. ' +
  'Add the Firebase web config (see SETUP.md), or use "Stay on this device" ' +
  'with a Chrome that has Gemini Nano.'
);


/** Is the browser's on-device model (Gemini Nano via Chrome Prompt API)
 *  available, downloadable, or unavailable? Returns null when the API
 *  does not exist in this browser at all. */
export async function checkOnDevice() {
  try {
    if (typeof window === 'undefined' || !('LanguageModel' in window)) return null;
    return await window.LanguageModel.availability();
  } catch {
    return null;
  }
}

/** Download the on-device model ahead of time. MUST be called from a user
 *  gesture (button click) — the Prompt API refuses downloads otherwise.
 *  Calls onProgress(0..1). Resolves when the model is ready. */
export async function downloadOnDeviceModel(onProgress) {
  ensureAI();
  const model = getGenerativeModel(ensureAI(), {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: { model: DEFAULTS.cloudModel }
  });
  await model.initializeDeviceModel(onProgress);
  return model;
}

function hybridModel() {
  return getGenerativeModel(ensureAI(), {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: { model: DEFAULTS.cloudModel }
  });
}

function cloudModel() {
  return getGenerativeModel(ensureAI(), {
    mode: InferenceMode.PREFER_IN_CLOUD,
    inCloudParams: { model: DEFAULTS.cloudModel }
  });
}

function onDeviceOnlyModel() {
  return getGenerativeModel(ensureAI(), {
    mode: InferenceMode.ONLY_ON_DEVICE,
    inCloudParams: { model: DEFAULTS.cloudModel }
  });
}

/**
 * One generation call. Returns { text, source, latencyMs } where source is
 * 'on_device' | 'in_cloud' | 'unknown' (from response.inferenceSource).
 * Cloud is refused up front when no real Firebase project is configured;
 * an on-device attempt that silently falls back to a dead cloud endpoint
 * is translated into the same clear message instead of a raw API error.
 */
export async function generate(prompt, which = 'hybrid') {
  if (which === 'cloud' && !isFirebaseConfigured) throw NOT_CONFIGURED;
  const t0 = performance.now();
  const model =
    which === 'cloud' ? cloudModel()
    : which === 'device' ? onDeviceOnlyModel()
    : hybridModel();
  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (e) {
    // With placeholder config the cloud can never work. If the call threw
    // at all, it means on-device was unavailable AND the cloud is
    // unconfigured — the useful message is the setup one, not the raw
    // SDK error (which leaks the placeholder project id and a raw URL).
    if (!isFirebaseConfigured) throw NOT_CONFIGURED;
    throw e;
  }
  const response = result.response;
  return {
    text: response.text(),
    source: response.inferenceSource || 'unknown',
    latencyMs: Math.round(performance.now() - t0)
  };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const ANALYSIS_INSTRUCTION = `You are FinePrint, a plain-language legal explainer. Explain the document below so a non-lawyer can understand it. Reply ONLY with a JSON object — no markdown fences, no commentary, no extra text — shaped exactly like this:
{
  "summary": ["4 to 6 short plain-language bullets covering what this document is, who it binds, and what matters most"],
  "redFlags": [{"clause": "short name of the clause", "why": "why a reader should worry, in plain words", "severity": "high" | "medium" | "low"}],
  "obligations": ["things the reader must do, must not do, or must pay — each one short"],
  "keyFacts": [{"label": "e.g. Notice period", "value": "e.g. 30 days"}]
}
Rules:
- Plain everyday English. Explain any legal term you must use.
- If something is not stated in the document, say "Not stated in this document" — never invent dates, amounts, names, or obligations.
- Red flags: only clauses that are actually unusual, one-sided, or costly. An ordinary clause is not a red flag.
- Keep every string short enough to read at a glance.`;

function buildAnalysisPrompt(docText) {
  return `${ANALYSIS_INSTRUCTION}\n\nDOCUMENT:\n"""\n${docText}\n"""`;
}

/** Best-effort parse of a model reply into the analysis shape. Never throws:
 *  unparseable output becomes a single-bullet summary with the raw text. */
export function parseAnalysis(text) {
  const empty = {
    summary: [],
    redFlags: [],
    obligations: [],
    keyFacts: []
  };
  if (!text) return { ...empty, summary: ['The model returned no text.'] };
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('no JSON object');
    const obj = JSON.parse(text.slice(start, end + 1));
    return {
      summary: Array.isArray(obj.summary) ? obj.summary.map(String) : [],
      redFlags: Array.isArray(obj.redFlags)
        ? obj.redFlags.map((f) => ({
            clause: String(f.clause || 'Untitled clause'),
            why: String(f.why || ''),
            severity: ['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium'
          }))
        : [],
      obligations: Array.isArray(obj.obligations) ? obj.obligations.map(String) : [],
      keyFacts: Array.isArray(obj.keyFacts)
        ? obj.keyFacts.map((k) => ({
            label: String(k.label || ''),
            value: String(k.value || '')
          }))
        : []
    };
  } catch {
    // Fallback: show the raw text as the summary so nothing is lost.
    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[-*•\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 8);
    return { ...empty, summary: lines.length ? lines : [text.slice(0, 600)] };
  }
}

/**
 * Pure routing decision (exported for tests): which engine should handle
 * a document of `chars` characters?
 *  - stayOnDevice          -> 'device'  (ONLY_ON_DEVICE)
 *  - chars <= onDeviceMax  -> 'hybrid'  (PREFER_ON_DEVICE; SDK falls back)
 *  - chars >  onDeviceMax  -> 'cloud'   (chunked cloud analysis)
 */
export function decideRoute(chars, thresholds, stayOnDevice) {
  if (stayOnDevice) {
    return { mode: 'device', route: 'on-device only (your choice)' };
  }
  if (chars <= thresholds.onDeviceMaxChars) {
    return { mode: 'hybrid', route: 'on-device (Gemini Nano) — private, offline, free' };
  }
  const chunks = Math.ceil(chars / thresholds.cloudChunkChars);
  return {
    mode: 'cloud',
    route: `cloud (Gemini 2.5 Flash) — document too long for the on-device model (${chunks} chunk${chunks === 1 ? '' : 's'})`
  };
}

function chunkText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

/**
 * Analyse a document. Routing (visible in the UI):
 *  - stayOnDevice: ONLY_ON_DEVICE, throws if no local model.
 *  - short doc (<= onDeviceMaxChars): PREFER_ON_DEVICE — Nano if present,
 *    cloud fallback handled by the SDK.
 *  - long doc: chunked cloud analysis, then one synthesis pass.
 * Returns { analysis, source, latencyMs, chunks, chars, route }.
 */
export async function analyzeDocument(docText, opts = {}) {
  const thresholds = opts.thresholds || DEFAULTS;
  const t0 = performance.now();
  const chars = docText.length;
  const decision = decideRoute(chars, thresholds, Boolean(opts.stayOnDevice));

  if (decision.mode === 'device') {
    const { text, source, latencyMs } = await generate(buildAnalysisPrompt(docText), 'device');
    return {
      analysis: parseAnalysis(text),
      source,
      latencyMs,
      chunks: 1,
      chars,
      route: decision.route
    };
  }

  if (decision.mode === 'hybrid') {
    const { text, source, latencyMs } = await generate(buildAnalysisPrompt(docText), 'hybrid');
    return {
      analysis: parseAnalysis(text),
      source,
      latencyMs,
      chunks: 1,
      chars,
      route: source === 'on_device'
        ? decision.route
        : 'cloud fallback (Gemini 2.5 Flash) — on-device model was not available'
    };
  }

  // Long document: chunk -> summarise each chunk in the cloud -> synthesise.
  const chunks = chunkText(docText, thresholds.cloudChunkChars);
  const partials = [];
  let lastSource = 'in_cloud';
  for (let i = 0; i < chunks.length; i++) {
    const part = await generate(
      `${ANALYSIS_INSTRUCTION}\n\nThis is part ${i + 1} of ${chunks.length} of a longer document. Analyse ONLY this part.\n\nDOCUMENT PART ${i + 1}:\n"""\n${chunks[i]}\n"""`,
      'cloud'
    );
    lastSource = part.source;
    partials.push(part.text);
    if (opts.onProgress) opts.onProgress((i + 1) / chunks.length);
  }
  const synth = await generate(
    `${ANALYSIS_INSTRUCTION}\n\nMerge these part-analyses of ONE document into a single analysis. Deduplicate, keep the sharpest red flags, and combine the obligations and key facts.\n\nPART ANALYSES:\n${partials.join('\n---\n')}`,
    'cloud'
  );
  return {
    analysis: parseAnalysis(synth.text),
    source: lastSource,
    latencyMs: Math.round(performance.now() - t0),
    chunks: chunks.length,
    chars,
    route: decision.route
  };
}

/** Ask one question about a document. Answers ONLY from the document. */
export async function askQuestion(docText, question, opts = {}) {
  const short = docText.length <= (opts.thresholds || DEFAULTS).onDeviceMaxChars;
  const which = opts.stayOnDevice ? 'device' : short ? 'hybrid' : 'cloud';
  const prompt = `You answer questions about a document. Answer ONLY from the document text below. If the answer is not in the document, say exactly: "Not stated in this document." Quote the relevant sentence when you can. Keep the answer under 120 words, in plain English.\n\nDOCUMENT:\n"""\n${docText}\n"""\n\nQUESTION: ${question}`;
  const { text, source, latencyMs } = await generate(prompt, which);
  return { answer: text.trim(), source, latencyMs };
}

/** Compare two versions of a document (cloud — needs the bigger model). */
export async function compareDocuments(oldText, newText) {
  const prompt = `Compare these two versions of the same document and reply ONLY with a JSON object — no markdown fences, no commentary — shaped like this:
{
  "changed": ["each meaningful change, in plain words"],
  "stricter": ["changes that make things harder or riskier for the reader"],
  "looser": ["changes that make things easier or safer for the reader"],
  "verdict": "one sentence: overall, is the new version better or worse for the reader, and why?"
}
If a section is unchanged, do not list it. Never invent changes.\n\nOLD VERSION:\n"""\n${oldText}\n"""\n\nNEW VERSION:\n"""\n${newText}\n"""`;
  const { text, source, latencyMs } = await generate(prompt, 'cloud');
  let parsed;
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    parsed = { changed: [text.slice(0, 600)], stricter: [], looser: [], verdict: '' };
  }
  return { ...parsed, source, latencyMs };
}

export function initStatus() {
  return { configured: isFirebaseConfigured };
}
