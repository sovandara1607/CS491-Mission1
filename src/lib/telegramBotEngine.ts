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

  // Check for callback buttons from inline keyboard
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
          text: `🛒 *Selected Item:* ${prod.name}\n💰 *Price:* $${prod.price.toFixed(2)}\n\nHow many would you like to purchase? (Please reply with a number, e.g. *1* or *2*)`,
          buttons: [
            [
              { text: '1 Unit', callback_data: `qty_1` },
              { text: '2 Units', callback_data: `qty_2` },
              { text: '3 Units', callback_data: `qty_3` }
            ],
            [{ text: '❌ Cancel', callback_data: 'cmd_cancel' }]
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
        text: '❌ Order cancelled. Type /catalog to browse products again or /start for the main menu.'
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
        text: '📱 Open Mobile Web App',
        web_app: { url: `${httpsUrl}/telegram-app` }
      });
    } else {
      topButtons.push({
        text: '🌐 Visit Web Store',
        url: fallbackUrl
      });
    }

    return {
      text: `👋 *Welcome to NovaMart, ${userDisplayName}!* 🛍️\n\n` +
        `Skip downloading another mobile app! You can browse our store and purchase directly inside Telegram with full order tracking.\n\n` +
        `Choose an option below to begin:`,
      buttons: [
        topButtons,
        [
          { text: '📦 Browse Product Catalog', callback_data: 'cmd_catalog' },
          { text: '🛒 View Cart', callback_data: 'cmd_cart' }
        ],
        [
          { text: '🔍 Check Order Status', callback_data: 'cmd_status_prompt' }
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
          text: `📦 *Order Tracking Details*\n\n` +
            `• *Order ID:* \`${order.id}\`\n` +
            `• *Customer:* ${order.customerName}\n` +
            `• *Status:* ${getStatusEmoji(order.status)} *${order.status}*\n` +
            `• *Total:* $${order.totalAmount.toFixed(2)} (${order.paymentMethod})\n` +
            `• *Items:* ${order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}\n` +
            `• *Delivery Address:* ${order.customerAddress}\n` +
            `• *Placed On:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
            `Need assistance? Reply anytime.`
        };
      } else {
        return {
          text: `⚠️ Order \`${orderId}\` could not be found. Please verify your Order ID (e.g. \`ORD-98214\`).`
        };
      }
    } else {
      return {
        text: `🔍 *Check Order Status*\n\nPlease reply with your Order ID, for example:\n\`/status ORD-98214\``
      };
    }
  }

  if (lowerText === '/cancel' || lowerText === 'cancel') {
    resetBotSession(userId, 'telegram');
    return {
      text: `🔄 Session cleared. Type /start or /catalog whenever you are ready!`
    };
  }

  // Handle multi-step order flow
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0) {
      return {
        text: `⚠️ Please enter a valid quantity number (e.g. 1, 2, 5):`
      };
    }
    return handleQuantityInput(session, qty);
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_PHONE';
    updateBotSession(session);
    return {
      text: `Great, ${text}! 📱 What is your *mobile phone number* for delivery contact?`
    };
  }

  if (session.step === 'ENTERING_PHONE') {
    session.customerPhone = text;
    session.step = 'ENTERING_ADDRESS';
    updateBotSession(session);
    return {
      text: `📍 What is your *delivery address*? (Street, city, postal code)`
    };
  }

  if (session.step === 'ENTERING_ADDRESS') {
    session.customerAddress = text;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);

    const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    return {
      text: `📋 *Order Summary & Confirmation*\n\n` +
        `👤 *Customer:* ${session.customerName}\n` +
        `📞 *Phone:* ${session.customerPhone}\n` +
        `📍 *Address:* ${session.customerAddress}\n\n` +
        `*Items Ordered:*\n` +
        session.cart.map(i => `• ${i.productName} x${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n') +
        `\n\n💰 *Total Amount:* $${total.toFixed(2)}\n` +
        `💵 *Payment:* Cash on Delivery (COD)\n\n` +
        `Reply *CONFIRM* or *YES* to place your order!`,
      buttons: [
        [{ text: '✅ Confirm & Place Order', callback_data: 'confirm_yes' }],
        [{ text: '❌ Cancel Order', callback_data: 'cmd_cancel' }]
      ]
    };
  }

  if (session.step === 'CONFIRMING_ORDER' || callbackData === 'confirm_yes' || lowerText === 'confirm' || lowerText === 'yes') {
    if (!session.cart || session.cart.length === 0) {
      resetBotSession(userId, 'telegram');
      return {
        text: `Your cart is empty. Please type /catalog to choose an item.`
      };
    }

    const total = session.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const order = createOrder({
      customerName: session.customerName || userDisplayName || 'Telegram Customer',
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
      text: `🎉 *ORDER PLACED SUCCESSFULLY!* 🎉\n\n` +
        `Thank you for shopping with us! Your order has been registered in our store database.\n\n` +
        `• *Order ID:* \`${order.id}\`\n` +
        `• *Total:* $${order.totalAmount.toFixed(2)} (Cash on Delivery)\n` +
        `• *Estimated Delivery:* 1-3 Business Days\n\n` +
        `You can check your order status anytime by sending:\n\`/status ${order.id}\``,
      buttons: [
        [
          { text: '📦 Track My Order', callback_data: `status_${order.id}` },
          { text: '🛍️ Continue Shopping', callback_data: 'cmd_catalog' }
        ]
      ],
      orderCreated: order
    };
  }

  // Fallback
  const fallbackTopButtons: { text: string; web_app?: { url: string }; url?: string }[] = [];
  if (httpsUrl) {
    fallbackTopButtons.push({
      text: '📱 Open Mobile Web Store',
      web_app: { url: `${httpsUrl}/telegram-app` }
    });
  } else {
    fallbackTopButtons.push({
      text: '🌐 Visit Store',
      url: fallbackUrl
    });
  }

  return {
    text: `I didn't understand that command. 🤔\n\n• Type /catalog to browse our products\n• Type /start for main menu\n• Type /status <ORDER_ID> to track an order`,
    buttons: [
      fallbackTopButtons,
      [{ text: '📦 View Catalog', callback_data: 'cmd_catalog' }]
    ]
  };
}

