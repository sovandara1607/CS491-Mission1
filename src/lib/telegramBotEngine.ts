import { getProducts, getProductById, createOrder, getOrderById, getBotSession, updateBotSession, resetBotSession } from './db';
import { BotSession, Order } from './types';

export interface TelegramBotReply {
  text: string;
  buttons?: { text: string; callback_data?: string; url?: string; web_app?: { url: string } }[][];
  orderCreated?: Order;
}

export function getPublicHttpsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://cs-491-mission1.vercel.app';
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
      const prod = getProductById(prodId);
      if (prod) {
        session.step = 'ENTERING_QUANTITY';
        session.currentProductId = prod.id;
        updateBotSession(session);
        return {
          text: `📦 *${escapeMarkdown(prod.name)}*\n` +
            `Price: *$${prod.price.toFixed(2)}* | SKU: \`${prod.sku}\`\n\n` +
            `How many units would you like to order?`,
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
    }
    if (callbackData.startsWith('qty_')) {
      const qty = parseInt(callbackData.replace('qty_', ''), 10);
      return handleQuantityInput(session, qty, userDisplayName);
    }
    if (callbackData.startsWith('use_name_')) {
      session.customerName = userDisplayName;
      session.step = 'ENTERING_PHONE';
      updateBotSession(session);
      return {
        text: `Customer Name set to: *${escapeMarkdown(userDisplayName)}*\n\n` +
          `Please provide your *phone number* for delivery confirmation (e.g. \`099 944 923\`):`
      };
    }
    if (callbackData.startsWith('loc_pp')) {
      session.customerAddress = 'Phnom Penh (Same-Day Express)';
      session.step = 'ENTERING_ADDRESS_DETAILS';
      updateBotSession(session);
      return {
        text: `📍 Location: *Phnom Penh*\n\n` +
          `Please reply with your *street, building, or Khan / Sangkat* for our courier:`
      };
    }
    if (callbackData.startsWith('loc_prov')) {
      session.customerAddress = 'Provinces (Express Logistics)';
      session.step = 'ENTERING_ADDRESS_DETAILS';
      updateBotSession(session);
      return {
        text: `🚚 Location: *Provincial Express*\n\n` +
          `Please reply with your *Province, District, and nearest Virak Buntham / J&T branch*:`
      };
    }
    if (callbackData === 'confirm_yes') {
      return handleOrderConfirmation(session, userId, userDisplayName);
    }
    if (callbackData === 'cmd_cancel') {
      resetBotSession(userId, 'telegram');
      return {
        text: 'Order flow cancelled. Tap below anytime to browse again:',
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
          `Send your order ID in the format:\n\`/status ORD-XXXXX\`\n\n` +
          `Example: \`/status ORD-23358\``,
        buttons: [
          [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
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
  }

  // Direct text commands
  if (lowerText === '/start' || lowerText === 'start' || lowerText === 'hi' || lowerText === 'hello') {
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
    const parts = text.split(' ');
    if (parts.length > 1) {
      const orderId = parts[1].trim();
      return handleStatusLookup(orderId, appUrl);
    } else {
      return {
        text: `🔍 *Order Tracking*\n\nTo track an order, send:\n\`/status ORD-XXXXX\`\n\nOr click below to view in the Mini App:`,
        buttons: [
          [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }]
        ]
      };
    }
  }

  if (lowerText === '/cancel' || lowerText === 'cancel') {
    resetBotSession(userId, 'telegram');
    return {
      text: 'Session reset. Send /catalog to browse or /start for the menu.',
      buttons: [
        [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }]
      ]
    };
  }

  // Multi-step order conversation
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0) {
      return {
        text: 'Please enter a valid quantity (e.g. 1, 2, 3):'
      };
    }
    return handleQuantityInput(session, qty, userDisplayName);
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_PHONE';
    updateBotSession(session);
    return {
      text: `Customer Name: *${escapeMarkdown(text)}*\n\n` +
        `Please provide your *phone number* for delivery confirmation (e.g. \`099 944 923\`):`
    };
  }

  if (session.step === 'ENTERING_PHONE') {
    session.customerPhone = text;
    session.step = 'CHOOSING_LOCATION';
    updateBotSession(session);
    return {
      text: `Phone Number: *${escapeMarkdown(text)}*\n\n` +
        `Where should we deliver your order?`,
      buttons: [
        [{ text: '📍 Phnom Penh (Same-Day Delivery)', callback_data: 'loc_pp' }],
        [{ text: '🚚 Provinces (Virak Buntham / J&T Express)', callback_data: 'loc_prov' }]
      ]
    };
  }

  if (session.step === 'CHOOSING_LOCATION') {
    session.customerAddress = text;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);
    return buildOrderSummary(session);
  }

  if (session.step === 'ENTERING_ADDRESS_DETAILS') {
    session.customerAddress = `${session.customerAddress} - ${text}`;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);
    return buildOrderSummary(session);
  }

  if (session.step === 'CONFIRMING_ORDER' && (lowerText === 'confirm' || lowerText === 'yes')) {
    return handleOrderConfirmation(session, userId, userDisplayName);
  }

  // Fallback default message
  return {
    text: `👋 Hello, *${escapeMarkdown(userDisplayName || 'Customer')}*!\n\n` +
      `Welcome to *NovaMart* (Cambodia Hardware & Gear).\n` +
      `You can launch our interactive Mini App or use the buttons below:`,
    buttons: [
      [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
      [
        { text: '📦 Browse Catalog', callback_data: 'cmd_catalog' },
        { text: '🔍 Track Order', callback_data: 'cmd_track_prompt' }
      ],
      [
        { text: '🚚 Delivery & Info', callback_data: 'cmd_info' }
      ]
    ]
  };
}

