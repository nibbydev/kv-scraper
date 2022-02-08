export interface Config {
  lookups: ListingLookup[];
  skipUpdateFields: string[];
  signIn: SignInInfo;
  frequency: number;
}

export interface ListingLookup {
  url: string;
  description: string;
  notifyEmails: string[];
}

export interface SignInInfo {
  service: string;
  username: string;
  password: string;
}
