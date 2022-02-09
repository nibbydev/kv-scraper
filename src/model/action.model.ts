import { Listing } from './cheerio.model';

export interface Action {
  type: ActionType;
  listing: Listing;
  screenshot?: Buffer;
  changedFields?: string[];
  notifyEmails: string[];
}

export enum ActionType {
  NOTIFY_NEW = 'notify-new',
  NOTIFY_CHANGED = 'notify-changed',
}
