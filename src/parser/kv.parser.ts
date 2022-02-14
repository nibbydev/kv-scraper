import cheerio from 'cheerio';
import { Action, ActionType } from '../model/action.model';
import { Cache, KvListing } from '../model/cheerio.model';
import { findChangedFields, getChanges } from '../utils';
import { Parser } from './parser';

export class KvParser extends Parser {
  async afterLoad() {
    // hide cookie popup
    await this.page.click('button#onetrust-accept-btn-handler');
  }

  async parse(cache: Cache, listings: KvListing[]) {
    const elements = this.page.locator('.object-type-apartment');
    const elementCount = await elements.count();

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const newListing = listings[i];
      const oldListing = cache.kv[newListing.id];

      // some may be ads and not contain any info
      if (!newListing?.title || !newListing?.id) {
        continue;
      }

      // find the fields that changed
      const changedFields = findChangedFields(oldListing, newListing).filter(
        (field) => !['age'].includes(field)
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

      cache.kv[newListing.id] = newListing;
      actions.push(action);
    }

    return actions;
  }

  extractListings(pageHtml: string): KvListing[] {
    const $ = cheerio.load(pageHtml);
    return $('.object-type-apartment')
      .map((_, element) => {
        const $listing = $(element);

        // https://www.kv.ee/avara-vaatega-paiksepoolne-mobleeritud-korterkorte-3405810.html
        const href: string = $listing.find('.object-title-a').attr('href');
        const id = href?.split('.')?.reverse()[1]?.split('-').reverse()[0];

        const listing: KvListing = {
          id: parseInt(id),
          title: $listing.find('.object-title-a').text().trim(),
          href: $listing.find('.object-title-a').attr('href'),
          cta: $listing.find('.object-important-note').text().trim(),
          m2: $listing.find('.object-m2').text().trim(),
          age: $listing.find('.object-added-date').text().trim(),
          price: $listing.find('.object-price-value').text().trim(),
          rooms: $listing.find('.object-rooms').text().trim(),
          imgLink: '',
          isBooked: !!$listing
            .find('.swiper-slide .sold-overlay-gallery .vcenter')
            .text()
            .trim(),
        };
        return listing;
      })
      .toArray();
  }
}
