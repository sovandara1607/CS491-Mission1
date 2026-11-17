import { getProducts, getProductById, createOrder, getOrderById, getBotSession, updateBotSession, resetBotSession } from './db';
import { BotSession, Order, OrderItem } from './types';

export interface WhatsAppBotReply {
  text: string;
  orderCreated?: Order;
}

export async function processWhatsAppMessage(
  fromPhoneNumber: string,
  customerName: string,
  incomingBody: string
): Promise<WhatsAppBotReply> {
  const session = getBotSession(fromPhoneNumber, 'whatsapp');
  const text = (incomingBody || '').trim();
  const lower = text.toLowerCase();
  const products = getProducts();

  // Reset or Greeting
  if (lower === 'hi' || lower === 'hello' || lower === 'menu' || lower === 'start' || lower === 'hey') {
    resetBotSession(fromPhoneNumber, 'whatsapp');
    return {
      text: `👋 *Welcome to NovaMart WhatsApp Store!* 🛍️\n\n` +
        `Shop top tech gadgets directly in WhatsApp without downloading any extra app.\n\n` +
        `*Quick Commands:*\n` +
        `• Send *CATALOG* to see all items\n` +
        `• Send *BUY <Item#>* (e.g. *BUY 1*) to order an item\n` +
        `• Send *STATUS <Order#>* to track your order\n` +
        `• Send *HELP* for human customer care`
    };
  }

  // Catalog Command
  if (lower === 'catalog' || lower === 'products' || lower === 'shop') {
    let msg = `📦 *NovaMart Official Catalog*\n\n`;
    products.forEach((p, idx) => {
      msg += `*${idx + 1}. ${p.name}*\n`;
      msg += `💵 Price: *$${p.price.toFixed(2)}* (Code: \`${p.sku}\`)\n`;
      msg += `📝 ${p.description}\n`;
      msg += `👉 Reply *BUY ${idx + 1}* to order\n\n`;
    });
    msg += `Need help? Reply *MENU* anytime.`;
    return { text: msg };
  }

  // Status check
  if (lower.startsWith('status')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const orderId = parts[1].trim();
      const order = getOrderById(orderId);
      if (order) {
        return {
          text: `📦 *Order Tracking #${order.id}*\n\n` +
            `• *Customer:* ${order.customerName}\n` +
            `• *Current Status:* *${order.status}*\n` +
            `• *Total:* $${order.totalAmount.toFixed(2)} (${order.paymentMethod})\n` +
            `• *Items:* ${order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}\n` +
            `• *Delivery Address:* ${order.customerAddress}\n` +
            `• *Date Placed:* ${new Date(order.createdAt).toLocaleDateString()}\n\n` +
            `Thank you for trusting NovaMart!`
        };
      } else {
        return {
          text: `⚠️ Could not find order *${orderId}*. Please verify your order number (e.g. \`STATUS ORD-98215\`).`
        };
      }
    } else {
      return {
        text: `🔍 Send *STATUS <Order#>* (e.g. *STATUS ORD-98215*) to track your package.`
      };
    }
  }

  // Direct BUY command: "BUY 1" or "BUY 2" or "BUY prod-001"
  if (lower.startsWith('buy')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const target = parts[1].trim();
      let product = null;

      // Check numeric index
      const numIdx = parseInt(target, 10);
      if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= products.length) {
        product = products[numIdx - 1];
      } else {
        product = getProductById(target);
      }

      if (product) {
        session.step = 'ENTERING_QUANTITY';
        session.currentProductId = product.id;
        session.customerName = customerName || 'Valued Customer';
        session.customerPhone = fromPhoneNumber;
        updateBotSession(session);

        return {
          text: `🛒 *Selected Item:* ${product.name}\n` +
            `💰 *Unit Price:* $${product.price.toFixed(2)}\n\n` +
            `How many units would you like to purchase? Please reply with a number (e.g. *1*, *2*, or *3*):`
        };
      }
    }
  }

  // Multi-step checkout conversation
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0) {
      return {
        text: `⚠️ Please send a valid quantity number (e.g. 1, 2, 5):`
      };
    }

    const product = getProductById(session.currentProductId || '');
    if (!product) {
      resetBotSession(fromPhoneNumber, 'whatsapp');
      return { text: `Item session expired. Send *CATALOG* to pick again.` };
    }

    session.cart = [
      {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: qty
      }
    ];

    session.step = 'ENTERING_NAME';
    updateBotSession(session);

    return {
      text: `✅ Added *${qty}x ${product.name}* to order.\n` +
        `Subtotal: *$${(product.price * qty).toFixed(2)}*\n\n` +
        `Please reply with your *Full Name* for the shipping label:`
    };
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_ADDRESS';
    updateBotSession(session);

    return {
      text: `Thanks, *${text}*!\n\n📍 Now please reply with your *complete Delivery Address* (Street, City, Postal Code):`
    };
  }

  if (session.step === 'ENTERING_ADDRESS') {
    session.customerAddress = text;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);

    const total = session.cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

    return {
      text: `🧾 *NovaMart - Order Review*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Customer:* ${session.customerName}\n` +
        `📱 *WhatsApp:* ${fromPhoneNumber}\n` +
        `📍 *Address:* ${session.customerAddress}\n\n` +
        `*Items:*\n` +
        session.cart.map(i => `• ${i.productName} (x${i.quantity}) - $${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n') +
        `\n━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *Total to Pay:* *$${total.toFixed(2)}*\n` +
        `🚚 *Payment Method:* Cash on Delivery (COD)\n\n` +
        `Reply *CONFIRM* to place your order or *CANCEL* to discard.`
    };
  }

  if (session.step === 'CONFIRMING_ORDER') {
    if (lower === 'confirm' || lower === 'yes' || lower === 'ok') {
      const total = session.cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

      const order = createOrder({
        customerName: session.customerName || 'WhatsApp Customer',
        customerPhone: fromPhoneNumber,
        customerAddress: session.customerAddress || 'WhatsApp Delivery',
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
        channel: 'whatsapp',
        channelUserId: fromPhoneNumber,
        paymentMethod: 'COD',
        notes: 'Customer placed order directly via WhatsApp'
      });

      resetBotSession(fromPhoneNumber, 'whatsapp');

      return {
        text: `🎉 *ORDER PLACED SUCCESSFULLY!* 🎉\n\n` +
          `Order Reference: *#${order.id}*\n` +
          `Total: *$${order.totalAmount.toFixed(2)}*\n` +
          `Payment: *Cash on Delivery (COD)*\n\n` +
          `Our fulfillment warehouse is preparing your parcel. You will receive real-time delivery notifications here.\n\n` +
          `Reply *STATUS ${order.id}* anytime to track shipment!`,
        orderCreated: order
      };
    } else if (lower === 'cancel') {
      resetBotSession(fromPhoneNumber, 'whatsapp');
      return {
        text: `❌ Order cancelled. Send *CATALOG* to browse items again.`
      };
    }
  }

  if (lower === 'help' || lower === 'support') {
    return {
      text: `🤝 *NovaMart Support Team*\n\n` +
        `Our support agents are available Mon-Sat, 8am-8pm.\n` +
        `For immediate automated ordering, reply:\n` +
        `• *CATALOG* to see products\n` +
        `• *STATUS <Order#>* to track order\n` +
        `• Call us at: +1 (800) 555-NOVA`
    };
  }

  // Default fallback
  return {
    text: `Hi! 👋 I couldn't understand that command.\n\n` +
      `Send *CATALOG* to browse products or *MENU* to see all options.`
  };
}

/**
 * Generate a prefilled WhatsApp Click-to-Chat deep link
 * Allows website visitors to click one button and send their cart to WhatsApp
 */
export function generateWhatsAppOrderLink(
  businessPhoneNumber: string,
  items: { productName: string; quantity: number; unitPrice: number }[],
  totalAmount: number,
  customerName?: string
): string {
  const cleanPhone = businessPhoneNumber.replace(/[^0-9]/g, '');
  let message = `Hello NovaMart! 🛍️\nI would like to order from your website:\n\n`;

  items.forEach(item => {
    message += `• ${item.productName} (x${item.quantity}) - $${(item.unitPrice * item.quantity).toFixed(2)}\n`;
  });

  message += `\n💰 Total: $${totalAmount.toFixed(2)}\n`;
  if (customerName) {
    message += `👤 Customer: ${customerName}\n`;
  }
  message += `Please confirm availability and delivery details. Thank you!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Outbound WhatsApp Cloud API Sender
 */
export async function sendWhatsAppMessage(toPhoneNumber: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log('[WhatsApp API] Live token not configured in .env, simulation mode.');
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhoneNumber,
        type: 'text',
        text: { body: text }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
    return { ok: false, error: err };
  }
}
