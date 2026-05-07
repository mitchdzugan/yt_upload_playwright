#!/usr/bin/env node

import cliProgress from "cli-progress";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import * as fs from "node:fs/promises";
import * as _ from "../lib.js";

const optionDefinitions = [
  {
    name: "help",
    alias: "h",
    description: "print this usage guide",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "login",
    alias: "l",
    description: [
      "open a playwright session to login to your yt account, the window ",
      "will close automatically after you login and land on yt studio page (",
      "does take second though)",
    ].join(""),
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "rm-login",
    alias: "r",
    description: "remove saved playwright login session",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "show",
    alias: "s",
    description: "show browser window instead of default headless",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "json",
    alias: "j",
    description: "path to json file(s) with preset options",
    type: String,
    defaultValue: [],
    typeLabel: "{underline file}[]",
    multiple: true,
  },
  {
    name: "title",
    alias: "t",
    description: "video title",
    type: String,
  },
  {
    name: "description",
    alias: "d",
    description: "video description",
    type: String,
  },
  {
    name: "thumbnail",
    alias: "i",
    description: "path to video thumbnail image",
    typeLabel: "{underline file}",
    type: String,
  },
  {
    name: "visibility",
    alias: "v",
    description: "PUBLIC | PRIVATE | UNLISTED",
    type: String,
  },
  {
    name: "playlist",
    alias: "p",
    description: "youtube ID (from URL) of playlist(s) to add video to",
    type: String,
    defaultValue: [],
    multiple: true,
  },
  {
    name: "file",
    alias: "f",
    description: "path to video that will be uploaded to youtube",
    typeLabel: "{underline file}",
    defaultOption: true,
    type: String,
  },
];
const options = commandLineArgs(optionDefinitions);

const sections = [
  {
    header: "yt_upload_playwright (OPTS*) (-f|--file)? {underline file}",
    content: "upload youtube videos through youtube studio UI via playwright",
  },
  {
    header: "Options",
    optionList: optionDefinitions,
  },
];
const usage = commandLineUsage(sections);

function isLoggedIn(page) {
  return page
    .evaluate(async function (ytStudioUrl) {
      await window.fetch(ytStudioUrl);
      return true;
    }, _.ytStudioUrl)
    .catch(() => false);
}

async function getSavedChannelTitle() {
  try {
    const channelTitle = (await fs.readFile(_.channelTitlePath, "utf-8"))
      .trim()
      .toLowerCase();
    return channelTitle;
  } catch (e) {
    return undefined;
  }
}

async function getActiveChannelTitle(page) {
  let channelTitle;
  while (!channelTitle) {
    channelTitle = (await page.locator("#entity-name").innerText()).trim();
  }
  return channelTitle.toLowerCase();
}

async function awaitLogin(page, isInitialLogin = false) {
  await _.timeout(5000);
  const channelTitle = await getSavedChannelTitle();
  while (!(await isLoggedIn(page))) {
    await _.timeout(5000);
    if (isInitialLogin) {
      continue;
    }
    try {
      for (const ch of await page.locator("#channel-title").all()) {
        if (
          !channelTitle ||
          channelTitle === (await ch.innerText()).trim().toLowerCase()
        ) {
          await ch.click();
          break;
        }
      }
    } catch (_e) {
      // console.error(e);
    }
  }
  if (channelTitle && !isInitialLogin) {
    while (true) {
      const activeTitle = await getActiveChannelTitle(page);
      console.error({ activeTitle, channelTitle });
      if (activeTitle === channelTitle) {
        console.error("Logged in as", activeTitle);
        break;
      }
      try {
        await page.locator("button#avatar-btn").click();
        await _.timeout(2000);
        await page
          .locator("ytd-multi-page-menu-renderer #right-icon:not([hidden])")
          .click();
        await _.timeout(2000);
        for (const ch of await page
          .locator("ytd-account-item-renderer #channel-title")
          .all()) {
          const chChannelTitle = (await ch.innerText()).trim().toLowerCase();
          console.error({ chChannelTitle });
          if (channelTitle === chChannelTitle) {
            await ch.click();
            break;
          }
        }
      } catch (err) {
        console.error(err);
      }
      await _.timeout(2000);
    }
  }
}

async function clickLoc(page, ...args) {
  await page.locator(...args).click();
}

function stepButton(n) {
  return `ytcp-stepper button[step-index="${n}"]`;
}

async function awaitUploadReady(page) {
  while (true) {
    try {
      return await clickLoc(page, stepButton(0));
    } catch {
      await _.timeout(1000);
    }
  }
}

async function cmdLogin() {
  const browser = await _.mkContext(false, true);
  const page = await browser.newPage();
  await page.goto(_.ytStudioUrl);
  await awaitLogin(page, true);
  await _.timeout(30000);
  await page.context().storageState({ path: _.authPath });
  const channelTitle = await getActiveChannelTitle(page);
  console.error({ channelTitle });
  await fs.writeFile(_.channelTitlePath, channelTitle);
  browser.close();
}

async function cmdRmLogin() {
  try {
    await fs.unlink(_.authPath);
  } catch {}
  try {
    await fs.unlink(_.channelTitlePath);
  } catch {}
}

