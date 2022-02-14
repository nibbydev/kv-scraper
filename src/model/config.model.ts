export interface Config {
  lookups: ListingLookup[];
  signIn: SignInInfo;
  frequency: {
    min: number;
    max: number;
  };
  inactiveHours: {
    enabled: boolean;
    timezone: number;
    from: string;
    to: string;
  }; 
}

export interface ListingLookup {
  url: string;
  description: string;
  notifyEmails: string[];
  waitAfterPageLoad: number;
}

export interface SignInInfo {
  service: string;
  username: string;
  password: string;
}