function handleStartCommand(userDisplayName: string, appUrl: string): TelegramBotReply {
  return {
    text: `⚡ *NovaMart | Hardware & Desktop Gear*\n` +
      `──────────────────────\n` +
      `Official Telegram Store for verified audio, mechanical keyboards, wearables, and accessories.\n\n` +
      `• *Phnom Penh:* 1–2 hours express dispatch\n` +
      `• *Provinces:* Daily express shipping (24–48h)\n` +
      `• *Payment:* Cash on Delivery (COD) or ABA KHQR\n` +
      `• *Warranty:* 1-year official guarantee\n\n` +
      `👋 Welcome, *${escapeMarkdown(userDisplayName || 'Valued Customer')}*! Tap below to start:`,
    buttons: [
      [
        {
          text: '🛍️ Open Mini App Store',
          web_app: { url: `${appUrl}/telegram-app` }
        }
      ],
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

function handleCatalogCommand(appUrl: string): TelegramBotReply {
  const products = getProducts();
  let message = `📦 *NovaMart Verified Catalog*\n` +
    `──────────────────────\n\n`;

  const buttons: { text: string; callback_data?: string; web_app?: { url: string } }[][] = [];

  // Top Mini App shortcut
  buttons.push([
    { text: '🛍️ Open Full Visual Mini App', web_app: { url: `${appUrl}/telegram-app` } }
  ]);

  products.forEach((p, index) => {
    message += `*${index + 1}. ${escapeMarkdown(p.name)}*\n`;
    message += `• Price: *$${p.price.toFixed(2)}* | SKU: \`${p.sku}\`\n`;
    message += `• Category: ${p.category} | Stock: ${p.stock > 0 ? `${p.stock} units` : 'Out of stock'}\n`;
    message += `• ${escapeMarkdown(p.description)}\n\n`;

    if (p.stock > 0) {
      buttons.push([
        { text: `⚡ Buy ${p.name.slice(0, 18)}... ($${p.price.toFixed(2)})`, callback_data: `buy_${p.id}` }
      ]);
    }
  });

  buttons.push([
    { text: '🛒 View Cart', callback_data: 'cmd_cart' },
    { text: '🔙 Back to Menu', callback_data: 'cmd_start' }
  ]);

  return {
    text: message,
    buttons
  };
}

function handleQuantityInput(session: BotSession, qty: number, userDisplayName: string): TelegramBotReply {
  const prod = getProductById(session.currentProductId || '');
  if (!prod) {
    return {
      text: 'Item not found. Send /catalog to choose again.'
    };
  }

  session.cart = [
    {
      productId: prod.id,
      productName: prod.name,
      unitPrice: prod.price,
      quantity: qty
    }
  ];
  session.step = 'ENTERING_NAME';
  updateBotSession(session);

  const buttons: { text: string; callback_data: string }[][] = [];
  if (userDisplayName && userDisplayName !== 'Customer') {
    buttons.push([
      { text: `👤 Use Telegram Name: ${userDisplayName.slice(0, 16)}`, callback_data: `use_name_${encodeURIComponent(userDisplayName)}` }
    ]);
  }
  buttons.push([
    { text: '❌ Cancel Order', callback_data: 'cmd_cancel' }
  ]);

  return {
    text: `Added *${qty}x ${escapeMarkdown(prod.name)}* ($${(prod.price * qty).toFixed(2)}).\n\n` +
      `Please provide your *full name* for shipping label, or tap below:`,
    buttons
  };
}

function buildOrderSummary(session: BotSession): TelegramBotReply {
  const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  let itemsText = session.cart.map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} — $${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n');

  return {
    text: `📋 *NovaMart Order Summary*\n` +
      `──────────────────────\n` +
      `• *Customer:* ${escapeMarkdown(session.customerName || 'Customer')}\n` +
      `• *Phone:* \`${session.customerPhone}\`\n` +
      `• *Address:* ${escapeMarkdown(session.customerAddress || 'Direct')}\n\n` +
      `*Items:*\n${itemsText}\n` +
      `──────────────────────\n` +
      `• *Subtotal:* $${total.toFixed(2)}\n` +
      `• *Shipping:* FREE (Promotion)\n` +
      `• *Total to Pay:* *$${total.toFixed(2)}*\n` +
      `• *Payment:* Cash on Delivery (COD) / ABA KHQR\n\n` +
      `Tap *Confirm Order* to finalize:`,
    buttons: [
      [{ text: '✅ Confirm Order', callback_data: 'confirm_yes' }],
      [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
    ]
  };
}

function handleOrderConfirmation(session: BotSession, userId: string, userDisplayName: string): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    resetBotSession(userId, 'telegram');
    return {
      text: 'Your cart is empty. Send /catalog to choose an item.'
    };
  }

  const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
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
    paymentMethod: 'COD',
    notes: 'Customer ordered via Telegram Bot engine'
  });

  resetBotSession(userId, 'telegram');

  return {
    text: `✅ *Order Placed Successfully!*\n` +
      `──────────────────────\n` +
      `• *Order ID:* \`${order.id}\`\n` +
      `• *Total Amount:* *$${order.totalAmount.toFixed(2)}*\n` +
      `• *Payment Method:* Cash on Delivery (COD) / ABA KHQR\n` +
      `• *Status:* 🟢 CONFIRMED\n\n` +
      `🚚 *Next Steps:*\n` +
      `Our logistics team is preparing your package. The courier will contact \`${order.customerPhone}\` prior to delivery.\n\n` +
      `Track this order anytime by sending:\n\`/status ${order.id}\``,
    buttons: [
      [
        { text: '📦 Track Status', callback_data: `status_${order.id}` },
        { text: '🛍️ Shop More', callback_data: 'cmd_catalog' }
      ]
    ],
    orderCreated: order
  };
}

