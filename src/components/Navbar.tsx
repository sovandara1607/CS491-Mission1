'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Send, MessageSquare, LayoutDashboard, Bot, Sparkles, Smartphone } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  const navLinks = [
    { href: '/', label: 'Storefront', icon: Sparkles },
    { href: '/telegram-app', label: 'Telegram Mini App', icon: Smartphone },
    { href: '/admin', label: 'Admin Orders', icon: LayoutDashboard }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-600/20">
              N
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                NovaMart
              </span>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Web & Chat Commerce
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick WhatsApp button */}
            <a
              href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '85599944923').replace(/[^0-9]/g, '')}?text=Hello%20NovaMart!%20I%20have%20a%20question%20about%20your%20products`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Quick Telegram button */}
            <a
              href={`https://t.me/${(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition border border-sky-200"
              title="Chat on Telegram"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>Telegram Bot</span>
            </a>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center shadow-sm"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
