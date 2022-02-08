import cheerio from 'cheerio';
import playwright from 'playwright';
import configJson from '../config/config.json';
import { Action, ActionType } from './model/action.model';
import { Listing, TmpData } from './model/cheerio.model';
import { Config } from './model/config.model';
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

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const listing = listings[i];

      // some may be ads and not contain any info
      if (!listing.title) {
        continue;
      }

      const action = await createListingAction(listing, element);
      if (!action) {
        continue;
      }

      dataCache[listing.id] = listing;
      actions.push(action);
    }

    await browser.close();

    executeActions(actions, dry);
  }
}

async function createListingAction(
  listing: Listing,
  element: playwright.Locator
): Promise<Action | undefined> {
  // if it is a new listing
  if (!dataCache[listing.id]) {
    return {
      type: ActionType.NOTIFY_NEW,
      listing,
      screenshot: await element.screenshot(),
    };
  }

  // find the fields that changed
  const changedFields = findChangedFields(dataCache[listing.id], listing);
  // something unimportant changed
  if (!changedFields.length) {
    return undefined;
  }

  return {
    type: ActionType.NOTIFY_CHANGED,
    listing,
    changedFields,
    screenshot: await element.screenshot(),
  };
}

function executeActions(actions: Action[], dry: boolean) {
  if (dry) {
    log(`Skipping execution in dry mode`);
    return;
  } else if (actions.length > 5) {
    log(`TOO MANY ACTIONS. ABORTING`);
    return;
  }

  log(`Executing ${actions.length} actions`);

  for (const action of actions) {
    executeAction(action);
  }

  log(`Finished executing actions`);
}

function executeAction(action: Action) {
  if (action.type === ActionType.NOTIFY_CHANGED) {
    console.log('executing notify changed');

    for (const email of this.lookup.notifyEmails) {
      notifier.send(
        email,
        `KV scraper - Changed - ${this.listing.id}`,
        JSON.stringify(this.listing, undefined, 2),
        this.screenshot
      );
    }
  }

  if (action.type === ActionType.NOTIFY_NEW) {
    console.log('executing notify new');

    for (const email of this.lookup.notifyEmails) {
      notifier.send(
        email,
        `KV scraper - New - ${this.listing.id}`,
        JSON.stringify(this.listing, undefined, 2),
        this.screenshot
      );
    }
  }
}
