import cheerio from 'cheerio';
import { isEqual } from 'lodash';
import playwright from 'playwright';
import configJson from '../config/config.json';
import { Action } from './model/action.model';
import { Listing } from './model/cheerio.model';
import { Config } from './model/config.model';
import { Notifier } from './stuff/notifier';
import {
  extractListings, getActionType,
  getRandomFrequencyMS,
  log,
  readCacheFile,
  skipRun,
  writeCacheFile
} from './utils';

export const config: Config = configJson as Config;
export const notifier = new Notifier();

run();
loop();

function loop() {
  if (skipRun()) {
    setTimeout(() => loop(), 10 * 60 * 1000);
    return;
  }

  const delayMS = getRandomFrequencyMS();
  const delayMin = Math.floor(delayMS / 1000 / 60);
  log(`Next delay: ${delayMin} min`);

  setTimeout(() => {
    run();
    loop();
  }, delayMS);
}

async function run() {
  log('Starting');

  // load in cache file
  const cache = readCacheFile();
  const isCacheEmpty = isEqual(cache, {});

  for (const lookup of config.lookups) {
    log(`Scraping: ${lookup.description}`);

    const { browser, page } = await loadPage(lookup.url);
    const elements = page.locator('.object-type-apartment');
    const elementCount = await elements.count();
    const pageHtml = await page.content();

    const $ = cheerio.load(pageHtml);
    const listings: Listing[] = extractListings($);

    log(`Found ${elementCount} listings`);

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const newListing = listings[i];
      const oldListing = cache[newListing.id];

      // some may be ads and not contain any info
      if (!newListing?.title || !newListing?.id) {
        continue;
      }

      const actionType = getActionType(newListing, oldListing);
      if (!actionType) {
        continue;
      }

      const action: Action = {
        type: actionType,
        newListing,
        oldListing,
        screenshot: await element.screenshot(),
        notifyEmails: lookup.notifyEmails,
      };

      cache[newListing.id] = newListing;
      actions.push(action);
    }

    await browser.close();

    // only execute if cache exists. otherwise it'll send out an email for all 57 listings it finds
    if (!isCacheEmpty) {
      executeActions(actions);
    }
  }

  writeCacheFile(cache);
}

async function loadPage(url: string) {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url);
  await page.click('button#onetrust-accept-btn-handler');

  return {
    browser,
    page,
  };
}

function executeActions(actions: Action[]) {
  if (actions.length > 5) {
    log(`TOO MANY ACTIONS. ABORTING`);
    return;
  } else if (!actions.length) {
    log(`No actions to execute`);
    return;
  }

  log(`Executing ${actions.length} actions`);

  for (const action of actions) {
    notifier.send(action);
  }

  log(`Finished executing actions`);
}
