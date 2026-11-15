// ---------------------------------------------------------------------------
// Firebase configuration for FinePrint.
//
// HOW CONFIG GETS IN (no secrets are ever committed to this repo):
//  - Local dev / demo build: copy `.env.example` to `.env` and fill in the
//    Firebase web-app config values from the Firebase console.
//  - Deployed demo: the same values are injected as Vite env vars at build
//    time (see SETUP.md). The Firebase *web* apiKey is a public client
//    identifier, not a secret — security is enforced by App Check +
//    Firestore rules, never by hiding this key. No server keys, service
//    account files, or private keys belong anywhere near this repo.
//  - Until a real config is supplied, the app runs in LOCAL DEMO mode:
//    on-device inference still works (it needs no server), while cloud
//    features show a clear "not configured" state instead of failing
//    silently. See SETUP.md for the one-time console checklist.
// ---------------------------------------------------------------------------

// Vite env vars (set via `.env` or the build environment). In plain Node
// (unit tests) import.meta.env does not exist, so fall back to an empty
// object — the app then runs in placeholder mode, exactly as designed.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

// Real config from the environment (empty until the Firebase project is
// created — see SETUP.md).
const realConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  // reCAPTCHA v3 site key for App Check (public site key, from the
  // Firebase console > App Check). Empty = App Check stays off and the
  // status panel says so honestly.
  appCheckSiteKey: env.VITE_APPCHECK_SITE_KEY || ''
};

// True only when a REAL project has been supplied.
export const isFirebaseConfigured =
  Boolean(realConfig.apiKey) &&
  Boolean(realConfig.projectId) &&
  Boolean(realConfig.appId);

export const isAppCheckConfigured = Boolean(realConfig.appCheckSiteKey);

// Config actually handed to the Firebase SDK. The SDK only requires the
// fields to be *present* — it never validates them client-side. So when
// no real project exists yet we hand it clearly-marked placeholders:
// on-device inference then works with zero setup (it never touches a
// server), while every cloud feature refuses politely before it tries.
// The placeholders are never a real key — they cannot call anything.
export const firebaseConfig = isFirebaseConfigured
  ? realConfig
  : {
      apiKey: 'fineprint-placeholder-not-configured',
      authDomain: 'fineprint-placeholder.firebaseapp.com',
      projectId: 'fineprint-placeholder',
      storageBucket: 'fineprint-placeholder.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
      appCheckSiteKey: ''
    };
