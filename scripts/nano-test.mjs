import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9333;
const chrome = spawn(CHROME, ['--no-sandbox','--disable-gpu',`--remote-debugging-port=${PORT}`,'--user-data-dir=/tmp/chrome-nano-profile','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(4000);
let client;
try {
  client = await CDP({ port: PORT });
  const { Page, Runtime } = client;
  await Page.enable();
  await Page.navigate({ url: 'file:///tmp/promptapi-test2.html' });
  await Page.loadEventFired();
  await sleep(1500);
  // user gesture: click in the middle of the page
  await Runtime.evaluate({ expression: `document.body.click(); 'clicked'` });
  await sleep(1000);
  const r = await Runtime.evaluate({ expression: `document.getElementById('r').textContent`, awaitPromise: false, returnByValue: true });
  console.log('RESULT:', r.result.value);
} catch (e) { console.log('CDP ERROR:', e.message); }
finally { try { await client?.close(); } catch {} chrome.kill('SIGKILL'); }
