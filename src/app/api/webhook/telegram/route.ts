import { NextResponse } from 'next/server';
import { processTelegramMessage, sendTelegramApiMessage } from '@/lib/telegramBotEngine';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    let userId = '';
    let userName = 'Customer';
    let text = '';
    let callbackData = '';
    let chatId: string | number = '';

    if (update.message) {
      chatId = update.message.chat.id;
      userId = String(update.message.from?.id || chatId);
      userName = [update.message.from?.first_name, update.message.from?.last_name].filter(Boolean).join(' ') || 'Customer';
      text = update.message.text || '';
    } else if (update.callback_query) {
      chatId = update.callback_query.message.chat.id;
      userId = String(update.callback_query.from?.id || chatId);
      userName = [update.callback_query.from?.first_name, update.callback_query.from?.last_name].filter(Boolean).join(' ') || 'Customer';
      callbackData = update.callback_query.data;
    }

    if (chatId) {
      const reply = await processTelegramMessage(userId, userName, text, callbackData);

      const replyMarkup = reply.buttons ? {
        inline_keyboard: reply.buttons.map(row => 
          row.map(btn => {
            const b: any = { text: btn.text };
            if (btn.callback_data) b.callback_data = btn.callback_data;
            if (btn.url) b.url = btn.url;
            if (btn.web_app) b.web_app = btn.web_app;
            return b;
          })
        )
      } : undefined;

      await sendTelegramApiMessage(chatId, reply.text, replyMarkup);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    channel: 'telegram',
    endpoint: '/api/webhook/telegram',
    description: 'Telegram Bot Webhook endpoint for NovaMart e-commerce'
  });
}
