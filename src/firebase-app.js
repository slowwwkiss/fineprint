// ---------------------------------------------------------------------------
// FinePrint — one shared Firebase app instance.
//
// initializeApp() throws if called twice, so every module goes through
// this getter. The config handed to the SDK is always present (real values
// from .env, or clearly-marked placeholders — see firebase-config.js), so
// this never throws for a missing project: on-device inference works with
// placeholders, and cloud features check isFirebaseConfigured themselves.
// ---------------------------------------------------------------------------

import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config.js';

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
