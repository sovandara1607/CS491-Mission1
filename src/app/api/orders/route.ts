import { NextResponse } from 'next/server';
import { getOrders, createOrder, updateOrderStatus, getOrderById } from '@/lib/db';
import { OrderStatus } from '@/lib/types';
import { notifyAdminNewOrder, notifyCustomerNewOrder, notifyCustomerOrderStatus } from '@/lib/telegramBotEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = getOrderById(id);
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
      paymentMethod,
      channel,
      channelUserId,
      notes
    } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required order fields' }, { status: 400 });
    }

    const newOrder = createOrder({
      customerName,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      items,
      totalAmount: totalAmount || items.reduce((s: number, i: any) => s + (i.unitPrice * i.quantity), 0),
      currency: 'USD',
      status: 'CONFIRMED',
      channel: channel || 'web',
      channelUserId: channelUserId ? String(channelUserId) : undefined,
      paymentMethod: paymentMethod || 'COD',
      notes: notes || 'Web Checkout Order'
    });

    // Fire Telegram notifications in parallel without blocking order response on failure
    await Promise.allSettled([
      notifyAdminNewOrder(newOrder),
      newOrder.channelUserId ? notifyCustomerNewOrder(newOrder) : Promise.resolve()
    ]);

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'Missing orderId or status' }, { status: 400 });
    }

    const updated = updateOrderStatus(orderId, status as OrderStatus);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let telegramNotified = false;
    if (updated.channelUserId) {
      const res = await notifyCustomerOrderStatus(updated);
      telegramNotified = !!res?.ok;
    }

    return NextResponse.json({ success: true, order: updated, telegramNotified });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}
