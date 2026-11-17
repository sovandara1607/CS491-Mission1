import { NextResponse } from 'next/server';
import { processWhatsAppMessage } from '@/lib/whatsappBotEngine';

export async function POST(request: Request) {
  try {
    const { phone = '+14155550999', name = 'WhatsApp Customer', text = '' } = await request.json();
    const reply = await processWhatsAppMessage(phone, name, text);
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process simulated whatsapp message' }, { status: 500 });
  }
}
