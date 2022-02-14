export interface Action {
  type: ActionType;
  listingId: number;
  changed: Change[];
  screenshot: Buffer;
  href: string;
}

export enum ActionType {
  NOTIFY_NEW = 'notify-new',
  NOTIFY_CHANGED = 'notify-changed',
}

export interface Change {
  field: string;
  from: string;
  to: string;
}
