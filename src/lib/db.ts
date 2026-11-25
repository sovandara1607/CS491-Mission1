import fs from 'fs';
import path from 'path';
import { Product, Order, BotSession, OrderStatus } from './types';

// In Vercel serverless functions, the root directory is read-only, but /tmp is writable
const IS_VERCEL = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'novamart_data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

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
    stock: 45,
    specs: ['Hybrid ANC up to -42dB', '40h battery + USB-C fast charge', 'Bluetooth 5.3 Multipoint', 'Memory foam earcups (254g)'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  },
  {
    id: 'prod-002',
    sku: 'SMART-WATCH-ULTRA',
    name: 'TitanFit Smartwatch Ultra',
    description: 'AMOLED Always-On display, ECG heart tracker, GPS navigation, and 50m water resistance.',
    price: 199.50,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    stock: 30,
    specs: ['1.92" LTPO AMOLED (1000 nits)', 'Dual-band GPS & Compass', 'Heart rate, SpO2 & Sleep tracking', '5ATM 50m Water Resistance'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  },
  {
    id: 'prod-003',
    sku: 'MECH-KB-RGB',
    name: 'Vortex RGB Mechanical Keyboard',
    description: 'Hot-swappable switches, PBT double-shot keycaps, Bluetooth 5.2 and USB-C wireless.',
    price: 89.00,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    stock: 25,
    specs: ['75% Gasket-Mounted Layout', 'Hot-Swappable 3/5-pin PCB', 'Tri-mode: 2.4GHz / BT 5.2 / USB-C', '4000mAh Battery + South-facing RGB'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  },
  {
    id: 'prod-004',
    sku: 'PWR-BNK-65W',
    name: 'VoltSpeed 20,000mAh Power Bank',
    description: '65W Power Delivery fast charging, dual USB-C ports, capable of charging laptops and phones.',
    price: 49.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1609592426867-b5055b85a3fd?w=800&q=80',
    stock: 60,
    specs: ['20,000mAh / 74Wh Airline Safe', '65W USB-C PD (MacBook & Laptops)', 'Dual USB-C + 1x USB-A QC 3.0', 'Smart LED Wattage Readout'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  },
  {
    id: 'prod-005',
    sku: 'DESK-LAMP-SMART',
    name: 'Lumina Smart Desk Lamp',
    description: 'Eye-caring ambient light bar, wireless phone charging base, temperature & brightness control.',
    price: 59.00,
    category: 'Home & Office',
    image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80',
    stock: 20,
    specs: ['Ra97+ High-CRI Asymmetric Optics', '2700K–6500K Stepless Dimming', '15W Qi Wireless Charging Pad', 'Anodized Aluminum Arm'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  },
  {
    id: 'prod-006',
    sku: 'USB-DOCK-10IN1',
    name: 'HyperHub 10-in-1 USB-C Dock',
    description: 'Dual 4K HDMI, 100W PD passthrough, Gigabit Ethernet, SD card slots, and high-speed USB 3.2.',
    price: 74.99,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&q=80',
    stock: 35,
    specs: ['Dual 4K@60Hz HDMI Output', '100W USB-C PD Passthrough', '1Gbps RJ45 Ethernet + SD/TF 4.0', '3x USB 3.2 Gen 2 (10Gbps)'],
    warranty: '1-Year Official Warranty + 7-Day Replacement'
  }
];

function hydrateProductMetadata(products: Product[]): Product[] {
  return products.map(p => {
    const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
    return {
      ...p,
      specs: p.specs || def?.specs || [],
      warranty: p.warranty || def?.warranty || '1-Year Official Warranty'
    };
  });
}

// In-memory cache to guarantee fast response and fail-safe writes
let inMemoryDb: DatabaseSchema | null = null;

function initDb(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      parsed.products = hydrateProductMetadata(parsed.products || DEFAULT_PRODUCTS);
      inMemoryDb = parsed;
      return inMemoryDb;
    }

    if (fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledRaw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        const bundledData = JSON.parse(bundledRaw) as DatabaseSchema;
        bundledData.products = hydrateProductMetadata(bundledData.products || DEFAULT_PRODUCTS);
        inMemoryDb = bundledData;
        saveDb(bundledData);
        return inMemoryDb;
      } catch (err) {
        console.warn('Could not read bundled db file:', err);
      }
    }

    const initialData: DatabaseSchema = {
      products: DEFAULT_PRODUCTS,
      orders: [],
      sessions: {}
    };
    inMemoryDb = initialData;
    saveDb(initialData);
    return inMemoryDb;
  } catch (err) {
    console.error('Error initializing db, falling back to memory:', err);
    inMemoryDb = {
      products: DEFAULT_PRODUCTS,
      orders: [],
      sessions: {}
    };
    return inMemoryDb;
  }
}

function saveDb(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Filesystem save warning (continuing with in-memory):', err);
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
  const order = db.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
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
