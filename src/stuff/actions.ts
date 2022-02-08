import { ListingLookup } from 'src/model/config.model';
import { Listing } from '../model/cheerio.model';
import { notifier } from '../server';

export class BaseNotifyAction {
  lookup: ListingLookup;
  listing: Listing;
  screenshot: Buffer;

  constructor(lookup: ListingLookup, listing: Listing) {
    this.lookup = lookup;
    this.listing = listing;
  }

  execute() {
    throw new Error('not implemented');
  }
}

export class NotifyNewAction extends BaseNotifyAction {
  execute() {
    console.log('executing notify new');

    for (const email of this.lookup.notifyEmails) {
      notifier.send(
        email,
        'Apartmnet crawler - New',
        JSON.stringify(this.listing, undefined, 2),
        this.screenshot
      );
    }
  }
}

export class NotifyChangedAction extends BaseNotifyAction {
  changedFields: string[];

  constructor(
    lookup: ListingLookup,
    listing: Listing,
    changedFields: string[]
  ) {
    super(lookup, listing);
    this.changedFields = changedFields;
  }

  execute() {
    console.log('executing notify changed');

    for (const email of this.lookup.notifyEmails) {
      notifier.send(
        email,
        'Apartmnet crawler - Changed',
        JSON.stringify(this.listing, undefined, 2),
        this.screenshot
      );
    }
  }
}
