import cheerio from 'cheerio';
import { Action, ActionType } from '../model/action.model';
import { Cache, OkidokiListing } from '../model/cheerio.model';
import { findChangedFields, getChanges } from '../utils';
import { Parser } from './parser';

export class OkidokiParser extends Parser {
  async afterLoad() {
    // hide cookie popup
    await this.page.click('#cookiepolicy .button');
    // wait for pictures to load on page
    await new Promise((resolve) =>
      setTimeout(resolve, this.lookup.waitAfterPageLoad)
    );
  }

  async parse(cache: Cache, listings: OkidokiListing[]) {
    const elements = this.page.locator('li.classifieds__item');
    const elementCount = await elements.count();

    const actions: Action[] = [];
    for (let i = 0; i < elementCount; i++) {
      const element = elements.nth(i);
      const newListing = listings[i];
      const oldListing = cache.okidoki[newListing.id];

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

      cache.okidoki[newListing.id] = newListing;
      actions.push(action);
    }

    return actions;
  }

  extractListings(pageHtml: string) {
    const $ = cheerio.load(pageHtml);
    return $('.horiz-offer-card')
      .map((_, element) => {
        const $listing = $(element);

        // /item/devon-rexi-kassipoeg/11100696/
        const href: string = $listing
          .find('a.horiz-offer-card__title-link')
          .attr('href');
        const id = href.split('/').reverse()[1];

        const listing: OkidokiListing = {
          id: parseInt(id),
          title: $listing.find('a.horiz-offer-card__title-link').text().trim(),
          href: 'https://www.okidoki.ee' + href,
          age: $listing.find('.horiz-offer-card__date').text().trim(),
          location: $listing.find('.horiz-offer-card__location').text().trim(),
          price: $listing.find('.horiz-offer-card__price-value').text().trim(),
        };
        return listing;
      })
      .toArray();
  }
}
