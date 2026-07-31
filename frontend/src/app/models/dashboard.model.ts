export interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  totalViews: number;
  favorites: number;
  revenue?: number;
  stores?: number;
  users?: number;
}

export interface DashboardOfferRow {
  id: string;
  title: string;
  status: 'active' | 'expired' | 'draft';
  views: number;
  saves: number;
  endsAt: string;
}
