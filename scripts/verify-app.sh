#!/usr/bin/env bash
# FinePrint — gate checks. Run: bash scripts/verify-app.sh
# Exit code 0 = all checks pass.
set -u
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL: $1"; }

# 1. Required files exist
for f in index.html src/main.js src/ai.js src/firebase-config.js src/firebase-app.js src/store.js src/remoteConfig.js src/samples.js src/styles.css README.md SETUP.md SUBMISSION-DRAFT.md LICENSE .env.example .gitignore; do
  [ -f "$f" ] && ok "$f exists" || bad "$f missing"
done

# 2. All source JS parses (ES modules)
for f in src/main.js src/ai.js src/firebase-config.js src/firebase-app.js src/store.js src/remoteConfig.js src/samples.js; do
  node --check "$f" >/dev/null 2>&1 && ok "$f parses" || bad "$f does not parse"
done

# 3. Firebase AI Logic is really imported AND called (not just named in README)
grep -q "from 'firebase/ai'" src/ai.js && ok "firebase/ai imported in ai.js" || bad "firebase/ai not imported"
grep -q "InferenceMode.PREFER_ON_DEVICE" src/ai.js && ok "PREFER_ON_DEVICE used" || bad "PREFER_ON_DEVICE missing"
grep -q "InferenceMode.ONLY_ON_DEVICE" src/ai.js && ok "ONLY_ON_DEVICE used" || bad "ONLY_ON_DEVICE missing"
grep -q "inferenceSource" src/ai.js && ok "response.inferenceSource read (visible engine badge)" || bad "inferenceSource not read"
grep -q "getGenerativeModel" src/ai.js && ok "getGenerativeModel called" || bad "getGenerativeModel missing"

# 4. Other Firebase products wired in
grep -q "firebase/app-check" src/main.js && ok "App Check wired (main.js)" || bad "App Check missing"
grep -q "firebase/auth" src/store.js && ok "Anonymous Auth wired (store.js)" || bad "Auth missing"
grep -q "firebase/firestore" src/store.js && ok "Firestore wired (store.js)" || bad "Firestore missing"
grep -q "firebase/remote-config" src/remoteConfig.js && ok "Remote Config wired" || bad "Remote Config missing"

# 5. No secrets committed (real keys must never be in the repo)
if grep -rE "AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}" --include="*.js" --include="*.html" --include="*.md" --include="*.json" src index.html README.md SETUP.md 2>/dev/null | grep -v "fineprint-placeholder" | grep -q .; then
  bad "possible secret committed to the repo"
else
  ok "no secrets in source (placeholder values only)"
fi
grep -q "fineprint-placeholder" src/firebase-config.js && ok "placeholder config is clearly marked" || bad "placeholder marker missing"

# 6. .env is gitignored, .env.example has no real values
grep -q "^\.env$" .gitignore && ok ".env is gitignored" || bad ".env not gitignored"
grep -q "VITE_FIREBASE_API_KEY=" .env.example && ok ".env.example documents the config keys" || bad ".env.example incomplete"

# 7. Open-source licence present (Apache-2.0, as the rules prefer)
grep -q "Apache License" LICENSE && ok "Apache-2.0 LICENSE present" || bad "LICENSE missing/wrong"

# 8. Unit tests for the pure logic
node scripts/test-logic.mjs > /tmp/fineprint-unit.log 2>&1 && ok "unit tests pass ($(grep -c '^PASS' /tmp/fineprint-unit.log) checks)" || { bad "unit tests fail"; tail -5 /tmp/fineprint-unit.log; }

# 9. Production build passes
npx vite build > /tmp/fineprint-build.log 2>&1 && ok "vite build passes" || { bad "vite build fails"; tail -5 /tmp/fineprint-build.log; }
[ -f dist/index.html ] && ok "dist/index.html built" || bad "dist/index.html missing"

# 10. Sample documents: short ones under the on-device threshold, long one over it
node -e "
const { SAMPLES } = require('./src/samples.js');
" 2>/dev/null || node --input-type=module -e "
import { SAMPLES } from './src/samples.js';
import { DEFAULTS } from './src/ai.js';
const short = SAMPLES.filter(s => s.text.length <= DEFAULTS.onDeviceMaxChars);
const long = SAMPLES.filter(s => s.text.length > DEFAULTS.onDeviceMaxChars);
if (short.length < 2) { console.log('need >=2 short samples'); process.exit(1); }
if (long.length < 1) { console.log('need >=1 long sample'); process.exit(1); }
console.log('samples ok: ' + short.length + ' short (on-device), ' + long.length + ' long (cloud)');
" && ok "sample documents cover both routes" || bad "sample documents do not cover both routes"

echo ""
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
