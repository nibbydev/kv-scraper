export interface Config {
  lookups: ListingLookup[];
  signIn: SignInInfo;
  frequency: {
    min: number;
    max: number;
  };
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
