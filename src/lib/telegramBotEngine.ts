import {
  getProducts,
  getProductById,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getBotSession,
  updateBotSession,
  resetBotSession
} from './db';
import { BotSession, Order, OrderStatus } from './types';

export interface TelegramBotReply {
  text: string;
  buttons?: { text: string; callback_data?: string; url?: string; web_app?: { url: string } }[][];
  orderCreated?: Order;
}

const DEFAULT_BOT_TOKEN = '9190849978:AAHo5wZK-CjQP2Dnbzi3MkvJrXLjHdL9lzQ';
const DEFAULT_ADMIN_CHAT_ID = '894685975';

export function getPublicHttpsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://cs-491-mission1.vercel.app';
}

export function getAdminChatId(): string {
  return process.env.TELEGRAM_ADMIN_CHAT_ID || DEFAULT_ADMIN_CHAT_ID;
}

export async function processTelegramMessage(
  userId: string,
  userDisplayName: string,
  incomingText: string,
  callbackData?: string
): Promise<TelegramBotReply> {
  const session = getBotSession(userId, 'telegram');
  const text = (incomingText || '').trim();
  const lowerText = text.toLowerCase();
  const appUrl = getPublicHttpsUrl();

  // Handle callback buttons
  if (callbackData) {
    if (callbackData === 'cmd_catalog') {
      return handleCatalogCommand(appUrl);
    }
    if (callbackData === 'cmd_start') {
      resetBotSession(userId, 'telegram');
      return handleStartCommand(userDisplayName, appUrl);
    }
    if (callbackData.startsWith('buy_')) {
      const prodId = callbackData.replace('buy_', '');
      return handleSelectProduct(session, prodId, appUrl);
    }
    if (callbackData.startsWith('qty_')) {
      const qty = parseInt(callbackData.replace('qty_', ''), 10);
      return handleQuantityInput(session, qty, appUrl);
    }
    if (callbackData === 'cmd_checkout') {
      return startCheckoutFlow(session, userDisplayName, appUrl);
    }
    if (callbackData.startsWith('use_name_')) {
      session.customerName = userDisplayName;
      session.step = 'ENTERING_PHONE';
      updateBotSession(session);
      return {
        text: `Customer Name: *${escapeMarkdown(userDisplayName)}*\n\n` +
          `Please reply with your *phone number* for courier confirmation (e.g. \`099 944 923\`):`,
        buttons: [[{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]]
      };
    }
    if (callbackData === 'loc_pp') {
      session.customerAddress = 'Phnom Penh (Same-Day Express)';
      session.step = 'ENTERING_ADDRESS_DETAILS';
      updateBotSession(session);
      return {
        text: `📍 Region: *Phnom Penh Express (1–2h)*\n\n` +
          `Reply with your *street, building, or Khan / Sangkat* for our courier:`,
        buttons: [[{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]]
      };
    }
    if (callbackData === 'loc_prov') {
      session.customerAddress = 'Provinces (Express Logistics)';
      session.step = 'ENTERING_ADDRESS_DETAILS';
      updateBotSession(session);
      return {
        text: `🚚 Region: *Provincial Express (24–48h)*\n\n` +
          `Reply with your *Province, District, and preferred carrier (Virak Buntham / J&T)*:`,
        buttons: [[{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]]
      };
    }
    if (callbackData === 'pay_COD' || callbackData === 'pay_KHQR') {
      session.paymentMethod = callbackData === 'pay_KHQR' ? 'BANK_TRANSFER' : 'COD';
      session.step = 'CONFIRMING_ORDER';
      updateBotSession(session);
      return buildOrderSummary(session);
    }
    if (callbackData === 'confirm_yes') {
      if (!session.customerPhone || !session.customerAddress) {
        return startCheckoutFlow(session, userDisplayName, appUrl);
      }
      return await handleOrderConfirmation(session, userId, userDisplayName, appUrl);
    }
    if (callbackData === 'cmd_cancel') {
      resetBotSession(userId, 'telegram');
      return {
        text: 'Order flow cancelled. Tap below anytime to continue shopping:',
        buttons: [
          [
            { text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } },
            { text: '📦 View Catalog', callback_data: 'cmd_catalog' }
          ]
        ]
      };
    }
    if (callbackData === 'cmd_cart') {
      return handleCartView(session, appUrl);
    }
    if (callbackData === 'cmd_track_prompt') {
      return {
        text: `🔍 *Track Your Parcel*\n\n` +
          `Send your Order ID in this format:\n\`/status ORD-XXXXX\`\n\n` +
          `Example: \`/status ORD-23358\``,
        buttons: [
          [{ text: '🛍️ Track Inside Mini App', web_app: { url: `${appUrl}/telegram-app?tab=track` } }],
          [{ text: '🔙 Back to Menu', callback_data: 'cmd_start' }]
        ]
      };
    }
    if (callbackData.startsWith('status_')) {
      const orderId = callbackData.replace('status_', '');
      return handleStatusLookup(orderId, appUrl);
    }
    if (callbackData === 'cmd_info') {
      return handleDeliveryInfo(appUrl);
    }
    if (callbackData.startsWith('admin_st_')) {
      // Format: admin_st_ORD-12345_SHIPPED
      const parts = callbackData.split('_');
      if (parts.length >= 4 && userId === getAdminChatId()) {
        const orderId = parts[2];
        const nextStatus = parts[3] as OrderStatus;
        const updated = updateOrderStatus(orderId, nextStatus);
        if (updated) {
          if (updated.channelUserId && updated.channelUserId !== userId) {
            await notifyCustomerOrderStatus(updated);
          }
          return {
            text: `✅ *Admin Update*\nOrder \`${updated.id}\` marked as *${updated.status}*.\n` +
              (updated.channelUserId ? `Customer was notified automatically on Telegram.` : `Customer ordered via Web.`),
            buttons: buildAdminStatusButtons(updated.id, appUrl)
          };
        }
      }
    }
  }

  // Handle /start with optional deep-link payload (e.g. /start buy_prod-001, /start catalog, /start status_ORD-23358)
  if (lowerText.startsWith('/start')) {
    const payload = text.slice(6).trim();
    if (payload.startsWith('buy_')) {
      const prodId = payload.replace('buy_', '');
      return handleSelectProduct(session, prodId, appUrl);
    }
    if (payload === 'catalog') {
      return handleCatalogCommand(appUrl);
    }
    if (payload.startsWith('status_')) {
      return handleStatusLookup(payload.replace('status_', ''), appUrl);
    }
    resetBotSession(userId, 'telegram');
    return handleStartCommand(userDisplayName, appUrl);
  }

  if (lowerText === 'start' || lowerText === 'hi' || lowerText === 'hello') {
    resetBotSession(userId, 'telegram');
    return handleStartCommand(userDisplayName, appUrl);
  }

  if (lowerText === '/catalog' || lowerText === 'catalog' || lowerText === 'menu' || lowerText === 'products') {
    return handleCatalogCommand(appUrl);
  }

  if (lowerText === '/cart' || lowerText === 'cart') {
    return handleCartView(session, appUrl);
  }

  if (lowerText === '/info' || lowerText === '/delivery' || lowerText === 'info' || lowerText === 'delivery') {
    return handleDeliveryInfo(appUrl);
  }

  if (lowerText.startsWith('/status') || lowerText.startsWith('status')) {
    const parts = text.split(/\s+/);
    if (parts.length > 1) {
      return handleStatusLookup(parts[1].trim(), appUrl);
    }
    return {
      text: `🔍 *Order Tracking*\n\nSend:\n\`/status ORD-XXXXX\`\n\nOr open the Mini App to view your recent orders automatically:`,
      buttons: [
        [{ text: '🛍️ Track Inside Mini App', web_app: { url: `${appUrl}/telegram-app?tab=track` } }]
      ]
    };
  }

  if (lowerText === '/cancel' || lowerText === 'cancel') {
    resetBotSession(userId, 'telegram');
    return {
      text: 'Session reset. Send /catalog to browse or /start for the main menu.',
      buttons: [
        [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }]
      ]
    };
  }

  // Multi-step conversational ordering
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0 || qty > 50) {
      return {
        text: 'Please enter a valid quantity between 1 and 50 (e.g. `1`, `2`):'
      };
    }
    return handleQuantityInput(session, qty, appUrl);
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_PHONE';
    updateBotSession(session);
    return {
      text: `Customer Name: *${escapeMarkdown(text)}*\n\n` +
        `Please reply with your *phone number* for courier confirmation (e.g. \`099 944 923\`):`,
      buttons: [[{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]]
    };
  }

  if (session.step === 'ENTERING_PHONE') {
    session.customerPhone = text;
    session.step = 'CHOOSING_LOCATION';
    updateBotSession(session);
    return {
      text: `Phone Number: *${escapeMarkdown(text)}*\n\n` +
        `Select your delivery region:`,
      buttons: [
        [{ text: '📍 Phnom Penh (1–2h Same-Day)', callback_data: 'loc_pp' }],
        [{ text: '🚚 Provinces (Virak Buntham / J&T)', callback_data: 'loc_prov' }],
        [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
      ]
    };
  }

  if (session.step === 'CHOOSING_LOCATION') {
    session.customerAddress = text;
    session.step = 'CHOOSING_PAYMENT';
    updateBotSession(session);
    return promptPaymentMethod();
  }

  if (session.step === 'ENTERING_ADDRESS_DETAILS') {
    session.customerAddress = `${session.customerAddress} - ${text}`;
    session.step = 'CHOOSING_PAYMENT';
    updateBotSession(session);
    return promptPaymentMethod();
  }

  if (session.step === 'CONFIRMING_ORDER' && (lowerText === 'confirm' || lowerText === 'yes')) {
    return await handleOrderConfirmation(session, userId, userDisplayName, appUrl);
  }

  // Quick order ID detection (if user simply pastes ORD-12345)
  if (/^ord-\d{4,6}$/i.test(text)) {
    return handleStatusLookup(text.toUpperCase(), appUrl);
  }

  // Fallback menu
  return {
    text: `👋 Hello, *${escapeMarkdown(userDisplayName || 'Customer')}*!\n\n` +
      `Welcome to *NovaMart* — Verified Hardware & Desktop Gear.\n` +
      `Launch our Mini App or choose an option below:`,
    buttons: [
      [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
      [
        { text: '📦 Browse Catalog', callback_data: 'cmd_catalog' },
        { text: '🛒 View Cart', callback_data: 'cmd_cart' }
      ],
      [
        { text: '🔍 Track Order', callback_data: 'cmd_track_prompt' },
        { text: '🚚 Delivery Info', callback_data: 'cmd_info' }
      ]
    ]
  };
}

function handleStartCommand(userDisplayName: string, appUrl: string): TelegramBotReply {
  return {
    text: `⚡ *NovaMart | Hardware & Desktop Gear*\n` +
      `──────────────────────\n` +
      `Official Telegram Store for verified audio, mechanical keyboards, wearables, and desktop peripherals.\n\n` +
      `• *Phnom Penh:* 1–2 hours express dispatch\n` +
      `• *25 Provinces:* Daily shipping via Virak Buntham / J&T\n` +
      `• *Payment:* Cash on Delivery (COD) or ABA KHQR\n` +
      `• *Warranty:* 1-year official guarantee\n\n` +
      `👋 Welcome, *${escapeMarkdown(userDisplayName || 'Valued Customer')}*! Tap below to begin:`,
    buttons: [
      [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
      [
        { text: '📦 Browse Products', callback_data: 'cmd_catalog' },
        { text: '🛒 View Cart', callback_data: 'cmd_cart' }
      ],
      [
        { text: '🔍 Track Order', callback_data: 'cmd_track_prompt' },
        { text: '🚚 Delivery Info', callback_data: 'cmd_info' }
      ]
    ]
  };
}

function handleSelectProduct(session: BotSession, prodId: string, appUrl: string): TelegramBotReply {
  const prod = getProductById(prodId);
  if (!prod) {
    return {
      text: 'Product not found. Tap below to browse our full catalog:',
      buttons: [
        [{ text: '📦 Browse Products', callback_data: 'cmd_catalog' }],
        [{ text: '🛍️ Open Mini App', web_app: { url: `${appUrl}/telegram-app` } }]
      ]
    };
  }

  if (prod.stock <= 0) {
    return {
      text: `❌ *${escapeMarkdown(prod.name)}* is currently out of stock.`,
      buttons: [[{ text: '📦 Browse Other Products', callback_data: 'cmd_catalog' }]]
    };
  }

  session.step = 'ENTERING_QUANTITY';
  session.currentProductId = prod.id;
  updateBotSession(session);

  return {
    text: `📦 *${escapeMarkdown(prod.name)}*\n` +
      `──────────────────────\n` +
      `• *Price:* *$${prod.price.toFixed(2)}*\n` +
      `• *SKU:* \`${prod.sku}\` | *Stock:* ${prod.stock} units\n` +
      `• *Details:* ${escapeMarkdown(prod.description)}\n\n` +
      `How many units would you like to add?`,
    buttons: [
      [
        { text: '1 Unit', callback_data: 'qty_1' },
        { text: '2 Units', callback_data: 'qty_2' },
        { text: '3 Units', callback_data: 'qty_3' }
      ],
      [
        { text: '5 Units', callback_data: 'qty_5' },
        { text: '❌ Cancel', callback_data: 'cmd_cancel' }
      ]
    ]
  };
}

function handleCatalogCommand(appUrl: string): TelegramBotReply {
  const products = getProducts();
  let message = `📦 *NovaMart Verified Catalog*\n──────────────────────\n\n`;

  const buttons: { text: string; callback_data?: string; web_app?: { url: string } }[][] = [];

  buttons.push([
    { text: '🛍️ Open Full Visual Mini App', web_app: { url: `${appUrl}/telegram-app` } }
  ]);

  products.forEach((p, index) => {
    message += `*${index + 1}. ${escapeMarkdown(p.name)}*\n`;
    message += `• Price: *$${p.price.toFixed(2)}* | SKU: \`${p.sku}\`\n`;
    message += `• Category: ${p.category} | Stock: ${p.stock > 0 ? `${p.stock} units` : 'Out of stock'}\n\n`;

    if (p.stock > 0) {
      buttons.push([
        { text: `⚡ Buy ${p.name.slice(0, 20)} ($${p.price.toFixed(2)})`, callback_data: `buy_${p.id}` }
      ]);
    }
  });

  buttons.push([
    { text: '🛒 View Cart', callback_data: 'cmd_cart' },
    { text: '🔙 Main Menu', callback_data: 'cmd_start' }
  ]);

  return { text: message, buttons };
}

function handleQuantityInput(session: BotSession, qty: number, appUrl: string): TelegramBotReply {
  const prod = getProductById(session.currentProductId || '');
  if (!prod) {
    return {
      text: 'Item not found. Send /catalog to choose again.',
      buttons: [[{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]]
    };
  }

  const existing = session.cart.find(i => i.productId === prod.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    session.cart.push({
      productId: prod.id,
      productName: prod.name,
      unitPrice: prod.price,
      quantity: qty
    });
  }
  session.step = 'IDLE';
  updateBotSession(session);

  const total = session.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const count = session.cart.reduce((sum, i) => sum + i.quantity, 0);

  return {
    text: `✅ Added *${qty}x ${escapeMarkdown(prod.name)}* to your cart.\n\n` +
      `🛒 Cart Summary: *${count} item(s)* — Total: *$${total.toFixed(2)}*\n\n` +
      `Ready to checkout or add more items?`,
    buttons: [
      [{ text: `✅ Checkout Now ($${total.toFixed(2)})`, callback_data: 'cmd_checkout' }],
      [
        { text: '➕ Add More Items', callback_data: 'cmd_catalog' },
        { text: '🛒 View Cart', callback_data: 'cmd_cart' }
      ],
      [{ text: '🛍️ Open Mini App', web_app: { url: `${appUrl}/telegram-app` } }]
    ]
  };
}

function startCheckoutFlow(session: BotSession, userDisplayName: string, appUrl: string): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    return {
      text: 'Your cart is currently empty. Add a product first:',
      buttons: [
        [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
        [{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]
      ]
    };
  }

  session.step = 'ENTERING_NAME';
  updateBotSession(session);

  const buttons: { text: string; callback_data: string }[][] = [];
  if (userDisplayName && userDisplayName !== 'Customer') {
    buttons.push([
      { text: `👤 Use Telegram Name: ${userDisplayName.slice(0, 20)}`, callback_data: `use_name_tg` }
    ]);
  }
  buttons.push([{ text: '❌ Cancel Order', callback_data: 'cmd_cancel' }]);

  return {
    text: `📝 *Step 1 of 4 — Recipient Name*\n\nPlease enter your *full name* for the delivery label, or tap below:`,
    buttons
  };
}

function promptPaymentMethod(): TelegramBotReply {
  return {
    text: `💳 *Step 4 of 4 — Payment Method*\n\nHow would you like to pay upon delivery?`,
    buttons: [
      [{ text: '💵 Cash on Delivery (COD)', callback_data: 'pay_COD' }],
      [{ text: '📱 ABA KHQR / Bakong Scan', callback_data: 'pay_KHQR' }],
      [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
    ]
  };
}

function buildOrderSummary(session: BotSession): TelegramBotReply {
  const total = session.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemsText = session.cart
    .map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} — $${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join('\n');
  const payLabel = session.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR / Bakong' : 'Cash on Delivery (COD)';

  return {
    text: `📋 *NovaMart Order Review*\n` +
      `──────────────────────\n` +
      `• *Customer:* ${escapeMarkdown(session.customerName || 'Customer')}\n` +
      `• *Phone:* \`${session.customerPhone}\`\n` +
      `• *Address:* ${escapeMarkdown(session.customerAddress || 'Direct')}\n\n` +
      `*Items:*\n${itemsText}\n` +
      `──────────────────────\n` +
      `• *Shipping:* FREE\n` +
      `• *Total Due:* *$${total.toFixed(2)}*\n` +
      `• *Payment:* ${payLabel}\n\n` +
      `Tap *Confirm Order* to finalize:`,
    buttons: [
      [{ text: '✅ Confirm Order', callback_data: 'confirm_yes' }],
      [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
    ]
  };
}

async function handleOrderConfirmation(
  session: BotSession,
  userId: string,
  userDisplayName: string,
  appUrl: string
): Promise<TelegramBotReply> {
  if (!session.cart || session.cart.length === 0) {
    resetBotSession(userId, 'telegram');
    return {
      text: 'Your cart is empty. Send /catalog to choose an item.'
    };
  }

  const total = session.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const paymentMethod = session.paymentMethod || 'COD';
  const order = createOrder({
    customerName: session.customerName || userDisplayName || 'Telegram Customer',
    customerPhone: session.customerPhone || 'Not provided',
    customerAddress: session.customerAddress || 'Direct via Telegram Bot',
    items: session.cart.map(i => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.unitPrice * i.quantity
    })),
    totalAmount: total,
    currency: 'USD',
    status: 'CONFIRMED',
    channel: 'telegram',
    channelUserId: userId,
    paymentMethod,
    notes: 'Customer ordered via Telegram Bot'
  });

  resetBotSession(userId, 'telegram');

  // Alert store admin if a different user placed the order
  if (userId !== getAdminChatId()) {
    await notifyAdminNewOrder(order);
  }

  const payLabel = order.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR / Bakong' : 'Cash on Delivery (COD)';

  return {
    text: `✅ *Order Placed Successfully!*\n` +
      `──────────────────────\n` +
      `• *Order ID:* \`${order.id}\`\n` +
      `• *Total Amount:* *$${order.totalAmount.toFixed(2)}*\n` +
      `• *Payment:* ${payLabel}\n` +
      `• *Status:* 🟢 CONFIRMED\n\n` +
      `🚚 *Next Steps:*\n` +
      `Our dispatch team is preparing your parcel. The courier will call \`${order.customerPhone}\` before arrival.\n\n` +
      `You will receive automatic Telegram alerts as your order ships.`,
    buttons: [
      [
        { text: '📦 Track Status', callback_data: `status_${order.id}` },
        { text: '🛍️ Shop More', web_app: { url: `${appUrl}/telegram-app` } }
      ]
    ],
    orderCreated: order
  };
}

function handleCartView(session: BotSession, appUrl: string): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    return {
      text: `🛒 *Your Cart is Empty*\n\nBrowse products in our Mini App or tap below:`,
      buttons: [
        [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
        [{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]
      ]
    };
  }

  let text = `🛒 *Your Shopping Cart*\n──────────────────────\n`;
  let total = 0;
  session.cart.forEach(item => {
    const sub = item.unitPrice * item.quantity;
    total += sub;
    text += `• ${escapeMarkdown(item.productName)} (x${item.quantity}) — $${sub.toFixed(2)}\n`;
  });
  text += `──────────────────────\nTotal: *$${total.toFixed(2)}*`;

  return {
    text,
    buttons: [
      [{ text: `✅ Proceed to Checkout ($${total.toFixed(2)})`, callback_data: 'cmd_checkout' }],
      [
        { text: '➕ Add More Items', callback_data: 'cmd_catalog' },
        { text: '🗑️ Clear Cart', callback_data: 'cmd_cancel' }
      ]
    ]
  };
}

function handleStatusLookup(orderId: string, appUrl: string): TelegramBotReply {
  const order = getOrderById(orderId);
  if (!order) {
    return {
      text: `❌ Order \`${escapeMarkdown(orderId)}\` was not found.\n\nCheck your Order ID (e.g. \`ORD-23358\`) or inspect your recent orders inside the Mini App.`,
      buttons: [
        [{ text: '🛍️ Open Mini App', web_app: { url: `${appUrl}/telegram-app?tab=track` } }],
        [{ text: '🔙 Main Menu', callback_data: 'cmd_start' }]
      ]
    };
  }

  const progressBar = getProgressBar(order.status);

  return {
    text: `📦 *Order Tracking: #${order.id}*\n` +
      `──────────────────────\n` +
      `Progress: ${progressBar}\n` +
      `• *Status:* ${getStatusEmoji(order.status)} *${order.status}*\n` +
      `• *Customer:* ${escapeMarkdown(order.customerName)}\n` +
      `• *Phone:* \`${order.customerPhone}\`\n` +
      `• *Address:* ${escapeMarkdown(order.customerAddress)}\n` +
      `• *Payment:* ${order.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR' : 'COD'} ($${order.totalAmount.toFixed(2)})\n` +
      `• *Placed:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
      `*Items:*\n` +
      order.items.map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} ($${i.totalPrice.toFixed(2)})`).join('\n'),
    buttons: [
      [
        { text: '🔄 Refresh Status', callback_data: `status_${order.id}` },
        { text: '🛍️ Open Store', web_app: { url: `${appUrl}/telegram-app` } }
      ]
    ]
  };
}

function handleDeliveryInfo(appUrl: string): TelegramBotReply {
  return {
    text: `🚚 *NovaMart Logistics & Delivery Guide*\n` +
      `──────────────────────\n` +
      `📍 *Phnom Penh Express:*\n` +
      `• 1–2 hours delivery across all central districts.\n\n` +
      `🚛 *All 25 Provinces:*\n` +
      `• 24–48 hours via Virak Buntham, J&T Express, or Capitol.\n\n` +
      `💳 *Payment Methods:*\n` +
      `• Cash on Delivery (COD) — Inspect before paying\n` +
      `• ABA KHQR / Bakong scan upon arrival\n\n` +
      `🛡️ *Warranty:*\n` +
      `• 100% genuine hardware, 1-year official warranty & 7-day replacement`,
    buttons: [
      [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
      [{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]
    ]
  };
}

function buildAdminStatusButtons(orderId: string, appUrl: string) {
  return [
    [
      { text: '⚙️ Processing', callback_data: `admin_st_${orderId}_PROCESSING` },
      { text: '🚚 Shipped', callback_data: `admin_st_${orderId}_SHIPPED` },
      { text: '✅ Delivered', callback_data: `admin_st_${orderId}_DELIVERED` }
    ],
    [{ text: '🖥️ Open Admin Console', url: `${appUrl}/admin` }]
  ];
}

// Proactive Notification: Alert Store Admin of any new order
export async function notifyAdminNewOrder(order: Order) {
  const adminChatId = getAdminChatId();
  if (!adminChatId) return { ok: false };
  const appUrl = getPublicHttpsUrl();
  const itemsText = order.items
    .map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} ($${i.totalPrice.toFixed(2)})`)
    .join('\n');

  const text =
    `🚨 *NEW ORDER RECEIVED — #${order.id}*\n` +
    `──────────────────────\n` +
    `• *Channel:* ${order.channel.toUpperCase()}\n` +
    `• *Customer:* ${escapeMarkdown(order.customerName)}\n` +
    `• *Phone:* \`${order.customerPhone}\`\n` +
    `• *Address:* ${escapeMarkdown(order.customerAddress)}\n` +
    `• *Payment:* ${order.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR' : 'COD'}\n\n` +
    `*Items:*\n${itemsText}\n` +
    `──────────────────────\n` +
    `💰 *Total:* *$${order.totalAmount.toFixed(2)}*`;

  return sendTelegramApiMessage(adminChatId, text, {
    inline_keyboard: buildAdminStatusButtons(order.id, appUrl)
  });
}

// Proactive Notification: Send receipt to customer who ordered in Mini App
export async function notifyCustomerNewOrder(order: Order) {
  if (!order.channelUserId) return { ok: false };
  const appUrl = getPublicHttpsUrl();
  const itemsText = order.items
    .map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} — $${i.totalPrice.toFixed(2)}`)
    .join('\n');

  const text =
    `✅ *NovaMart Order Confirmed — #${order.id}*\n` +
    `──────────────────────\n` +
    `Thank you, *${escapeMarkdown(order.customerName)}*!\n\n` +
    `*Items:*\n${itemsText}\n` +
    `──────────────────────\n` +
    `• *Total:* *$${order.totalAmount.toFixed(2)}*\n` +
    `• *Payment:* ${order.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR / Bakong' : 'Cash on Delivery (COD)'}\n` +
    `• *Destination:* ${escapeMarkdown(order.customerAddress)}\n\n` +
    `We will message you here as soon as our courier dispatches your parcel.`;

  return sendTelegramApiMessage(order.channelUserId, text, {
    inline_keyboard: [
      [
        { text: '📦 Track Status', callback_data: `status_${order.id}` },
        { text: '🛍️ Open Mini App', web_app: { url: `${appUrl}/telegram-app?tab=track` } }
      ]
    ]
  });
}

// Proactive Notification: Notify customer when admin updates order status
export async function notifyCustomerOrderStatus(order: Order) {
  if (!order.channelUserId) return { ok: false };
  const appUrl = getPublicHttpsUrl();
  const progressBar = getProgressBar(order.status);

  const statusNote: Record<OrderStatus, string> = {
    PENDING: 'Your order has been received and is awaiting confirmation.',
    CONFIRMED: 'Your order is confirmed and queued for packing.',
    PROCESSING: 'Our warehouse team is packing and testing your hardware.',
    SHIPPED: 'Your parcel is out with our courier! Please keep your phone available.',
    DELIVERED: 'Your order has been delivered. Thank you for shopping with NovaMart!',
    CANCELLED: 'Your order has been cancelled. Reply here if you need assistance.'
  };

  const text =
    `🔔 *Order Update: #${order.id}*\n` +
    `──────────────────────\n` +
    `Progress: ${progressBar}\n` +
    `• *Status:* ${getStatusEmoji(order.status)} *${order.status}*\n` +
    `• *Total:* $${order.totalAmount.toFixed(2)}\n\n` +
    `${statusNote[order.status]}`;

  return sendTelegramApiMessage(order.channelUserId, text, {
    inline_keyboard: [
      [
        { text: '📦 View Full Details', callback_data: `status_${order.id}` },
        { text: '🛍️ Open Store', web_app: { url: `${appUrl}/telegram-app` } }
      ]
    ]
  });
}

function getProgressBar(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return '🟢 [██░░░░░░░░] Confirmed';
    case 'PROCESSING':
      return '🟡 [█████░░░░░] Packing';
    case 'SHIPPED':
      return '🚚 [████████░░] On the Way';
    case 'DELIVERED':
      return '✅ [██████████] Delivered';
    case 'CANCELLED':
      return '❌ [CANCELLED]';
    default:
      return '⏳ [█░░░░░░░░░] Received';
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '✅';
    case 'PROCESSING': return '⚙️';
    case 'SHIPPED': return '🚚';
    case 'DELIVERED': return '📦';
    case 'CANCELLED': return '❌';
    default: return '⏳';
  }
}

function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*`[\]])/g, '\\$1');
}

export async function sendTelegramApiMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  if (!token) {
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });
    const result = await res.json();
    if (!result.ok) {
      console.error(`[Telegram API Error] to ${chatId}:`, result);
      if (result.description?.includes("can't parse entities")) {
        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text.replace(/[*_`\\]/g, ''),
            reply_markup: replyMarkup
          })
        });
        return await retryRes.json();
      }
    }
    return result;
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return { ok: false, error: err };
  }
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  if (!token) return { ok: true };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text
      })
    });
    return await res.json();
  } catch (e) {
    console.warn('answerCallbackQuery error:', e);
    return { ok: false };
  }
}
