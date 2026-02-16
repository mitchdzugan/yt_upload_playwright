#!/usr/bin/env node

import * as _ from '../lib.js';

function isLoggedIn(page) {
  return page.evaluate(async function (ytStudioUrl) {
    await window.fetch(ytStudioUrl);
    return true;
  }, _.ytStudioUrl).catch(() => false);
}

async function awaitLogin(page) {
  await _.timeout(5000);
  while (!(await isLoggedIn(page))) { await _.timeout(5000); }
}

async function main() {
  const browser = await _.mkContext(false);
  const page = await browser.newPage();
  await page.goto(_.ytStudioUrl);
  await awaitLogin(page);
  await page.context().storageState({ path: _.authPath });
  browser.close();
}

_.processMain(main);
