import envPaths from 'env-paths';
import { chromium } from 'playwright';
import path from 'node:path';

export const ytStudioUrl = 'https://studio.youtube.com';
const paths = envPaths('yt-upload-playwright', { suffix: '' });
export const authPath = path.join(paths.config, 'google_auth.json');


export function mkContext(headless = true) {
  const args = ['--disable-blink-features=AutomationControlled'];
  return chromium.launch({ headless, args, viewport: { width: 1920, height: 720 }, });
}

export async function mkAuthedContext(...args) {
  const ctx = await mkContext(...args);
  return await ctx.newContext({ storageState: authPath });
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
