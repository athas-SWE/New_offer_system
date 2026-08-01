export interface Store {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  coverUrl?: string;
  city: string;
  address: string;
  locationUrl?: string;
  phone?: string;
  website?: string;
  ownerName?: string;
  categoryIds?: string[];
  rating?: number;
  offerCount?: number;
  latitude?: number;
  longitude?: number;
  isVerified?: boolean;
}
