'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Send, ArrowUpRight, Smartphone, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');

  // Hide the desktop navbar completely inside Telegram Mini App
  if (pathname === '/telegram-app') {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Catalog' },
    { href: '/telegram-app', label: 'Telegram Mini App' },
    { href: '/simulator', label: 'Bot Simulator' },
    { href: '/admin', label: 'Admin Orders' }
  ];

  return (
    <header className="w-full border-b border-[var(--line)] bg-[#0c0d12]/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Brand with KhmerKit glyph mark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-6 h-6 bg-white text-black flex items-center justify-center font-khmer text-[13px] font-bold leading-none select-none transition group-hover:scale-105">
              ន
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>NovaMart</span>
              <span className="text-[10px] font-mono text-[var(--subtle)] font-normal hidden sm:inline">
                / v1.1
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 border-l border-[var(--line)] pl-6">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-medium transition ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mini App launch shortcut */}
          <Link
            href="/telegram-app"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[var(--muted)] hover:text-white hover:border-[var(--line-strong)] transition"
          >
            <Smartphone className="w-3 h-3 text-sky-400" />
            <span>Mini App</span>
          </Link>

          {/* Live Telegram Bot status pill */}
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium border border-[var(--line)] bg-[var(--card-bg-subtle)] text-sky-400 hover:text-white hover:border-[var(--line-strong)] transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse"></span>
            <Send className="w-3 h-3" />
            <span>@{botUsername}</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--subtle)]" />
          </a>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3 py-1.5 bg-white text-black hover:bg-slate-200 text-xs font-bold transition flex items-center gap-2 select-none"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="font-mono">CART</span>
            {totalItems > 0 && (
              <span className="bg-black text-white px-1.5 py-0.2 text-[10px] font-mono font-bold ml-0.5">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-1.5 border border-[var(--line)] text-[var(--muted)] hover:text-white hover:border-white transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[#0c0d12] px-4 py-3 space-y-2 font-mono text-xs">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 border transition ${
                  isActive
                    ? 'border-white bg-white/10 text-white font-bold'
                    : 'border-[var(--line)] text-[var(--muted)] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 border border-sky-400/30 bg-sky-950/20 text-sky-400"
          >
            <span className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Bot (@{botUsername})</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
}
