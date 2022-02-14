import playwright from 'playwright';
import { Action } from '../model/action.model';
import { Cache, KvListing, OkidokiListing } from '../model/cheerio.model';
import { ListingLookup } from '../model/config.model';
import { log } from '../utils';

export class Parser {
  lookup: ListingLookup;
  browser: playwright.Browser;
  page: playwright.Page;

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

  async loadPage() {
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

  async parse(
    cache: Cache,
    listings: KvListing[] | OkidokiListing[]
  ): Promise<Action[]> {
    throw new Error('Not implemented');
  }
}
