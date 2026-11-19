import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { processTelegramMessage, sendTelegramApiMessage } from '../src/lib/telegramBotEngine';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('[Telegram Poller] ❌ TELEGRAM_BOT_TOKEN is not set in .env.local');
  process.exit(1);
}

async function answerCallbackQuery(callbackQueryId: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });
  } catch (e) {
    // ignore
  }
}

async function startPolling() {
  console.log('[Telegram Poller] Initializing bot polling worker...');

  // 1. Delete any existing webhook to ensure getUpdates works
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    const delData = await delRes.json();
    console.log('[Telegram Poller] Delete webhook status:', delData);
  } catch (err) {
    console.warn('[Telegram Poller] Failed to delete webhook:', err);
  }

  // 2. Verify bot identity
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (meData.ok) {
      console.log(`[Telegram Poller] ✅ Connected successfully as @${meData.result.username} (${meData.result.first_name})`);
    } else {
      console.error('[Telegram Poller] ❌ Invalid token or bot error:', meData);
      process.exit(1);
    }
  } catch (err) {
    console.error('[Telegram Poller] ❌ Connection error:', err);
    process.exit(1);
  }

  let offset = 0;
  console.log('[Telegram Poller] 🚀 Listening for messages and orders from Telegram...');

  while (true) {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          let chatId: string | number = '';
          let userId = '';
          let userName = 'Customer';
          let text = '';
          let callbackData = '';

          if (update.message) {
            chatId = update.message.chat.id;
            userId = String(update.message.from?.id || chatId);
            userName = [update.message.from?.first_name, update.message.from?.last_name].filter(Boolean).join(' ') || 'Customer';
            text = update.message.text || '';
            console.log(`[Telegram Poller] 📩 Message from @${update.message.from?.username || userName} (${chatId}): "${text}"`);
          } else if (update.callback_query) {
            chatId = update.callback_query.message.chat.id;
            userId = String(update.callback_query.from?.id || chatId);
            userName = [update.callback_query.from?.first_name, update.callback_query.from?.last_name].filter(Boolean).join(' ') || 'Customer';
            callbackData = update.callback_query.data;
            await answerCallbackQuery(update.callback_query.id);
            console.log(`[Telegram Poller] 🔘 Button clicked by @${update.callback_query.from?.username || userName}: "${callbackData}"`);
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

            const sendRes = await sendTelegramApiMessage(chatId, reply.text, replyMarkup);
            console.log(`[Telegram Poller] 📤 Sent reply to ${chatId}:`, sendRes?.ok ? 'SUCCESS' : sendRes);
          }
        }
      } else {
        // Wait a short moment if non-ok
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error('[Telegram Poller] Polling cycle error:', err);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startPolling();
