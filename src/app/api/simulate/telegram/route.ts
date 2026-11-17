import { NextResponse } from 'next/server';
import { processTelegramMessage } from '@/lib/telegramBotEngine';

export async function POST(request: Request) {
  try {
    const { userId = 'user_sim_1', userName = 'Simulated User', text = '', callbackData } = await request.json();
    const reply = await processTelegramMessage(userId, userName, text, callbackData);
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process simulated telegram message' }, { status: 500 });
  }
}
