import { NextResponse } from 'next/server';
import { processWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsappBotEngine';

// Verification endpoint for Meta developer webhook configuration
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'novamart_whatsapp_secret_token';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Inbound message handler from WhatsApp Cloud API
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    const contact = change?.contacts?.[0];

    if (message && message.type === 'text') {
      const from = message.from; // Phone number
      const customerName = contact?.profile?.name || 'Customer';
      const text = message.text.body;

      const reply = await processWhatsAppMessage(from, customerName, text);
      await sendWhatsAppMessage(from, reply.text);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
