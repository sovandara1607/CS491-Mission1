import { getProducts, getProductById, createOrder, getOrderById, getBotSession, updateBotSession, resetBotSession } from './db';
import { BotSession, Order } from './types';

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
      text: `Hello, welcome to *NovaMart*.\n\n` +
        `Direct ordering & support desk.\n\n` +
        `*Commands:*\n` +
        `• Send *CATALOG* to view products\n` +
        `• Send *BUY <Item#>* (e.g. *BUY 1*) to order an item\n` +
        `• Send *STATUS <Order#>* to track your delivery\n` +
        `• Send *HELP* for assistance`
    };
  }

  // Catalog Command
  if (lower === 'catalog' || lower === 'products' || lower === 'shop') {
    let msg = `📦 *NovaMart Catalog*\n\n`;
    products.forEach((p, idx) => {
      msg += `*${idx + 1}. ${p.name}*\n`;
      msg += `Price: *$${p.price.toFixed(2)}* (Code: \`${p.sku}\`)\n`;
      msg += `${p.description}\n`;
      msg += `👉 Reply *BUY ${idx + 1}* to order\n\n`;
    });
    msg += `Reply with *BUY <Item#>* to order or *MENU* for options.`;
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
          text: `📦 *Order #${order.id}*\n\n` +
            `• Status: *${order.status}*\n` +
            `• Customer: ${order.customerName}\n` +
            `• Total: *$${order.totalAmount.toFixed(2)}* (${order.paymentMethod})\n` +
            `• Items: ${order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}\n` +
            `• Delivery to: ${order.customerAddress}\n` +
            `• Placed on: ${new Date(order.createdAt).toLocaleDateString()}`
        };
      } else {
        return {
          text: `Order \`${orderId}\` could not be found. Please check your order ID (e.g. \`STATUS ORD-23358\`).`
        };
      }
    } else {
      return {
        text: `To track your package, send:\n*STATUS ORD-XXXXX*`
      };
    }
  }

  // Direct BUY command: "BUY 1" or "BUY 2" or "BUY prod-001"
  if (lower.startsWith('buy')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const target = parts[1].trim();
      let product = null;

      const numIdx = parseInt(target, 10);
      if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= products.length) {
        product = products[numIdx - 1];
      } else {
        product = getProductById(target);
      }

      if (product) {
        session.step = 'ENTERING_QUANTITY';
        session.currentProductId = product.id;
        session.customerName = customerName || 'Customer';
        session.customerPhone = fromPhoneNumber;
        updateBotSession(session);

        return {
          text: `Selected item: *${product.name}*\n` +
            `Price: *$${product.price.toFixed(2)}*\n\n` +
            `How many units would you like to purchase? (Reply with a number, e.g. 1 or 2):`
        };
      }
    }
  }

  // Multi-step checkout conversation
  if (session.step === 'ENTERING_QUANTITY') {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty <= 0) {
      return {
        text: `Please enter a valid quantity (e.g. 1, 2, 3):`
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
      text: `Added *${qty}x ${product.name}* ($${(product.price * qty).toFixed(2)}).\n\n` +
        `Please reply with your *full name* for delivery:`
    };
  }

  if (session.step === 'ENTERING_NAME') {
    session.customerName = text;
    session.step = 'ENTERING_ADDRESS';
    updateBotSession(session);

    return {
      text: `Thanks, *${text}*.\n\nPlease reply with your *complete delivery address*:`
    };
  }

  if (session.step === 'ENTERING_ADDRESS') {
    session.customerAddress = text;
    session.step = 'CONFIRMING_ORDER';
    updateBotSession(session);

    const total = session.cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

    return {
      text: `🧾 *NovaMart - Order Summary*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Name: ${session.customerName}\n` +
        `Phone: ${fromPhoneNumber}\n` +
        `Address: ${session.customerAddress}\n\n` +
        `*Items:*\n` +
        session.cart.map(i => `• ${i.productName} (x${i.quantity}) — $${(i.unitPrice * i.quantity).toFixed(2)}`).join('\n') +
        `\n━━━━━━━━━━━━━━━━━━━\n` +
        `Total: *$${total.toFixed(2)}*\n` +
        `Payment: Cash on Delivery (COD)\n\n` +
        `Reply *CONFIRM* to place your order or *CANCEL* to stop.`
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
        text: `✅ *Order Confirmed*\n\n` +
          `Order Reference: *#${order.id}*\n` +
          `Total: *$${order.totalAmount.toFixed(2)}*\n` +
          `Payment: Cash on Delivery (COD)\n\n` +
          `Our dispatch team will prepare your parcel and contact you before arrival.\n\n` +
          `Send *STATUS ${order.id}* anytime to track shipment.`,
        orderCreated: order
      };
    } else if (lower === 'cancel') {
      resetBotSession(fromPhoneNumber, 'whatsapp');
      return {
        text: `Order cancelled. Send *CATALOG* to view products again.`
      };
    }
  }

  if (lower === 'help' || lower === 'support') {
    return {
      text: `📞 *NovaMart Support*\n\n` +
        `Direct phone / Telegram: +855 99 944 923\n` +
        `Hours: Mon–Sun, 8:00 AM – 8:00 PM\n\n` +
        `• Send *CATALOG* to order products\n` +
        `• Send *STATUS <OrderID>* to track your parcel`
    };
  }

  // Fallback
  return {
    text: `Send *CATALOG* to browse products or *MENU* to view all options.`
  };
}

export function generateWhatsAppOrderLink(
  businessPhoneNumber: string,
  items: { productName: string; quantity: number; unitPrice: number }[],
  totalAmount: number,
  customerName?: string
): string {
  const cleanPhone = businessPhoneNumber.replace(/[^0-9]/g, '');
  let message = `Hello NovaMart! 🛍️\nI would like to order:\n\n`;

  items.forEach(item => {
    message += `• ${item.productName} (x${item.quantity}) — $${(item.unitPrice * item.quantity).toFixed(2)}\n`;
  });

  message += `\nTotal: $${totalAmount.toFixed(2)}\n`;
  if (customerName) {
    message += `Name: ${customerName}\n`;
  }
  message += `Please confirm availability and delivery. Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppMessage(toPhoneNumber: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
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
