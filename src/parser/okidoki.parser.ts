import cheerio from 'cheerio';
import { OkidokiListing } from '../model/cheerio.model';
import { ListingLookup } from '../model/config.model';
import { Parser } from './parser';

export class OkidokiParser extends Parser {
  constructor(lookup: ListingLookup) {
    super(lookup);
    this.elementLocator = 'li.classifieds__item';
    this.cacheSelector = 'okidoki';
    this.excludeFields = ['age'];
    this.listingCheckFn = (listing) => {
      return Boolean(listing?.id);
    };
  }

  async afterLoad() {
    // hide cookie popup
    await this.page.click('#cookiepolicy .button');
    // wait for pictures to load on page
    await new Promise((resolve) =>
      setTimeout(resolve, this.lookup.waitAfterPageLoad)
    );
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
