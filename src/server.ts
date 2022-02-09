import cheerio from 'cheerio';
import { isEqual } from 'lodash';
import playwright from 'playwright';
import configJson from '../config/config.json';
import { Action, ActionType } from './model/action.model';
import { Cache, Listing } from './model/cheerio.model';
import { Config, ListingLookup } from './model/config.model';
import { Notifier } from './stuff/notifier';
import {
  extractListings,
  findChangedFields,
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

    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(lookup.url);
    await page.click('button#onetrust-accept-btn-handler');

    const elements = page.locator('.object-type-apartment');
    const elementCount = await elements.count();

    const $ = cheerio.load(await page.content());
    const listings: Listing[] = extractListings($);

    log(`Found ${elementCount} listings`);

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const listing = listings[i];

      // some may be ads and not contain any info
      if (!listing.title) {
        continue;
      }

      const action = await createListingAction(cache, lookup, listing, element);
      if (!action) {
        continue;
      }

      cache[listing.id] = listing;
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

async function createListingAction(
  cache: Cache,
  lookup: ListingLookup,
  listing: Listing,
  element: playwright.Locator
): Promise<Action | undefined> {
  // if it is a new listing
  if (!cache[listing.id] && listing.age) {
    return {
      type: ActionType.NOTIFY_NEW,
      listing,
      screenshot: await element.screenshot(),
      notifyEmails: lookup.notifyEmails,
    };
  }

  // find the fields that changed
  const changedFields = findChangedFields(cache[listing.id], listing);
  // something unimportant changed
  if (!changedFields.length) {
    return undefined;
  }

  return {
    type: ActionType.NOTIFY_CHANGED,
    listing,
    changedFields,
    screenshot: await element.screenshot(),
    notifyEmails: lookup.notifyEmails,
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
