export interface DashboardStats {
  role?: string;
  totalOffers: number;
  activeOffers: number;
  expiredOffers?: number;
  pendingOffers?: number;
  totalViews: number;
  favorites: number;
  revenue?: number;
  stores?: number;
  users?: number;
  businesses?: number;
  pendingBusinesses?: number;
  reviews?: number;
  likes?: number;
  unreadNotifications?: number;
  message?: string;
}

export interface DashboardOfferRow {
  id: string;
  title: string;
  status: string;
  views: number;
  saves: number;
  likes?: number;
  endsAt: string;
  businessName?: string;
  imageUrl?: string;
}

export interface CustomerDashboard extends DashboardStats {
  recentFavorites: DashboardOfferRow[];
  endingSoon: DashboardOfferRow[];
}
