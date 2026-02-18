import envPaths from 'env-paths';
import { firefox, chromium } from 'playwright-core';
import path from 'node:path';

export const ytStudioUrl = 'https://studio.youtube.com';
const paths = envPaths('yt-upload-playwright', { suffix: '' });
export const authPath = path.join(paths.config, 'google_auth.json');


export function mkContext(headless = true, useChromium = false) {
  const args = ['--disable-blink-features=AutomationControlled'];
  return (useChromium ? chromium : firefox).launch({
    headless,
    args,
    viewport: { width: 1920, height: 720 },
  });
}

export async function mkAuthedContext(...args) {
  console.log('___________ making context _______________')
  const ctx = await mkContext(...args);
  console.log('MAKING NEW_CONTEXT')
  return await ctx.newContext(
    { storageState: authPath, ignoreHTTPSErrors: true }
  );
}

function onProcessDone() { process.exit(); }
function onProcessError(error) {
  console.error(error);
  process.exit(1);
}

export function processMain(main) {
  return main().then(onProcessDone).catch(onProcessError);
}

export function timeout(ms) {
  return (new Promise((res) => setTimeout(() => res(), ms)));
}
