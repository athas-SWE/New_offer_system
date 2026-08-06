import { ListingStatus, PriceUnit } from './service-listing.model';

export interface RentalListing {
  id: string;
  title: string;
  description?: string;
  price?: number;
  priceUnit: PriceUnit;
  deposit?: number;
  availabilityNote?: string;
  imageUrl?: string;
  status: ListingStatus | string;
  shopId: string;
  shopName?: string;
  city?: string;
  categoryName?: string;
  phone?: string;
}
