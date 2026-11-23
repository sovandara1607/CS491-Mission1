import { getProducts, getProductById, createOrder, getOrderById, getBotSession, updateBotSession, resetBotSession } from './db';
import { BotSession, Order } from './types';

export interface TelegramBotReply {
  text: string;
  buttons?: { text: string; callback_data?: string; url?: string; web_app?: { url: string } }[][];
  orderCreated?: Order;
}

export async function getPublicHttpsUrl(): Promise<string | null> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl.replace(/\/$/, '');
  }

  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(800) });
    const data = await res.json();
    const httpsTunnel = data.tunnels?.find((t: any) => t.public_url?.startsWith('https://'));
    if (httpsTunnel) {
      return httpsTunnel.public_url.replace(/\/$/, '');
    }
  } catch (e) {
    // ignore
  }

  return null;
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
  const httpsUrl = await getPublicHttpsUrl();
  const fallbackUrl = httpsUrl || 'http://localhost:3005';

  // Handle callback buttons
  if (callbackData) {
    if (callbackData === 'cmd_catalog') {
      return handleCatalogCommand();
    }
    if (callbackData.startsWith('buy_')) {
      const prodId = callbackData.replace('buy_', '');
      const prod = getProductById(prodId);
      if (prod) {
        session.step = 'ENTERING_QUANTITY';
        session.currentProductId = prod.id;
        updateBotSession(session);
        return {
          text: `Selected: *${prod.name}*\nPrice: *$${prod.price.toFixed(2)}*\n\nHow many units would you like to order?`,
          buttons: [
            [
              { text: '1 Unit', callback_data: 'qty_1' },
              { text: '2 Units', callback_data: 'qty_2' },
              { text: '3 Units', callback_data: 'qty_3' }
            ],
            [{ text: 'Cancel', callback_data: 'cmd_cancel' }]
          ]
        };
      }
    }
    if (callbackData.startsWith('qty_')) {
      const qty = parseInt(callbackData.replace('qty_', ''), 10);
      return handleQuantityInput(session, qty);
    }
    if (callbackData === 'cmd_cancel') {
      resetBotSession(userId, 'telegram');
      return {
        text: 'Order cancelled. Type /catalog to browse or /start for the menu.'
      };
    }
    if (callbackData === 'cmd_cart') {
      return handleCartView(session);
    }
  }

  // Handle direct commands
  if (lowerText === '/start' || lowerText === 'start' || lowerText === 'hi' || lowerText === 'hello') {
    resetBotSession(userId, 'telegram');

    const topButtons: { text: string; web_app?: { url: string }; url?: string }[] = [];
    if (httpsUrl) {
      topButtons.push({
        text: '🛍️ Open Store (Mini App)',
        web_app: { url: `${httpsUrl}/telegram-app` }
      });
    } else {
      topButtons.push({
        text: '🌐 Visit Store',
        url: fallbackUrl
      });
    }

    return {
      text: `Welcome to *NovaMart*, ${userDisplayName}.\n\n` +
        `Verified electronics and desktop gear with fast delivery across Cambodia (Cash on Delivery).\n\n` +
        `Choose an option below to start:`,
      buttons: [
        topButtons,
        [
          { text: '📦 Browse Catalog', callback_data: 'cmd_catalog' },
          { text: '🛒 View Cart', callback_data: 'cmd_cart' }
        ],
        [
          { text: '🔍 Track Order', callback_data: 'cmd_status_prompt' }
        ]
      ]
    };
  }

  if (lowerText === '/catalog' || lowerText === 'catalog' || lowerText === 'menu') {
    return handleCatalogCommand();
  }

  if (lowerText.startsWith('/status') || lowerText.startsWith('status')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const orderId = parts[1].trim();
      const order = getOrderById(orderId);
      if (order) {
        return {
          text: `📦 *Order #${order.id}*\n\n` +
            `• Status: *${order.status}*\n` +
            `• Recipient: ${order.customerName}\n` +
            `• Phone: ${order.customerPhone}\n` +
            `• Address: ${order.customerAddress}\n` +
            `• Items: ${order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}\n` +
            `• Total: *$${order.totalAmount.toFixed(2)}* (${order.paymentMethod})\n` +
            `• Date: ${new Date(order.createdAt).toLocaleDateString()}`
        };
      } else {
        return {
          text: `Order \`${orderId}\` was not found. Please check your order ID (e.g. \`ORD-23358\`).`
        };
      }
    } else {
      return {
        text: `To track an order, send:\n\`/status ORD-XXXXX\``
      };
    }
  }

  if (lowerText === '/cancel' || lowerText === 'cancel') {
    resetBotSession(userId, 'telegram');
    return {
      text: 'Session reset. Send /catalog to view items.'
    };
  }

  // Multi-step conversational ordering
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0) {
      return {
        text: 'Please enter a valid quantity (e.g. 1, 2, 3):'
      };
    }
    return handleQuantityInput(session, qty);
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_PHONE';
    updateBotSession(session);
    return {
      text: `Thanks, ${text}. Please provide your *phone number* for delivery confirmation:`
    };
  }

  if (session.step === 'ENTERING_PHONE') {
    session.customerPhone = text;
    session.step = 'ENTERING_ADDRESS';
    updateBotSession(session);
    return {
      text: 'Please provide your *delivery address* (e.g. Street, Sangkat, Khan / Province):'
    };
  }

  if (session.step === 'ENTERING_ADDRESS') {
    session.customerAddress = text;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);

    const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    return {
      text: `📋 *Order Review*\n\n` +
        `• Name: ${session.customerName}\n` +
        `• Phone: ${session.customerPhone}\n` +
        `• Address: ${session.customerAddress}\n\n` +
        `*Items:*\n` +
        session.cart.map(i => `• ${i.productName} (x${i.quantity}) — $${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n') +
        `\n\nTotal to pay: *$${total.toFixed(2)}*\n` +
        `Payment: Cash on Delivery (COD)\n\n` +
        `Reply *CONFIRM* to place this order:`,
      buttons: [
        [{ text: '✅ Confirm Order', callback_data: 'confirm_yes' }],
        [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
      ]
    };
  }

  if (session.step === 'CONFIRMING_ORDER' || callbackData === 'confirm_yes' || lowerText === 'confirm' || lowerText === 'yes') {
    if (!session.cart || session.cart.length === 0) {
      resetBotSession(userId, 'telegram');
      return {
        text: 'Your cart is empty. Send /catalog to choose an item.'
      };
    }

    const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const order = createOrder({
      customerName: session.customerName || userDisplayName || 'Customer',
      customerPhone: session.customerPhone || 'Not provided',
      customerAddress: session.customerAddress || 'Direct via Telegram',
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
      notes: 'Customer ordered via Telegram Bot'
    });

    resetBotSession(userId, 'telegram');

    return {
      text: `✅ *Order Placed Successfully*\n\n` +
        `• Order ID: \`${order.id}\`\n` +
        `• Total: *$${order.totalAmount.toFixed(2)}* (Cash on Delivery)\n` +
        `• Estimated delivery: 1–2 business days\n\n` +
        `Our dispatch team will contact your phone before arrival.\n` +
        `Track anytime: \`/status ${order.id}\``,
      buttons: [
        [
          { text: '📦 Track Status', callback_data: `status_${order.id}` },
          { text: '🛍️ Shop More', callback_data: 'cmd_catalog' }
        ]
      ],
      orderCreated: order
    };
  }

  // Fallback
  const fallbackTopButtons: { text: string; web_app?: { url: string }; url?: string }[] = [];
  if (httpsUrl) {
    fallbackTopButtons.push({
      text: '🛍️ Open Store (Mini App)',
      web_app: { url: `${httpsUrl}/telegram-app` }
    });
  } else {
    fallbackTopButtons.push({
      text: '🌐 Visit Store',
      url: fallbackUrl
    });
  }

  return {
    text: `Send /catalog to view products or /status <ID> to track your parcel.`,
    buttons: [
      fallbackTopButtons,
      [{ text: '📦 View Catalog', callback_data: 'cmd_catalog' }]
    ]
  };
}

