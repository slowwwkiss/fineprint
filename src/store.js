// ---------------------------------------------------------------------------
// FinePrint — history store.
//
// Firestore (anonymous auth) when a Firebase project is configured;
// localStorage fallback when it is not. Same shape either way, so the UI
// never cares which backend is active. Nothing personal is stored: only
// the document title, the analysis, and the inference source.
// ---------------------------------------------------------------------------

import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { isFirebaseConfigured } from './firebase-config.js';
import { getFirebaseApp } from './firebase-app.js';

const LS_KEY = 'fineprint.history.v1';
const MAX_LOCAL = 20;

let db = null;
let uid = null;
let authTried = false;

async function ensureCloud() {
  if (!isFirebaseConfigured) return null;
  if (authTried) return db;
  authTried = true;
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const cred = await signInAnonymously(auth);
    uid = cred.user.uid;
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.warn('[FinePrint] anonymous auth failed, using local history:', e.message);
    return null;
  }
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_LOCAL)));
  } catch {
    /* storage full or unavailable — history is a nice-to-have */
  }
}

export async function saveAnalysis(entry) {
  const record = {
    title: entry.title || 'Untitled document',
    chars: entry.chars || 0,
    source: entry.source || 'unknown',
    route: entry.route || '',
    latencyMs: entry.latencyMs || 0,
    analysis: entry.analysis,
    createdAt: Date.now()
  };
  const cloud = await ensureCloud();
  if (cloud && uid) {
    try {
      await addDoc(collection(cloud, 'users', uid, 'analyses'), {
        ...record,
        createdAt: serverTimestamp()
      });
      return { backend: 'firestore' };
    } catch (e) {
      console.warn('[FinePrint] Firestore save failed, keeping locally:', e.message);
    }
  }
  const items = readLocal();
  items.unshift(record);
  writeLocal(items);
  return { backend: 'local' };
}

export async function listAnalyses() {
  const cloud = await ensureCloud();
  if (cloud && uid) {
    try {
      const q = query(
        collection(cloud, 'users', uid, 'analyses'),
        orderBy('createdAt', 'desc'),
        limit(MAX_LOCAL)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
        };
      });
    } catch (e) {
      console.warn('[FinePrint] Firestore read failed, using local history:', e.message);
    }
  }
  return readLocal();
}

export function historyBackend() {
  return isFirebaseConfigured ? 'firestore' : 'local';
}
