export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  sku: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderChannel = 'web' | 'telegram' | 'whatsapp';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  channel: OrderChannel;
  channelUserId?: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'ONLINE_PAYMENT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotSession {
  userId: string;
  channel: 'telegram' | 'whatsapp';
  step: 'IDLE' | 'SELECTING_PRODUCT' | 'ENTERING_QUANTITY' | 'ENTERING_NAME' | 'ENTERING_PHONE' | 'ENTERING_ADDRESS' | 'CONFIRMING_ORDER';
  cart: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
  currentProductId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  updatedAt: number;
}
