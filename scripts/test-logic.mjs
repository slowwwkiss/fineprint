// FinePrint — unit tests for the pure logic (no network, no model).
// Run: node scripts/test-logic.mjs
// Exit code 0 = all pass.
import { decideRoute, parseAnalysis, DEFAULTS } from '../src/ai.js';

let passed = 0;
let failed = 0;
function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`PASS: ${name}`);
  } else {
    failed++;
    console.log(`FAIL: ${name} ${extra}`);
  }
}

// --- decideRoute ---
const T = { ...DEFAULTS };
check('short doc -> hybrid', decideRoute(100, T, false).mode === 'hybrid');
check('exactly at threshold -> hybrid', decideRoute(T.onDeviceMaxChars, T, false).mode === 'hybrid');
check('one char over threshold -> cloud', decideRoute(T.onDeviceMaxChars + 1, T, false).mode === 'cloud');
check('long doc -> cloud, 2 chunks', decideRoute(T.cloudChunkChars + 1, T, false).route.includes('2 chunks'));
check('stay-on-device always wins (short)', decideRoute(100, T, true).mode === 'device');
check('stay-on-device always wins (long)', decideRoute(999999, T, true).mode === 'device');
check('empty doc -> hybrid', decideRoute(0, T, false).mode === 'hybrid');

// --- parseAnalysis: valid JSON ---
const good = JSON.stringify({
  summary: ['A plain summary.', 'Second point.'],
  redFlags: [{ clause: 'Auto-renewal', why: 'Renews without asking.', severity: 'high' }],
  obligations: ['Pay $9.99 monthly.'],
  keyFacts: [{ label: 'Price', value: '$9.99/month' }]
});
const p1 = parseAnalysis(good);
check('valid JSON: summary kept', p1.summary.length === 2 && p1.summary[0] === 'A plain summary.');
check('valid JSON: red flag kept with severity', p1.redFlags.length === 1 && p1.redFlags[0].severity === 'high');
check('valid JSON: obligations kept', p1.obligations.length === 1);
check('valid JSON: key facts kept', p1.keyFacts.length === 1 && p1.keyFacts[0].value === '$9.99/month');

// --- parseAnalysis: JSON wrapped in prose/fences ---
const wrapped = 'Here is the analysis:\n```json\n' + good + '\n```\nHope that helps.';
const p2 = parseAnalysis(wrapped);
check('JSON in fences still parses', p2.summary.length === 2);

// --- parseAnalysis: bad severity defaults to medium ---
const badSev = JSON.stringify({ summary: ['x'], redFlags: [{ clause: 'C', why: 'W', severity: 'extreme' }], obligations: [], keyFacts: [] });
check('unknown severity -> medium', parseAnalysis(badSev).redFlags[0].severity === 'medium');

// --- parseAnalysis: missing fields -> empty arrays, no throw ---
const sparse = JSON.stringify({ summary: ['only this'] });
const p3 = parseAnalysis(sparse);
check('missing fields default to empty', p3.redFlags.length === 0 && p3.obligations.length === 0 && p3.keyFacts.length === 0);

// --- parseAnalysis: garbage input never throws ---
const p4 = parseAnalysis('This is not JSON at all, just prose.\nSecond line here.');
check('garbage input -> fallback summary, no throw', p4.summary.length > 0);
const p5 = parseAnalysis('');
check('empty input -> one-bullet summary', p5.summary.length === 1);
const p6 = parseAnalysis(null);
check('null input -> one-bullet summary', p6.summary.length === 1);

// --- thresholds sanity ---
check('onDeviceMaxChars is a sane small-model budget', T.onDeviceMaxChars >= 1000 && T.onDeviceMaxChars <= 6000);
check('cloudChunkChars larger than on-device budget', T.cloudChunkChars > T.onDeviceMaxChars);
check('cloud model is a real Gemini model id', typeof T.cloudModel === 'string' && T.cloudModel.startsWith('gemini-'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
