import cheerio from 'cheerio';
import { KvListing } from '../model/cheerio.model';
import { ListingLookup } from '../model/config.model';
import { Parser } from './parser';

export class KvParser extends Parser {
  constructor(lookup: ListingLookup) {
    super(lookup);
    this.elementLocator = '.object-type-apartment';
    this.cacheSelector = 'kv';
    this.excludeFields = ['age'];
    this.listingCheckFn = (listing) => {
      return Boolean(listing?.title) && Boolean(listing?.id);
    };
  }

  async afterLoad() {
    // hide cookie popup
    await this.page.click('button#onetrust-accept-btn-handler');
    // wait for pictures to load on page
    await new Promise((resolve) =>
      setTimeout(resolve, this.lookup.waitAfterPageLoad)
    );
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
