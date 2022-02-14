export interface Cache {
  kv: {
    [listingId: number]: KvListing;
  };
  okidoki: {
    [listingId: number]: OkidokiListing;
  };
}

export interface KvListing {
  id: number;
  title: string;
  href: string;
  cta: string;
  m2: string;
  age?: string;
  price: string;
  rooms: string;
  imgLink: string;
  isBooked: boolean;
}

export interface OkidokiListing {
  id: number;
  title: string;
  href: string;
  age?: string;
  price: string;
  location: string;
}
