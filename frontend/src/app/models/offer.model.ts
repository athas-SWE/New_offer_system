export interface Offer {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  originalPrice: number;
  offerPrice: number;
  imageUrl: string;
  categoryId: string;
  categoryName?: string;
  storeId: string;
  storeName?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  endsAt: string;
  isFeatured?: boolean;
  tags?: string[];
  distanceKm?: number;
}

export interface OfferFilter {
  search?: string;
  categoryId?: string;
  storeId?: string;
  city?: string;
  minDiscount?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}
