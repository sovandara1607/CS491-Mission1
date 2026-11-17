'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Bot, Sparkles, RefreshCw, CheckCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  buttons?: { text: string; callback_data?: string; url?: string; web_app?: { url: string } }[][];
  timestamp: string;
}

export default function SimulatorPage() {
  // Telegram State
  const [tgMessages, setTgMessages] = useState<Message[]>([
    {
      id: 'tg-1',
      sender: 'bot',
      text: '👋 *Welcome to NovaMart Bot!*\n\nSkip downloading an app! You can browse our store and purchase directly inside Telegram.\n\nType `/start` or `/catalog` to begin!',
      buttons: [
        [{ text: '📦 Browse Product Catalog', callback_data: 'cmd_catalog' }],
        [{ text: '📱 Open Mobile Web App', url: '/telegram-app' }]
      ],
      timestamp: '10:00 AM'
    }
  ]);
  const [tgInput, setTgInput] = useState('');
  const [tgLoading, setTgLoading] = useState(false);
  const tgEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp State
  const [waMessages, setWaMessages] = useState<Message[]>([
    {
      id: 'wa-1',
      sender: 'bot',
      text: '👋 *Welcome to NovaMart WhatsApp Store!* 🛍️\n\nShop top tech gadgets directly in WhatsApp without downloading any extra app.\n\nSend *CATALOG* to see all items or *HI* for menu.',
      timestamp: '10:00 AM'
    }
  ]);
  const [waInput, setWaInput] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const waEndRef = useRef<HTMLDivElement>(null);

  // Recent order notice
  const [recentOrder, setRecentOrder] = useState<any>(null);

  useEffect(() => {
    tgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tgMessages]);

  useEffect(() => {
    waEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [waMessages]);

  // Send to Telegram engine
  const sendTelegramMsg = async (text: string, callbackData?: string) => {
    if (!text && !callbackData) return;

    const userMsg: Message = {
      id: 'tg-' + Date.now(),
      sender: 'user',
      text: text || `[Clicked: ${callbackData}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTgMessages(prev => [...prev, userMsg]);
    setTgInput('');
    setTgLoading(true);

    try {
      const res = await fetch('/api/simulate/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'sim_tg_user_99',
          userName: 'Telegram Tester',
          text,
          callbackData
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: Message = {
          id: 'tg-bot-' + Date.now(),
          sender: 'bot',
          text: data.reply.text,
          buttons: data.reply.buttons,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTgMessages(prev => [...prev, botMsg]);

        if (data.reply.orderCreated) {
          setRecentOrder(data.reply.orderCreated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTgLoading(false);
    }
  };

  // Send to WhatsApp engine
  const sendWhatsAppMsg = async (text: string) => {
    if (!text) return;

    const userMsg: Message = {
      id: 'wa-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWaMessages(prev => [...prev, userMsg]);
    setWaInput('');
    setWaLoading(true);

    try {
      const res = await fetch('/api/simulate/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+14155550999',
          name: 'WhatsApp Tester',
          text
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: Message = {
          id: 'wa-bot-' + Date.now(),
          sender: 'bot',
          text: data.reply.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setWaMessages(prev => [...prev, botMsg]);

        if (data.reply.orderCreated) {
          setRecentOrder(data.reply.orderCreated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Omnichannel Test Bench</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Telegram & WhatsApp Chatbot Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Test placing orders directly through simulated Telegram and WhatsApp bots connected to the company backend database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <span>View Database Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Success Notification if order created */}
      {recentOrder && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold">Order #{recentOrder.id} successfully saved to central DB!</h4>
              <p className="text-xs text-emerald-700">
                Channel: <strong className="uppercase">{recentOrder.channel}</strong> • Total: <strong>${recentOrder.totalAmount.toFixed(2)}</strong> • Customer: {recentOrder.customerName}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
          >
            Verify in Admin
          </Link>
        </div>
      )}

      {/* Side-by-side Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TELEGRAM SIMULATOR */}
        <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-800 h-[650px]">
          {/* Header */}
          <div className="bg-[#242f3d] px-5 py-3 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2AABEE] flex items-center justify-center text-white font-bold shadow">
                <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>NovaMart Store Bot</span>
                  <span className="text-[10px] bg-sky-500/30 text-sky-300 px-1.5 py-0.2 rounded font-semibold uppercase">bot</span>
                </h3>
                <span className="text-[11px] text-sky-400">Telegram Bot & TMA</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTgMessages([
                  {
                    id: 'tg-reset',
                    sender: 'bot',
                    text: '👋 Session reset. Send `/start` to begin!',
                    buttons: [[{ text: '📦 Browse Catalog', callback_data: 'cmd_catalog' }]],
                    timestamp: 'Now'
                  }
                ]);
              }}
              title="Reset Chat"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="bg-[#17212b] px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">Try:</span>
            {['/start', '/catalog', '/status ORD-98214', '/cancel'].map(cmd => (
              <button
                key={cmd}
                onClick={() => sendTelegramMsg(cmd)}
                className="px-2.5 py-1 rounded-md bg-[#242f3d] text-sky-300 hover:bg-[#2b394a] transition whitespace-nowrap text-xs font-mono"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Telegram Chat Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0e1621]">
            {tgMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#2b5278] text-white rounded-br-none'
                      : 'bg-[#182533] text-slate-100 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">
                    {msg.text}
                  </div>

                  {/* Render Inline Buttons */}
                  {msg.buttons && (
                    <div className="mt-3 pt-2 border-t border-white/10 space-y-1.5">
                      {msg.buttons.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 flex-wrap">
                          {row.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => {
                                if (btn.web_app) {
                                  window.open('/telegram-app', '_blank');
                                } else if (btn.url) {
                                  window.open(btn.url, '_blank');
                                } else if (btn.callback_data) {
                                  sendTelegramMsg('', btn.callback_data);
                                }
                              }}
                              className="flex-1 min-w-[120px] py-1.5 px-3 bg-[#242f3d] hover:bg-[#2e3c4e] text-sky-300 text-center rounded-lg text-[11px] font-semibold border border-sky-400/20 transition flex items-center justify-center gap-1"
                            >
                              <span>{btn.text}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-right mt-1 opacity-50">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {tgLoading && (
              <div className="flex items-center gap-1 text-slate-400 text-xs px-2 italic">
                <span>Bot is typing...</span>
              </div>
            )}
            <div ref={tgEndRef} />
          </div>

          {/* Telegram Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              sendTelegramMsg(tgInput);
            }}
            className="p-3 bg-[#17212b] border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={tgInput}
              onChange={e => setTgInput(e.target.value)}
              placeholder="Type /start or message here..."
              className="flex-1 bg-[#242f3d] text-white text-xs px-4 py-2.5 rounded-xl border border-transparent focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={tgLoading || !tgInput.trim()}
              className="p-2.5 rounded-xl bg-[#2AABEE] text-white hover:bg-[#229ED9] transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>


        {/* WHATSAPP SIMULATOR */}
        <div className="bg-[#efeae2] rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-300 h-[650px]">
          {/* Header */}
          <div className="bg-[#075e54] px-5 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold shadow">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>NovaMart Official</span>
                  <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-medium">Business</span>
                </h3>
                <span className="text-[11px] text-emerald-200">WhatsApp Cloud API</span>
              </div>
            </div>
            <button
              onClick={() => {
                setWaMessages([
                  {
                    id: 'wa-reset',
                    sender: 'bot',
                    text: '👋 Session reset. Send *HI* or *CATALOG* to start!',
                    timestamp: 'Now'
                  }
                ]);
              }}
              title="Reset Chat"
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-[#096a60] transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="bg-[#e2dcd5] px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-slate-300 text-xs">
            <span className="text-slate-600 text-[11px] whitespace-nowrap font-medium">Try:</span>
            {['HI', 'CATALOG', 'BUY 1', 'CONFIRM', 'STATUS ORD-98215'].map(cmd => (
              <button
                key={cmd}
                onClick={() => sendWhatsAppMsg(cmd)}
                className="px-2.5 py-1 rounded-md bg-white text-emerald-800 hover:bg-emerald-50 transition whitespace-nowrap text-xs font-semibold shadow-xs"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* WhatsApp Chat Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] bg-opacity-90">
            {waMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">
                    {msg.text}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {waLoading && (
              <div className="flex items-center gap-1 text-slate-500 text-xs px-2 italic">
                <span>NovaMart is typing...</span>
              </div>
            )}
            <div ref={waEndRef} />
          </div>

          {/* WhatsApp Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              sendWhatsAppMsg(waInput);
            }}
            className="p-3 bg-[#f0f2f5] border-t border-slate-300 flex items-center gap-2"
          >
            <input
              type="text"
              value={waInput}
              onChange={e => setWaInput(e.target.value)}
              placeholder="Type message to WhatsApp Store..."
              className="flex-1 bg-white text-slate-900 text-xs px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={waLoading || !waInput.trim()}
              className="p-2.5 rounded-xl bg-[#128C7E] text-white hover:bg-[#075e54] transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
