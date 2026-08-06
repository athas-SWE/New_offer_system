export type PosPaymentMethod = 'CASH' | 'CARD' | 'OTHER';

export interface PosProduct {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  shopId: string;
}

export interface PosSaleItem {
  id?: string;
  productId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PosSale {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PosPaymentMethod;
  note?: string | null;
  shopId: string;
  createdDate?: string;
  items?: PosSaleItem[];
}

export interface PosTodaySummary {
  shopId: string;
  saleCount: number;
  revenue: number;
  date: string;
}

export interface PosCartLine {
  product: PosProduct;
  quantity: number;
}