function handleCartView(session: BotSession, appUrl: string): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    return {
      text: `🛒 *Your Cart is Empty*\n\nBrowse products in our Mini App or send /catalog:`,
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
      [{ text: '✅ Proceed to Checkout', callback_data: 'confirm_yes' }],
      [{ text: '🗑️ Clear Cart', callback_data: 'cmd_cancel' }]
    ]
  };
}

function handleStatusLookup(orderId: string, appUrl: string): TelegramBotReply {
  const order = getOrderById(orderId);
  if (!order) {
    return {
      text: `❌ Order \`${escapeMarkdown(orderId)}\` was not found.\n\nPlease check your Order ID (e.g. \`ORD-23358\`) or contact our team.`,
      buttons: [
        [{ text: '🛍️ Open Mini App', web_app: { url: `${appUrl}/telegram-app` } }],
        [{ text: '🔙 Back to Menu', callback_data: 'cmd_start' }]
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
      `• *Payment:* ${order.paymentMethod} ($${order.totalAmount.toFixed(2)})\n` +
      `• *Placed At:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
      `*Items Ordered:*\n` +
      order.items.map(i => `▫️ ${i.quantity}x ${escapeMarkdown(i.productName)} ($${i.totalPrice.toFixed(2)})`).join('\n'),
    buttons: [
      [
        { text: '🛍️ Open Store (Mini App)', web_app: { url: `${appUrl}/telegram-app` } },
        { text: '🔄 Refresh Status', callback_data: `status_${order.id}` }
      ]
    ]
  };
}

function handleDeliveryInfo(appUrl: string): TelegramBotReply {
  return {
    text: `🚚 *NovaMart Logistics & Delivery Guide*\n` +
      `──────────────────────\n` +
      `📍 *Phnom Penh Express:*\n` +
      `• Delivery time: 1–2 hours after confirmation\n` +
      `• Covered areas: Chamkarmon, Daun Penh, Tuol Kork, Sen Sok, Meanchey, Chbar Ampov, and all central districts.\n\n` +
      `🚛 *Provincial Delivery (All 25 Provinces):*\n` +
      `• Delivery time: 24–48 hours\n` +
      `• Partner carriers: Virak Buntham, J&T Express, Capitol Tour.\n\n` +
      `💳 *Payment Methods:*\n` +
      `• Cash on Delivery (COD) — Inspect parcel before paying!\n` +
      `• ABA KHQR / Bakong scan upon package receipt.\n\n` +
      `🛡️ *Guarantee & Warranty:*\n` +
      `• 100% Genuine brand-new hardware\n` +
      `• 1-Year official warranty + 7-day factory replacement`,
    buttons: [
      [{ text: '🛍️ Open Mini App Store', web_app: { url: `${appUrl}/telegram-app` } }],
      [{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]
    ]
  };
}

function getProgressBar(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return '🟢 [██░░░░░░░░] Processing';
    case 'PROCESSING':
      return '🟡 [████░░░░░░] Packing';
    case 'SHIPPED':
      return '🚚 [███████░░░] On the Way';
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
  const token = process.env.TELEGRAM_BOT_TOKEN || '9190849978:AAHo5wZK-CjQP2Dnbzi3MkvJrXLjHdL9lzQ';
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
      // Fallback: If Markdown fails, retry with plain text
      if (result.description?.includes('can\'t parse entities')) {
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
  const token = process.env.TELEGRAM_BOT_TOKEN || '9190849978:AAHo5wZK-CjQP2Dnbzi3MkvJrXLjHdL9lzQ';
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