function handleCatalogCommand(): TelegramBotReply {
  const products = getProducts();
  let message = `📦 *NovaMart Catalog*\n\n`;

  const buttons: { text: string; callback_data: string }[][] = [];

  products.forEach((p, index) => {
    message += `*${index + 1}. ${p.name}*\n`;
    message += `Price: *$${p.price.toFixed(2)}* | Stock: ${p.stock > 0 ? `${p.stock} units` : 'Out of stock'}\n`;
    message += `${p.description}\n\n`;

    if (p.stock > 0) {
      buttons.push([
        { text: `Buy ${p.name.slice(0, 18)}... ($${p.price.toFixed(2)})`, callback_data: `buy_${p.id}` }
      ]);
    }
  });

  buttons.push([
    { text: '🛒 View Cart', callback_data: 'cmd_cart' },
    { text: 'Cancel', callback_data: 'cmd_cancel' }
  ]);

  return {
    text: message,
    buttons
  };
}

function handleQuantityInput(session: BotSession, qty: number): TelegramBotReply {
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

  return {
    text: `Added *${qty}x ${prod.name}* ($${(prod.price * qty).toFixed(2)}).\n\nPlease provide your *full name* for the shipping label:`
  };
}

function handleCartView(session: BotSession): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    return {
      text: 'Your cart is empty. Send /catalog to browse products.',
      buttons: [[{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]]
    };
  }

  let text = `🛒 *Your Cart:*\n\n`;
  let total = 0;
  session.cart.forEach(item => {
    const sub = item.unitPrice * item.quantity;
    total += sub;
    text += `• ${item.productName} (x${item.quantity}) — $${sub.toFixed(2)}\n`;
  });
  text += `\nTotal: *$${total.toFixed(2)}*`;

  return {
    text,
    buttons: [
      [{ text: 'Proceed to Checkout', callback_data: 'confirm_yes' }],
      [{ text: 'Clear Cart', callback_data: 'cmd_cancel' }]
    ]
  };
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

export async function sendTelegramApiMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
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
            text: text.replace(/[*_`]/g, ''),
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
