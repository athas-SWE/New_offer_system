export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'offer' | 'system' | 'promo';
  read: boolean;
  createdAt: string;
  link?: string;
}
