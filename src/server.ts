import cheerio from 'cheerio';
import playwright from 'playwright';
import configJson from '../config/config.json';
import { Listing, TmpData } from './model/cheerio.model';
import { Config, ListingLookup } from './model/config.model';
import {
  BaseNotifyAction,
  NotifyChangedAction,
  NotifyNewAction
} from './stuff/actions';
import { Notifier } from './stuff/notifier';
import { extractListings, findChangedFields, log } from './utils';

export const config: Config = configJson as Config;
export const notifier = new Notifier();
export const dataCache: TmpData = {};

run(true);
setInterval(() => run(false), config.frequency * 1000 * 60);

async function run(dry: boolean) {
  log('Starting');

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

    const actions = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const listing = listings[i];
      if (!listing.title) {
        continue;
      }

      const action = createListingAction(lookup, listing);
      if (!action) {
        continue;
      }

      if (!dry) {
        log('Took screenshot');
        action.screenshot = await element.screenshot();
      }

      actions.push(action);
    }

    await browser.close();

    if (dry) {
      log(`Skipping execution in dry mode`);
      continue;
    } else if (actions.length > 5) {
      log(`TOO MANY ACTIONS. ABORTING`);
      continue;
    }

    log(`Executing ${actions.length} actions`);

    for (const action of actions) {
      action.execute();
    }

    log(`Finished executing actions`);
  }
}

function createListingAction(
  lookup: ListingLookup,
  listing: Listing
): BaseNotifyAction | undefined {
  // if it is a new listing
  if (!dataCache[listing.id]) {
    dataCache[listing.id] = listing;
    return new NotifyNewAction(lookup, listing);
  }

  // find the fields that changed
  const changedFields = findChangedFields(dataCache[listing.id], listing);
  // something unimportant changed
  if (!changedFields.length) {
    return undefined;
  }

  dataCache[listing.id] = listing;
  return new NotifyChangedAction(lookup, listing, changedFields);
}
