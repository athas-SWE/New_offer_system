export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export type PriceUnit = 'FIXED' | 'FROM' | 'HOURLY' | 'PER_DAY' | 'PER_HOUR';

export interface ServiceListing {
  id: string;
  title: string;
  description?: string;
  price?: number;
  priceUnit: PriceUnit;
  imageUrl?: string;
  status: ListingStatus | string;
  shopId: string;
  shopName?: string;
  city?: string;
  categoryName?: string;
}

export interface ManagedListingRow {
  id: string;
  title: string;
  status: string;
  price?: number;
  priceUnit?: string;
  imageUrl?: string;
  deposit?: number;
  availabilityNote?: string;
}