async function cmdUpload(uploadOpts) {
  if (!uploadOpts.file) {
    console.error(usage);
    throw "required option `--file` not provided";
  }
  const browser = await _.mkAuthedContext(!uploadOpts.show);
  const page = await browser.newPage();

  function _ftb(tboxName, content) {
    return page.locator(`ytcp-video-${tboxName} #textbox`).fill(content);
  }
  async function fillTitle(content) {
    await _ftb("title", content);
  }
  async function fillDesc(content) {
    await _ftb("description", content);
  }

  async function getVideoHref() {
    try {
      const link = page.locator("ytcp-video-info a");
      return await link.getAttribute("href");
    } catch (_e) {
      try {
        const shLink = page.locator("#share-url");
        return await shLink.getAttribute("href");
      } catch (_e) {
        return undefined;
      }
    }
  }

  async function getUploadProgress() {
    try {
      const txt = await page.locator("ytcp-video-upload-progress").innerText();
      return parseInt(txt.split("Uploading ")[1].split("%")[0]);
    } catch (_e) {
      return undefined;
    }
  }

  async function isUploadComplete() {
    try {
      const el = page.locator("#uploading-tooltip");
      return (await el.innerText()).trim() === "Video upload complete";
    } catch (_e) {
      return false;
    }
  }

  async function setVisibility(_vis) {
    const vis =
      {
        PRIVATE: "PRIVATE",
        UNLISTED: "UNLISTED",
        PUBLIC: "PUBLIC",
      }[(_vis || "").toUpperCase()] || "PRIVATE";
    const visEl = `tp-yt-paper-radio-button[NAME="${vis}"] #radioContainer`;
    await clickLoc(page, visEl);
  }

  const { SingleBar, Presets } = cliProgress;
  await page.goto(_.ytStudioUrl);
  console.error("ensuring login");
  await awaitLogin(page);
  const progressBar = new SingleBar({}, Presets.legacy);
  progressBar.start(100, 0);
  await clickLoc(page, 'ytcp-button[icon="yt-sys-icons:video_call"] button');
  await clickLoc(page, 'tp-yt-paper-item[test-id="upload"]');
  await page
    .locator('ytcp-uploads-file-picker input[type="file"]')
    .setInputFiles([uploadOpts.file]);
  await awaitUploadReady(page);
  await fillTitle(uploadOpts.title);
  await fillDesc(uploadOpts.description || "");
  if (uploadOpts.thumbnail) {
    const tnSel = 'ytcp-thumbnail-uploader input[type="file"]';
    await page.locator(tnSel).setInputFiles(uploadOpts.thumbnail);
  }
  await clickLoc(
    page,
    'ytcp-video-metadata-playlists ytcp-dropdown-trigger [role="button"]',
  );
  for (const pid of uploadOpts.playlist) {
    await clickLoc(page, `ytcp-checkbox-lit[test-id="${pid}"] > div`);
  }
  await clickLoc(page, 'ytcp-playlist-dialog ytcp-button[label="Done"] button');
  await clickLoc(
    page,
    'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]',
  );
  await clickLoc(page, stepButton(3));
  await setVisibility(uploadOpts.visibility);
  let uploadProgress = 0;
  let ytId;
  let videoHref = await getVideoHref();
  while (!(await isUploadComplete()) || !videoHref) {
    uploadProgress = (await getUploadProgress()) || uploadProgress;
    videoHref ||= await getVideoHref();
    ytId ||= videoHref && videoHref.split("/")[3];
    progressBar.update(uploadProgress || 0);
    await _.timeout(1000);
  }
  progressBar.stop();
  await clickLoc(page, "ytcp-button#done-button button");
  try {
    const htxt = (
      await page
        .locator("ytcp-prechecks-warning-dialog #dialog .header")
        .innerText()
    ).trim();
    if (htxt === "We’re still checking your content") {
      videoHref ||= await getVideoHref();
      await clickLoc(
        page,
        "ytcp-prechecks-warning-dialog #dialog .footer #secondary-action-button button",
      );
      await clickLoc(
        page,
        "ytcp-uploads-still-processing-dialog #close-button button",
      );
    } else {
      videoHref ||= await getVideoHref();
    }
  } catch (e) {
    console.error(e);
    try {
      videoHref ||= await getVideoHref();
      await clickLoc(page, "#close-button button");
    } catch (e) {
      console.error(e);
    }
  }
  await clickLoc(page, "ytcp-navigation-drawer ul#main-menu li:first-child");
  browser.close();
  const hrefParts = videoHref.split("/");
  console.log(hrefParts[hrefParts.length - 1]);
}

async function slurpOpts(dst, p) {
  try {
    const txt = await fs.readFile(p, "utf-8");
    const obj = JSON.parse(txt);
    for (const k in obj) {
      dst[k] = obj[k];
    }
  } catch (e) {
    console.error(e);
    return dst;
  }
}

async function main() {
  if (options["help"]) {
    console.error(usage);
  } else if (options["rm-login"]) {
    await cmdRmLogin();
  } else if (options["login"]) {
    await cmdLogin();
  } else {
    const opts = { ...options };
    delete opts["login"];
    delete opts["rm-login"];
    delete opts["json"];
    for (const jpath of options.json) {
      await slurpOpts(opts, jpath);
    }
    await cmdUpload(opts);
  }
}

_.processMain(main);
