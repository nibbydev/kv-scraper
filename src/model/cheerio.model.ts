export interface Listing {
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

export interface Cache {
  [listingId: number]: Listing;
}
