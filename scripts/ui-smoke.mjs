import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9336;
const chrome = spawn(CHROME, ['--no-sandbox','--disable-gpu',`--remote-debugging-port=${PORT}`,'--user-data-dir=/tmp/chrome-ui-profile','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
let client;
try {
  await sleep(4000);
  client = await CDP({ port: PORT });
  const { Page, Runtime, Log } = client;
  await Page.enable();
  await Runtime.enable();
  Runtime.consoleAPICalled((p) => { if (p.type === 'error') errors.push('console.error: ' + JSON.stringify(p.args.map(a => a.value || a.description))); });
  Runtime.exceptionThrown((p) => errors.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
  await Page.navigate({ url: 'http://localhost:4173/' });
  await Page.loadEventFired();
  await sleep(2500);
  const evalJs = async (expr) => (await Runtime.evaluate({ expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  console.log('title:', await evalJs(`document.title`));
  console.log('h1:', await evalJs(`document.querySelector('h1')?.textContent`));
  console.log('pill-device:', await evalJs(`document.getElementById('pill-device').textContent`));
  console.log('pill-cloud:', await evalJs(`document.getElementById('pill-cloud').textContent`));
  console.log('sample buttons:', await evalJs(`document.querySelectorAll('#sample-buttons button').length`));
  console.log('history text:', await evalJs(`document.getElementById('history-list').textContent.slice(0,80)`));
  // click first sample (freelance contract) and check route preview
  await evalJs(`document.querySelectorAll('#sample-buttons button')[0].click(); 'ok'`);
  await sleep(500);
  console.log('char-count:', await evalJs(`document.getElementById('char-count').textContent`));
  console.log('route-text:', await evalJs(`document.getElementById('route-text').textContent`));
  // click Analyse — expect the honest "not configured" error, no crash
  await evalJs(`document.getElementById('analyse-btn').click(); 'ok'`);
  await sleep(2500);
  console.log('analyse-error visible:', await evalJs(`!document.getElementById('analyse-error').hidden`));
  console.log('analyse-error:', await evalJs(`document.getElementById('analyse-error').textContent.slice(0,200)`));
  // stay-on-device checkbox + route preview change
  await evalJs(`document.getElementById('stay-device').click(); 'ok'`);
  await sleep(300);
  console.log('route-text (stay-on-device):', await evalJs(`document.getElementById('route-text').textContent.slice(0,120)`));
  // screenshot for the record
  const shot = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/fineprint-ui.png', Buffer.from(shot.data, 'base64'));
  console.log('screenshot saved, bytes:', fs.statSync('/tmp/fineprint-ui.png').size);
  console.log('JS ERRORS:', errors.length ? errors.join(' || ') : 'none');
} catch (e) { console.log('CDP ERROR:', e.message); }
finally { try { await client?.close(); } catch {} chrome.kill('SIGKILL'); }
