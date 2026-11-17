import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';

export async function GET() {
  try {
    const products = getProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
