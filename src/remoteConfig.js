// ---------------------------------------------------------------------------
// FinePrint — Remote Config.
//
// Routing thresholds live in Remote Config so they can be tuned without a
// redeploy. When Remote Config is unavailable (no Firebase project, offline,
// first run), the app uses the local defaults from ai.js — the feature
// never blocks on a config fetch.
// ---------------------------------------------------------------------------

import {
  fetchAndActivate,
  getNumber,
  getRemoteConfig,
  getString
} from 'firebase/remote-config';
import { isFirebaseConfigured } from './firebase-config.js';
import { getFirebaseApp } from './firebase-app.js';
import { DEFAULTS } from './ai.js';

let rc = null;
let fetched = false;

function ensureRC() {
  if (!isFirebaseConfigured) return null;
  if (!rc) {
    const app = getFirebaseApp();
    rc = getRemoteConfig(app);
    // Dev-friendly: allow a fresh fetch at most every 10 minutes.
    rc.settings = { minimumFetchIntervalMillis: 600000, fetchTimeoutMillis: 8000 };
    // Local defaults — identical to ai.js DEFAULTS, so behaviour is the
    // same whether or not the fetch succeeds.
    rc.defaultConfig = {
      on_device_max_chars: String(DEFAULTS.onDeviceMaxChars),
      cloud_chunk_chars: String(DEFAULTS.cloudChunkChars),
      cloud_model: DEFAULTS.cloudModel,
      enable_compare: 'true'
    };
  }
  return rc;
}

/** Fetch + activate Remote Config (best effort). Returns the live
 *  thresholds, or the defaults when anything goes wrong. */
export async function loadThresholds() {
  const remote = ensureRC();
  if (!remote) return { ...DEFAULTS, enableCompare: true, source: 'local defaults' };
  if (!fetched) {
    fetched = true;
    try {
      await fetchAndActivate(remote);
    } catch (e) {
      console.warn('[FinePrint] Remote Config fetch failed, using defaults:', e.message);
    }
  }
  try {
    return {
      onDeviceMaxChars: Math.max(500, getNumber(remote, 'on_device_max_chars') || DEFAULTS.onDeviceMaxChars),
      cloudChunkChars: Math.max(2000, getNumber(remote, 'cloud_chunk_chars') || DEFAULTS.cloudChunkChars),
      cloudModel: getString(remote, 'cloud_model') || DEFAULTS.cloudModel,
      enableCompare: getString(remote, 'enable_compare') !== 'false',
      source: 'remote config'
    };
  } catch {
    return { ...DEFAULTS, enableCompare: true, source: 'local defaults' };
  }
}
