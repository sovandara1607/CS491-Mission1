import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db';
import { OrderStatus } from '@/lib/types';
import { notifyCustomerOrderStatus } from '@/lib/telegramBotEngine';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status' }, { status: 400 });
    }

    const updated = updateOrderStatus(params.id, status as OrderStatus);
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
    console.error('Order status patch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}
