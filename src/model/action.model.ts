import { Listing } from './cheerio.model';

export interface Action {
  type: ActionType;
  oldListing: Listing;
  newListing: Listing;
  screenshot: Buffer;
  notifyEmails: string[];
}

export enum ActionType {
  NOTIFY_NEW = 'notify-new',
  NOTIFY_CHANGED = 'notify-changed',
}
