// ---------------------------------------------------------------------------
// FinePrint — UI wiring. All AI goes through src/ai.js; all persistence
// through src/store.js; all thresholds through src/remoteConfig.js.
// ---------------------------------------------------------------------------

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  analyzeDocument,
  askQuestion,
  checkOnDevice,
  compareDocuments,
  downloadOnDeviceModel
} from './ai.js';
import {
  firebaseConfig,
  isAppCheckConfigured,
  isFirebaseConfigured
} from './firebase-config.js';
import { getFirebaseApp } from './firebase-app.js';
import { listAnalyses, saveAnalysis } from './store.js';
import { loadThresholds } from './remoteConfig.js';
import { SAMPLES } from './samples.js';
import { DEFAULTS } from './ai.js';

const $ = (id) => document.getElementById(id);

let thresholds = { ...DEFAULTS, enableCompare: true, source: 'local defaults' };
let onDeviceStatus = null; // 'available' | 'downloadable' | 'downloading' | 'unavailable' | null
let currentDoc = '';
let currentAnalysis = null;

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

function initAppCheck() {
  // App Check protects the cloud calls. With a reCAPTCHA v3 site key it
  // works for every visitor; without one we skip it and say so in the
  // status panel (local demo mode). Debug tokens are for development:
  // set VITE_APPCHECK_DEBUG=true to enable the debug-token flow.
  if (!isFirebaseConfigured) return;
  try {
    if (isAppCheckConfigured) {
      initializeAppCheck(getFirebaseApp(), {
        provider: new ReCaptchaV3Provider(firebaseConfig.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch (e) {
    console.warn('[FinePrint] App Check init failed:', e.message);
  }
}

function setPill(id, text, kind) {
  const el = $(id);
  el.textContent = text;
  el.classList.remove('pill-ok', 'pill-warn', 'pill-bad');
  if (kind) el.classList.add(kind);
}

async function refreshStatus() {
  // On-device pill
  onDeviceStatus = await checkOnDevice();
  if (onDeviceStatus === 'available') {
    setPill('pill-device', 'On-device: ready (Gemini Nano)', 'pill-ok');
  } else if (onDeviceStatus === 'downloadable' || onDeviceStatus === 'downloading') {
    setPill('pill-device', 'On-device: model not downloaded yet', 'pill-warn');
  } else if (onDeviceStatus === 'unavailable') {
    setPill('pill-device', 'On-device: not available here', 'pill-bad');
  } else {
    setPill('pill-device', 'On-device: not supported by this browser', 'pill-bad');
  }
  // Cloud pill
  if (isFirebaseConfigured) {
    setPill('pill-cloud', 'Cloud: configured (Gemini 2.5 Flash)', 'pill-ok');
  } else {
    setPill('pill-cloud', 'Cloud: not configured — see SETUP.md', 'pill-warn');
  }
  $('thresholds-line').textContent =
    `Routing thresholds (${thresholds.source}): documents up to ${thresholds.onDeviceMaxChars.toLocaleString()} characters prefer on-device; ` +
    `longer documents are analysed in the cloud in ${thresholds.cloudChunkChars.toLocaleString()}-character chunks.`;
}

async function refreshHistory() {
  const items = await listAnalyses();
  $('history-backend').textContent = isFirebaseConfigured
    ? 'Stored in Firestore (anonymous account)'
    : 'Stored locally in this browser (Firebase not configured)';
  const list = $('history-list');
  list.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No analyses yet. Your first one will appear here.';
    list.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const badge = item.source === 'on_device' ? 'ON-DEVICE' : item.source === 'in_cloud' ? 'CLOUD' : '—';
    li.innerHTML = `<button type="button" class="history-item">
      <span class="history-title"></span>
      <span class="history-meta"></span>
      <span class="badge ${item.source === 'on_device' ? 'badge-device' : 'badge-cloud'}">${badge}</span>
    </button>`;
    li.querySelector('.history-title').textContent = item.title || 'Untitled document';
    li.querySelector('.history-meta').textContent =
      `${new Date(item.createdAt).toLocaleString()} · ${(item.chars || 0).toLocaleString()} chars`;
    li.querySelector('button').addEventListener('click', () => renderResults(item));
    list.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Routing preview
// ---------------------------------------------------------------------------

function updateRoutePreview() {
  const text = $('doc-input').value;
  const n = text.length;
  $('char-count').textContent = `${n.toLocaleString()} characters`;
  const stay = $('stay-device').checked;
  const preview = $('route-text');
  if (!n) {
    preview.textContent = 'Paste a document to see where it will be analysed.';
    return;
  }
  if (stay) {
    preview.textContent =
      'Will run ON-DEVICE ONLY — this document will never leave your device. ' +
      (onDeviceStatus === 'available'
        ? 'Gemini Nano is ready.'
        : 'If no local model is available, analysis will fail rather than fall back to the cloud.');
    return;
  }
  if (n <= thresholds.onDeviceMaxChars) {
    preview.textContent =
      `Short document (${n.toLocaleString()} chars) — will prefer ON-DEVICE (Gemini Nano)` +
      (onDeviceStatus === 'available'
        ? ', which is ready.'
        : onDeviceStatus
          ? ', falling back to the cloud if the model is not ready.'
          : ', falling back to the cloud on browsers without a local model.');
  } else {
    preview.textContent =
      `Long document (${n.toLocaleString()} chars) — will run IN THE CLOUD (Gemini 2.5 Flash), ` +
      `in ${Math.ceil(n / thresholds.cloudChunkChars)} chunk(s).`;
  }
}

// ---------------------------------------------------------------------------
// Results rendering
// ---------------------------------------------------------------------------

function badgeFor(source) {
  return source === 'on_device'
    ? { text: 'ON-DEVICE · GEMINI NANO', cls: 'badge-device' }
    : source === 'in_cloud'
      ? { text: 'CLOUD · GEMINI 2.5 FLASH', cls: 'badge-cloud' }
      : { text: 'ENGINE UNKNOWN', cls: '' };
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function renderResults(record) {
  const { analysis, source, latencyMs, route, chars } = record;
  const badge = badgeFor(source);
  const badgeEl = $('result-badge');
  badgeEl.textContent = badge.text;
  badgeEl.className = `badge ${badge.cls}`;
  $('result-route').textContent =
    `${route || ''} · ${(chars || 0).toLocaleString()} characters · answered in ${(latencyMs || 0).toLocaleString()} ms` +
    (source === 'on_device' ? ' · this document never left your device.' : '');
  $('result-summary').innerHTML =
    (analysis.summary || []).map((s) => `<li>${esc(s)}</li>`).join('') ||
    '<li class="muted">No summary returned.</li>';
  const flags = analysis.redFlags || [];
  $('flags-count').textContent = flags.length ? `(${flags.length})` : '(none found)';
  $('result-flags').innerHTML = flags.length
    ? flags.map((f) => `<div class="flag flag-${esc(f.severity)}">
        <strong>${esc(f.clause)}</strong>
        <span class="flag-sev">${esc(f.severity)}</span>
        <p>${esc(f.why)}</p>
      </div>`).join('')
    : '<p class="muted">No unusual or one-sided clauses stood out.</p>';
  $('result-obligations').innerHTML =
    (analysis.obligations || []).map((o) => `<li>${esc(o)}</li>`).join('') ||
    '<li class="muted">No specific obligations found.</li>';
  $('result-facts').innerHTML =
    (analysis.keyFacts || []).map((k) => `<dt>${esc(k.label)}</dt><dd>${esc(k.value)}</dd>`).join('') ||
    '<dt class="muted">No key dates or amounts found.</dt>';
  $('results').hidden = false;
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function onAnalyse() {
  const text = $('doc-input').value.trim();
  const err = $('analyse-error');
  err.hidden = true;
  if (!text) {
    err.textContent = 'Paste a document first — or try one of the samples above.';
    err.hidden = false;
    return;
  }
  const btn = $('analyse-btn');
  const progress = $('analyse-progress');
  const bar = $('analyse-progress-bar');
  const ptext = $('analyse-progress-text');
  btn.disabled = true;
  progress.hidden = false;
  bar.style.width = '15%';
  ptext.textContent = 'Analysing…';
  try {
    const result = await analyzeDocument(text, {
      thresholds,
      stayOnDevice: $('stay-device').checked,
      onProgress: (f) => {
        bar.style.width = `${Math.round(15 + f * 70)}%`;
        ptext.textContent = `Analysing in the cloud… ${Math.round(f * 100)}%`;
      }
    });
    bar.style.width = '100%';
    ptext.textContent = 'Done.';
    currentDoc = text;
    currentAnalysis = result;
    const title = text.slice(0, 60).replace(/\s+/g, ' ').trim();
    await saveAnalysis({
      title,
      chars: result.chars,
      source: result.source,
      route: result.route,
      latencyMs: result.latencyMs,
      analysis: result.analysis
    });
    renderResults(result);
    await refreshHistory();
  } catch (e) {
    console.warn('[FinePrint] analysis failed:', String(e.message || e).slice(0, 200));
    err.textContent = friendlyError(e);
    err.hidden = false;
  } finally {
    btn.disabled = false;
    setTimeout(() => { progress.hidden = true; }, 1200);
  }
}

function friendlyError(e) {
  const msg = String(e && e.message || e);
  if (/not configured/i.test(msg)) {
    return 'Firebase is not configured yet, so the cloud path cannot run. ' +
      'On-device analysis needs a Chrome with Gemini Nano — or add the Firebase web config (see SETUP.md).';
  }
  if (/on-device|on device|only_on_device|NOT_AVAILABLE|not available/i.test(msg)) {
    return 'The on-device model is not available in this browser, and "Stay on this device" is on. ' +
      'Turn that option off to allow the cloud fallback, or download the model first.';
  }
  if (/App Check|app-check|appCheck/i.test(msg)) {
    return 'The cloud call was refused by App Check. The Firebase project needs App Check set up (see SETUP.md).';
  }
  if (/permission|API key not valid|API_KEY_INVALID/i.test(msg)) {
    return 'The Firebase project rejected the request (API key or permissions). Check the web config in .env (see SETUP.md).';
  }
  return `Analysis failed: ${msg.slice(0, 300)}`;
}

async function onAsk() {
  const q = $('qa-input').value.trim();
  const err = $('qa-error');
  err.hidden = true;
  if (!q) { err.textContent = 'Type a question first.'; err.hidden = false; return; }
  if (!currentDoc) { err.textContent = 'Analyse a document first.'; err.hidden = false; return; }
  const btn = $('qa-btn');
  btn.disabled = true;
  try {
    const { answer, source, latencyMs } = await askQuestion(currentDoc, q, {
      thresholds,
      stayOnDevice: $('stay-device').checked
    });
    const box = $('qa-answer');
    const badge = badgeFor(source);
    box.innerHTML = `<span class="badge ${badge.cls}">${badge.text}</span>
      <p></p><p class="muted small">answered in ${latencyMs.toLocaleString()} ms</p>`;
    box.querySelector('p').textContent = answer;
    box.hidden = false;
  } catch (e) {
    err.textContent = friendlyError(e);
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function onCompare() {
  const other = $('compare-input').value.trim();
  const err = $('compare-error');
  err.hidden = true;
  if (!other) { err.textContent = 'Paste the new version first.'; err.hidden = false; return; }
  if (!currentDoc) { err.textContent = 'Analyse a document first.'; err.hidden = false; return; }
  const btn = $('compare-btn');
  btn.disabled = true;
  try {
    const res = await compareDocuments(currentDoc, other);
    const box = $('compare-result');
    const badge = badgeFor(res.source);
    const list = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="muted">None.</li>';
    box.innerHTML = `
      <p><span class="badge ${badge.cls}">${badge.text}</span></p>
      <p><strong>Verdict:</strong> ${esc(res.verdict || '—')}</p>
      <h4>What changed</h4><ul>${list(res.changed)}</ul>
      <h4>Stricter for you</h4><ul>${list(res.stricter)}</ul>
      <h4>Looser for you</h4><ul>${list(res.looser)}</ul>`;
    box.hidden = false;
  } catch (e) {
    err.textContent = friendlyError(e);
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function onDownloadModel() {
  const status = $('download-status');
  const btn = $('download-model');
  btn.disabled = true;
  status.textContent = 'Starting download… (keep this tab open)';
  try {
    await downloadOnDeviceModel((f) => {
      status.textContent = `Downloading on-device model… ${Math.round(f * 100)}%`;
    });
    status.textContent = 'On-device model ready.';
    await refreshStatus();
  } catch (e) {
    status.textContent = `Download failed: ${String(e.message || e).slice(0, 120)} — the cloud fallback still works.`;
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------

function initSamples() {
  const wrap = $('sample-buttons');
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-small';
    b.textContent = s.title;
    b.title = s.note;
    b.addEventListener('click', () => {
      $('doc-input').value = s.text;
      updateRoutePreview();
      $('doc-input').focus();
    });
    wrap.appendChild(b);
  }
}

$('doc-input').addEventListener('input', updateRoutePreview);
$('stay-device').addEventListener('change', updateRoutePreview);
$('file-input').addEventListener('change', async (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  $('doc-input').value = await f.text();
  updateRoutePreview();
});
$('analyse-btn').addEventListener('click', onAnalyse);
$('qa-btn').addEventListener('click', onAsk);
$('qa-input').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') onAsk(); });
$('compare-btn').addEventListener('click', onCompare);
$('download-model').addEventListener('click', onDownloadModel);

// Compare needs the cloud — hide it when Firebase is not configured.
if (!isFirebaseConfigured) $('compare-box').style.display = 'none';

initAppCheck();
initSamples();
thresholds = await loadThresholds();
await refreshStatus();
await refreshHistory();
updateRoutePreview();
