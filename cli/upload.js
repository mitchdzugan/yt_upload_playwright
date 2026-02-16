#!/usr/bin/env node

import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { createElement, useEffect } from 'react';
import ReactCurse, { Text } from 'react-curse';
import * as fs from 'node:fs/promises';
import * as _ from '../lib.js';

const optionDefinitions = [
  {
    name: 'login',
    alias: 'l',
    description: 'open a playwright session to login to your yt account',
    type: Boolean,
    defaultValue: false,
  },
  {
    name: 'rm-login',
    alias: 'r',
    description: 'remove saved playwright login session',
    type: Boolean,
    defaultValue: false,
  },
  {
    name: 'show',
    alias: 's',
    description: 'show browser window instead of default headless',
    type: Boolean,
    defaultValue: false,
  },
  {
    name: 'json',
    alias: 'j',
    description: 'path to json file(s) with preset options',
    type: String,
    defaultValue: [],
    multiple: true,
  },
  {
    name: 'title',
    alias: 't',
    description: 'video title',
    type: String,
  },
  {
    name: 'description',
    alias: 'd',
    description: 'video description',
    type: String,
  },
  {
    name: 'thumbnail',
    alias: 'i',
    description: 'path to video thumbnail image',
    type: String,
  },
  {
    name: 'visibility',
    alias: 'v',
    description: 'PUBLIC | PRIVATE | UNLISTED',
    type: String,
  },
  {
    name: 'playlist',
    alias: 'p',
    description: 'youtube ID (from URL) of playlist(s) to add video to',
    type: String,
    defaultValue: [],
    multiple: true,
  },
  {
    name: 'file',
    alias: 'f',
    description: 'path to video that will be uploaded to youtube',
    defaultOption: true,
    type: String,
  },
];
const options = commandLineArgs(optionDefinitions);

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

async function clickLoc(page, ...args) {
  await page.locator(...args).click();
}

function stepButton(n) { return `ytcp-stepper button[step-index="${n}"]`; }

async function awaitUploadReady(page) {
  while(true) {
    try { return await clickLoc(page, stepButton(0)); }
    catch { await _.timeout(1000); }
  }
}

async function cmdLogin() {
  const browser = await _.mkContext(false);
  const page = await browser.newPage();
  await page.goto(_.ytStudioUrl);
  await awaitLogin(page);
  await page.context().storageState({ path: _.authPath });
  browser.close();
}

async function cmdRmLogin() { try { await fs.unlink(_.authPath); } catch {} }

async function cmdUpload(uploadOpts) {
  const browser = await _.mkAuthedContext(!uploadOpts.show);
  const page = await browser.newPage();

  function _ftb(tboxName, content) {
    return page.locator(`ytcp-video-${tboxName} #textbox`).fill(content);
  }
  async function fillTitle(content) { await _ftb('title', content); }
  async function fillDesc(content) { await _ftb('description', content); }

  async function getVideoHref() {
    try {
      const link = page.locator('ytcp-video-info a');
      return await link.getAttribute('href');
    } catch (e) { console.log(e); return undefined;
    }
  }

  async function getUploadProgress() {
    try {
      const txt = await page.locator('ytcp-video-upload-progress').innerText();
      return parseInt(txt.split('Uploading ')[1].split('%')[0])
    } catch(e) { console.log(e); return undefined;
    }
  }

  async function isUploadComplete() {
    try {
      const el = page.locator('#uploading-tooltip');
      return (await el.innerText()).trim() === 'Video upload complete';
    }
    catch (e) { console.log(e); return false; }
  }

  async function setVisibility(_vis) {
    const vis = (({
      PRIVATE: 'PRIVATE',
      UNLISTED: 'UNLISTED',
      PUBLIC: 'PUBLIC',
    })[(_vis || '').toUpperCase()]) || 'PRIVATE';
    const visEl = `tp-yt-paper-radio-button[NAME="${vis}"] #radioContainer`;
    await clickLoc( page, visEl);
  }

  await page.goto(_.ytStudioUrl);
  await awaitLogin(page);
  await clickLoc(page, 'ytcp-button[icon="yt-sys-icons:video_call"] button');
  await clickLoc(page, 'tp-yt-paper-item[test-id="upload"]');
  await page
    .locator('ytcp-uploads-file-picker input[type="file"]')
    .setInputFiles([uploadOpts.file]);
  await awaitUploadReady(page);
  await fillTitle(uploadOpts.title);
  await fillDesc(uploadOpts.description || '');
  if (uploadOpts.thumbnail) {
    const tnSel = 'ytcp-thumbnail-uploader input[type="file"]';
    await page.locator(tnSel).setInputFiles(uploadOpts.thumbnail);
  }
  await clickLoc(
    page, 'ytcp-video-metadata-playlists ytcp-dropdown-trigger [role="button"]'
  );
  for (const pid of uploadOpts.playlist) {
    await clickLoc(page, `ytcp-checkbox-lit[test-id="${pid}"] > div`);
  }
  await clickLoc(page, 'ytcp-playlist-dialog ytcp-button[label="Done"] button');
  await clickLoc(
    page, 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'
  );
  await clickLoc(page, stepButton(3));
  await setVisibility(uploadOpts.visibility);
  let uploadProgress = 0;
  while (!(await isUploadComplete())) {
    uploadProgress = (await getUploadProgress()) || uploadProgress;
    const videoHref = await getVideoHref();
    const isComplete = await isUploadComplete();
    console.log({ isComplete, uploadProgress, videoHref });
    await _.timeout(1000);
  }
  await clickLoc(page, 'ytcp-button#done-button button');
  try {
    const htxt = (
      await page.locator('ytcp-prechecks-warning-dialog #dialog .header').innerText()
    ).trim();
    console.log({ htxt });
    if (htxt === "We’re still checking your content") {
      await clickLoc(
        page,
        'ytcp-prechecks-warning-dialog #dialog .footer #secondary-action-button button'
      );
      await clickLoc(
        page, 'ytcp-uploads-still-processing-dialog #close-button button'
      )
    }
  }
  catch (e) { console.log(e); }
  await clickLoc(page, 'ytcp-navigation-drawer ul#main-menu li:first-child');
  browser.close();
}

async function slurpOpts(dst, p) {
  try {
    const txt = await fs.readFile(p, 'utf-8');
    const obj = JSON.parse(txt);
    for (const k in obj) { dst[k] = obj[k]; }
  } catch (e) {
    console.log(e);
    return dst;
  }
}

async function main() {
  if (options['rm-login']) { await cmdRmLogin(); }
  else if (options['login']) { await cmdLogin(); }
  else {
    const opts = { ...options };
    delete opts['login'];
    delete opts['rm-login'];
    delete opts['json'];
    for (const jpath of options.json) { await slurpOpts(opts, jpath); }
    await cmdUpload(opts);
  }
}

_.processMain(main);
