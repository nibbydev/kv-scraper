import fs from 'fs';
import * as _ from 'lodash';
import path from 'path';
import { ActionType } from './model/action.model';
import { Cache, Listing } from './model/cheerio.model';
import { config } from './server';

const CACHE_FILE = path.join(__dirname, '../config/cache.json');

export function extractListing($listing) {
  console.log($listing);

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

  // add spaces will be parsed as listings but won't have any data
  return listing.title ? listing : undefined;
}

export function extractListings($) {
  return $('.object-type-apartment')
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
    .toArray();
}

export const findChangedFields = (a: Listing, b: Listing) => {
  var keys = _.union(_.keys(a), _.keys(b));
  const changedFields = _.filter(keys, function (key) {
    return a[key] !== b[key];
  });

  return changedFields.filter((field) => !['age'].includes(field));
};

export const log = (msg: string) => {
  const now = new Date();
  const h = ('0' + now.getHours()).substr(-2);
  const m = ('0' + now.getMinutes()).substr(-2);
  const s = ('0' + now.getSeconds()).substr(-2);
  console.log(`[${h}:${m}:${s}]`, msg);
};

export const getRandomFrequencyMS = () => {
  const min = config.frequency.min * 1000 * 60;
  const max = config.frequency.max * 1000 * 60;
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const skipRun = () => {
  if (!config.inactiveHours.enabled) {
    return false;
  }

  const currentHour = new Date().getHours();
  // Running eg "14:00" or "14:34" through parseInt will return 14
  const from = parseInt(config.inactiveHours.from);
  const to = parseInt(config.inactiveHours.to);
  return currentHour >= from && currentHour < to;
};

export const readCacheFile = (): Cache => {
  const jsonString = fs.existsSync(CACHE_FILE)
    ? fs.readFileSync(CACHE_FILE)
    : undefined;
  return jsonString ? JSON.parse(jsonString?.toString()) : {};
};

export const writeCacheFile = (cache: Cache) => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, undefined, 2));
};

export const getActionType = (listing: Listing, existingListing: Listing) => {
  // if it is a new listing
  if (!existingListing) {
    return ActionType.NOTIFY_NEW;
  }

  // find the fields that changed
  const changedFields = findChangedFields(existingListing, listing);
  return changedFields.length ? ActionType.NOTIFY_CHANGED : undefined;
};
