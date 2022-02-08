import axios from 'axios';
import cheerio from 'cheerio';
import configJson from '../config/config.json';
import { Listing, TmpData } from './model/cheerio.model';
import { Config } from './model/config.model';
import {
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

function run(dry: boolean) {
  log('Running');

  for (const lookup of config.lookups) {
    axios.get(lookup.url).then(({ data }) => {
      const $ = cheerio.load(data);
      const listings: Listing[] = extractListings($);

      log(`Got ${listings.length} listings`);

      const actions = [];
      for (const listing of listings) {
        // if it is a new listing
        if (!dataCache[listing.id]) {
          actions.push(new NotifyNewAction(lookup, listing));
          dataCache[listing.id] = listing;
          continue;
        }

        // find the fields that changed
        const changedFields = findChangedFields(dataCache[listing.id], listing);
        if (!changedFields.length) {
          // something non-important changed
          continue;
        }

        actions.push(new NotifyChangedAction(lookup, listing, changedFields));
        dataCache[listing.id] = listing;
      }

      if (dry) {
        log(`Skipping execution in dry mode`);
      } else {
        log(`Executing ${actions.length} actions`);

        for (const action of actions) {
          action.execute();
        }

        log(`Finished executing actions`);
      }
    });
  }
}
