import fs from 'fs';
import path from 'path';
import { Product, Order, BotSession, OrderStatus } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  sessions: Record<string, BotSession>;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'ANC-HP-PRO',
    name: 'AeroSound Pro Wireless Headphones',
    description: 'Active Noise Cancellation, 40-hour battery life, studio-grade sound with spatial audio.',
    price: 129.99,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    stock: 45
  },
  {
    id: 'prod-002',
    sku: 'SMART-WATCH-ULTRA',
    name: 'TitanFit Smartwatch Ultra',
    description: 'AMOLED Always-On display, ECG heart tracker, GPS navigation, and 50m water resistance.',
    price: 199.50,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    stock: 30
  },
  {
    id: 'prod-003',
    sku: 'MECH-KB-RGB',
    name: 'Vortex RGB Mechanical Keyboard',
    description: 'Hot-swappable switches, PBT double-shot keycaps, Bluetooth 5.2 and USB-C wireless.',
    price: 89.00,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    stock: 25
  },
  {
    id: 'prod-004',
    sku: 'PWR-BNK-65W',
    name: 'VoltSpeed 20,000mAh Power Bank',
    description: '65W Power Delivery fast charging, dual USB-C ports, capable of charging laptops and phones.',
    price: 49.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1609592426867-b5055b85a3fd?w=800&q=80',
    stock: 60
  },
  {
    id: 'prod-005',
    sku: 'DESK-LAMP-SMART',
    name: 'Lumina Smart Desk Lamp',
    description: 'Eye-caring ambient light bar, wireless phone charging base, temperature & brightness control.',
    price: 59.00,
    category: 'Home & Office',
    image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80',
    stock: 20
  },
  {
    id: 'prod-006',
    sku: 'USB-DOCK-10IN1',
    name: 'HyperHub 10-in-1 USB-C Dock',
    description: 'Dual 4K HDMI, 100W PD passthrough, Gigabit Ethernet, SD card slots, and high-speed USB 3.2.',
    price: 74.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&q=80',
    stock: 35
  }
];

function initDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        products: DEFAULT_PRODUCTS,
        orders: [
          {
            id: 'ORD-98214',
            customerName: 'Sarah Jenkins',
            customerPhone: '+14155550192',
            customerAddress: '742 Evergreen Terrace, Springfield',
            items: [
              {
                productId: 'prod-001',
                productName: 'AeroSound Pro Wireless Headphones',
                quantity: 1,
                unitPrice: 129.99,
                totalPrice: 129.99
              }
            ],
            totalAmount: 129.99,
            currency: 'USD',
            status: 'PROCESSING',
            channel: 'telegram',
            channelUserId: 'tg_7392184',
            paymentMethod: 'COD',
            notes: 'Ordered via Telegram Bot',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'ORD-98215',
            customerName: 'Alex Rodriguez',
            customerPhone: '+14155550234',
            customerAddress: '120 Market St, Suite 400, San Francisco, CA',
            items: [
              {
                productId: 'prod-002',
                productName: 'TitanFit Smartwatch Ultra',
                quantity: 1,
                unitPrice: 199.50,
                totalPrice: 199.50
              },
              {
                productId: 'prod-004',
                productName: 'VoltSpeed 20,000mAh Power Bank',
                quantity: 2,
                unitPrice: 49.99,
                totalPrice: 99.98
              }
            ],
            totalAmount: 299.48,
            currency: 'USD',
            status: 'CONFIRMED',
            channel: 'whatsapp',
            channelUserId: '+14155550234',
            paymentMethod: 'BANK_TRANSFER',
            notes: 'Customer placed order via WhatsApp Chat',
            createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: 'ORD-98216',
            customerName: 'David Kim',
            customerPhone: '+14155550888',
            customerAddress: '888 Broadway St, New York, NY',
            items: [
              {
                productId: 'prod-003',
                productName: 'Vortex RGB Mechanical Keyboard',
                quantity: 1,
                unitPrice: 89.00,
                totalPrice: 89.00
              }
            ],
            totalAmount: 89.00,
            currency: 'USD',
            status: 'DELIVERED',
            channel: 'web',
            paymentMethod: 'ONLINE_PAYMENT',
            notes: 'Online Web Store Checkout',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        sessions: {}
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error initializing db:', err);
    return {
      products: DEFAULT_PRODUCTS,
      orders: [],
      sessions: {}
    };
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db:', err);
  }
}

export function getProducts(): Product[] {
  const db = initDb();
  return db.products;
}

export function getProductById(id: string): Product | undefined {
  const db = initDb();
  return db.products.find(p => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
}

export function getOrders(): Order[] {
  const db = initDb();
  return db.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderById(id: string): Order | undefined {
  const db = initDb();
  return db.orders.find(o => o.id.toLowerCase() === id.toLowerCase());
}

export function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const db = initDb();
  const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    ...orderData,
    id: orderId,
    createdAt: now,
    updatedAt: now
  };

  db.orders.unshift(newOrder);

  // Decrement stock
  for (const item of newOrder.items) {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  }

  saveDb(db);
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const db = initDb();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveDb(db);
  return order;
}

export function getBotSession(userId: string, channel: 'telegram' | 'whatsapp'): BotSession {
  const db = initDb();
  const key = `${channel}:${userId}`;
  if (!db.sessions[key]) {
    db.sessions[key] = {
      userId,
      channel,
      step: 'IDLE',
      cart: [],
      updatedAt: Date.now()
    };
    saveDb(db);
  }
  return db.sessions[key];
}

export function updateBotSession(session: BotSession): void {
  const db = initDb();
  const key = `${session.channel}:${session.userId}`;
  session.updatedAt = Date.now();
  db.sessions[key] = session;
  saveDb(db);
}

export function resetBotSession(userId: string, channel: 'telegram' | 'whatsapp'): void {
  const db = initDb();
  const key = `${channel}:${userId}`;
  delete db.sessions[key];
  saveDb(db);
}
