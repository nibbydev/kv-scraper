import * as _ from 'lodash';
import { Listing } from './model/cheerio.model';
import { config } from './server';

export const extractListings = ($) =>
  $('.object-type-apartment')
    .map((_, element) => {
      const $listing = $(element);

      // https://www.kv.ee/avara-vaatega-paiksepoolne-mobleeritud-korterkorte-3405810.html
      const href: string = $listing.find('.object-title-a').attr('href');
      const id = href?.split('.')?.reverse()[1]?.split('-').reverse()[0];

      const listing: Listing = {
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
    .toArray()
    .filter((listing) => listing.title);

export const findChangedFields = (a: Listing, b: Listing) => {
  var keys = _.union(_.keys(a), _.keys(b));
  const changedFields = _.filter(keys, function (key) {
    return a[key] !== b[key];
  });

  return changedFields.filter(
    (field) => !config.skipUpdateFields.includes(field)
  );
};

export const log = (msg: string) => {
  const timestamp = new Date().toJSON().substring(11, 19);
  console.log(`[${timestamp}]`, msg);
};
