import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9335;
const chrome = spawn(CHROME, ['--no-sandbox','--disable-gpu',`--remote-debugging-port=${PORT}`,'--user-data-dir=/tmp/chrome-nano-profile3','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let client;
try {
  await sleep(4000);
  client = await CDP({ port: PORT });
  const { Page, Runtime } = client;
  await Page.enable();
  await Page.navigate({ url: 'file:///tmp/promptapi-test2.html' });
  await Page.loadEventFired();
  await sleep(1500);
  // Run with a simulated user gesture (CDP userGesture flag)
  const kick = await Runtime.evaluate({ expression: `window.__run(); 'started'`, userGesture: true, awaitPromise: false, returnByValue: true });
  console.log('kick:', kick.result.value);
  for (let i = 0; i < 52; i++) {
    const r = await Runtime.evaluate({ expression: `document.getElementById('r').textContent`, returnByValue: true });
    const v = r.result.value;
    console.log(`t+${i*5}s:`, String(v).slice(0, 300));
    if (v.includes('reply:') || v.includes('ERROR:')) break;
    await sleep(5000);
  }
} catch (e) { console.log('CDP ERROR:', e.message); }
finally { try { await client?.close(); } catch {} chrome.kill('SIGKILL'); }