function handleCatalogCommand(): TelegramBotReply {
  const products = getProducts();
  let message = `📦 *NovaMart Product Catalog*\n\n`;
  message += `Select a product below to purchase immediately:\n\n`;

  const buttons: { text: string; callback_data: string }[][] = [];

  products.forEach((p, index) => {
    message += `*${index + 1}. ${p.name}*\n`;
    message += `💵 Price: *$${p.price.toFixed(2)}* | Stock: ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}\n`;
    message += `📝 ${p.description}\n\n`;

    if (p.stock > 0) {
      buttons.push([
        { text: `🛒 Buy ${p.name.slice(0, 18)}... ($${p.price.toFixed(2)})`, callback_data: `buy_${p.id}` }
      ]);
    }
  });

  buttons.push([
    { text: '🛒 View Cart', callback_data: 'cmd_cart' },
    { text: '❌ Cancel', callback_data: 'cmd_cancel' }
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
      text: `⚠️ Product not found. Please browse /catalog.`
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
    text: `✅ Added *${qty}x ${prod.name}* to your order (Total: *$${(prod.price * qty).toFixed(2)}*).\n\n` +
      `👤 Please reply with your *Full Name* for the delivery order:`
  };
}

function handleCartView(session: BotSession): TelegramBotReply {
  if (!session.cart || session.cart.length === 0) {
    return {
      text: `🛒 *Your cart is currently empty.*\n\nExplore our catalog with /catalog to add items!`,
      buttons: [[{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]]
    };
  }

  let text = `🛒 *Your Current Cart:*\n\n`;
  let total = 0;
  session.cart.forEach(item => {
    const sub = item.unitPrice * item.quantity;
    total += sub;
    text += `• *${item.productName}* x${item.quantity} = $${sub.toFixed(2)}\n`;
  });
  text += `\n💰 *Total:* $${total.toFixed(2)}\n\nWould you like to proceed with checkout?`;

  return {
    text,
    buttons: [
      [{ text: '🚀 Proceed to Checkout', callback_data: 'confirm_yes' }],
      [{ text: '🗑️ Clear Cart', callback_data: 'cmd_cancel' }]
    ]
  };
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'PENDING': return '⏳';
    case 'CONFIRMED': return '✅';
    case 'PROCESSING': return '⚙️';
    case 'SHIPPED': return '🚚';
    case 'DELIVERED': return '🎁';
    case 'CANCELLED': return '❌';
    default: return '📦';
  }
}

// Real outbound telegram message sender
export async function sendTelegramApiMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[Telegram Bot] Live token not configured in .env, simulation mode.');
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
