import playwright from 'playwright';
import { Action, ActionType } from '../model/action.model';
import { Cache, KvListing, OkidokiListing } from '../model/cheerio.model';
import { ListingLookup } from '../model/config.model';
import { findChangedFields, getChanges, log } from '../utils';

export class Parser {
  lookup: ListingLookup;
  browser: playwright.Browser;
  page: playwright.Page;

  // these are populated inside classes that inherit this class
  elementLocator: string;
  cacheSelector: string;
  excludeFields: string[];
  listingCheckFn: (listing: KvListing | OkidokiListing) => boolean;

  constructor(lookup: ListingLookup) {
    this.lookup = lookup;
  }

  async run(cache: Cache) {
    log(`Scraping: ${this.lookup.description}`);

    log('Loading page...', 2);
    await this.loadPage();
    await this.afterLoad();
    log('Finished loading', 4);

    log('Extracting listings...', 2);
    const pageHtml = await this.page.content();
    const listings = this.extractListings(pageHtml);
    log('Finished extracting', 4);
    log(`Got ${listings.length} listings`, 4);

    log('Parsing listings...', 2);
    const actions = await this.parse(cache, listings);
    await this.browser.close();
    log('Finished parsing', 4);
    log(`Got ${actions.length} actions`, 4);

    await this.browser.close();

    log('DONE with the page');
    return actions;
  }

  private async loadPage() {
    this.browser = await playwright.chromium.launch();
    const context = await this.browser.newContext();
    this.page = await context.newPage();

    await this.page.goto(this.lookup.url);
  }

  async afterLoad() {
    throw new Error('Not implemented');
  }

  extractListings(pageHtml: string): KvListing[] | OkidokiListing[] {
    throw new Error('Not implemented');
  }

  private async parse(
    cache: Cache,
    listings: KvListing[] | OkidokiListing[]
  ): Promise<Action[]> {
    // these should be populated inside the classes that inherit this class
    if (!this.elementLocator || !this.cacheSelector || !this.excludeFields) {
      throw new Error('Not implemented correctly');
    }

    const elements = this.page.locator(this.elementLocator);
    const elementCount = await elements.count();

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const newListing = listings[i];
      const oldListing = cache[this.cacheSelector][newListing.id];

      // some may be ads and not contain any info
      const isListingValid = this.listingCheckFn(newListing);
      if (!isListingValid) continue;

      // find the fields that changed
      const changedFields = findChangedFields(oldListing, newListing).filter(
        (field) => !this.excludeFields.includes(field)
      );

      const actionType = !oldListing
        ? ActionType.NOTIFY_NEW
        : changedFields.length
        ? ActionType.NOTIFY_CHANGED
        : undefined;
      if (!actionType) {
        continue;
      }

      const action: Action = {
        listingId: newListing.id,
        type: actionType,
        changed: getChanges(changedFields, oldListing, newListing),
        screenshot: await element.screenshot(),
        href: newListing.href,
      };

      cache[this.cacheSelector][newListing.id] = newListing;
      actions.push(action);
    }

    return actions;
  }
}
