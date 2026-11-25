'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, ArrowUpRight, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  buttons?: { text: string; callback_data?: string; url?: string; web_app?: { url: string } }[][];
  timestamp: string;
}

export default function SimulatorPage() {
  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'tg-welcome',
      sender: 'bot',
      text: '⚡ NovaMart | Hardware & Desktop Gear\n\nSend /start or tap a quick command below to test the live Telegram Bot commerce engine.',
      buttons: [
        [{ text: '📦 Browse Products', callback_data: 'cmd_catalog' }],
        [{ text: '🛍️ Open Mini App Store', url: '/telegram-app' }]
      ],
      timestamp: 'Now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, callbackData?: string) => {
    if (!text && !callbackData) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: text || `[Tap: ${callbackData}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

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
        setMessages(prev => [
          ...prev,
          {
            id: 'b-' + Date.now(),
            sender: 'bot',
            text: data.reply.text,
            buttons: data.reply.buttons,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (data.reply.orderCreated) {
          setRecentOrder(data.reply.orderCreated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-8 py-10 space-y-6 font-sans text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--line)]">
        <div className="space-y-1">
          <span className="kk-tag">SANDBOX // TELEGRAM BOT ENGINE</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Telegram Bot Simulator
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono">
            Test conversational ordering, deep links, and order tracking directly against the live backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/telegram-app" className="kk-btn-secondary text-xs">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>Open Mini App</span>
          </Link>
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noreferrer"
            className="kk-btn-primary text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Real Bot</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {recentOrder && (
        <div className="p-3.5 border border-emerald-400/40 bg-emerald-950/20 flex items-center justify-between gap-3 text-xs font-mono">
          <span className="text-emerald-300">
            ✓ Live order <strong>#{recentOrder.id}</strong> (${recentOrder.totalAmount.toFixed(2)}) created in database!
          </span>
          <Link href="/admin" className="px-2.5 py-1 bg-white text-black font-bold hover:bg-slate-200 transition">
            Inspect in Admin →
          </Link>
        </div>
      )}

      {/* Simulator Window */}
      <div className="border border-[var(--line)] bg-[#0c0d12] flex flex-col h-[600px] shadow-2xl">
        
        {/* Chat Topbar */}
        <div className="px-4 py-3 border-b border-[var(--line)] bg-[#12141b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-white text-black flex items-center justify-center font-khmer text-xs font-bold">
              ន
            </span>
            <div>
              <p className="text-xs font-bold text-white">NovaMart Bot</p>
              <p className="text-[10px] font-mono text-sky-400">@{botUsername} • connected</p>
            </div>
          </div>

          <button
            onClick={() => sendMessage('/start')}
            className="px-2.5 py-1 border border-[var(--line)] hover:border-white text-[11px] font-mono text-[var(--muted)] hover:text-white transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset /start</span>
          </button>
        </div>

        {/* Quick Command Pills */}
        <div className="px-4 py-2 border-b border-[var(--line)] bg-[#0c0d12] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {['/start', '/catalog', '/cart', '/info', '/status ORD-23358'].map(cmd => (
            <button
              key={cmd}
              onClick={() => sendMessage(cmd)}
              className="px-2.5 py-1 border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[var(--muted)] hover:text-white hover:border-white transition whitespace-nowrap"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] p-3 border text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-sky-500/20 border-sky-400/40 text-white font-mono'
                    : 'bg-[#12141b] border-[var(--line)] text-white/95'
                }`}
              >
                {m.text.replace(/\*/g, '').replace(/`/g, '')}
              </div>

              {/* Inline Keyboard Buttons */}
              {m.buttons && m.buttons.length > 0 && (
                <div className="mt-1.5 space-y-1 w-full max-w-[85%]">
                  {m.buttons.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-1">
                      {row.map((btn, bIdx) => {
                        if (btn.web_app?.url || btn.url) {
                          const target = btn.web_app?.url ? '/telegram-app' : btn.url!;
                          return (
                            <Link
                              key={bIdx}
                              href={target}
                              className="flex-1 py-1.5 px-2 border border-sky-400/30 bg-sky-950/20 hover:bg-sky-950/40 text-sky-300 text-[11px] font-mono text-center transition"
                            >
                              {btn.text}
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={bIdx}
                            onClick={() => sendMessage('', btn.callback_data)}
                            className="flex-1 py-1.5 px-2 border border-[var(--line)] bg-[var(--card-bg-subtle)] hover:border-white text-white text-[11px] font-mono text-center transition"
                          >
                            {btn.text}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              <span className="text-[9px] font-mono text-[var(--subtle)] mt-1">{m.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div className="text-[11px] font-mono text-[var(--subtle)]">Bot is typing...</div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3 border-t border-[var(--line)] bg-[#12141b] flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message or command (e.g. /start, /catalog, ORD-23358)..."
            className="flex-1 px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white font-mono focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
