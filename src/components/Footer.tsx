'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, ArrowUpRight, ShieldCheck, Truck, Clock } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');

  // Hide footer completely when running inside the Telegram Mini App
  if (pathname === '/telegram-app') {
    return null;
  }

  return (
    <footer className="border-t border-[var(--line)] bg-[#08090c] py-12 text-xs font-mono">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-khmer text-[11px] font-bold leading-none select-none">
                ន
              </span>
              <span className="text-sm font-bold text-white font-sans">NovaMart</span>
            </div>
            <p className="text-[11px] text-[var(--subtle)] leading-relaxed font-sans">
              Verified electronics & desktop peripherals. Same-day delivery in Phnom Penh and express delivery to all 25 provinces across Cambodia.
            </p>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <span className="kk-tag">COMMERCE CHANNELS</span>
            <ul className="space-y-1.5 text-[11px] text-[var(--muted)]">
              <li>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center gap-1 text-sky-400"
                >
                  <Send className="w-3 h-3" />
                  <span>Telegram Bot (@{botUsername}) ↗</span>
                </a>
              </li>
              <li>
                <Link href="/telegram-app" className="hover:text-white transition">
                  Telegram Mini App (TMA)
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition">
                  Web Store Catalog
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Logistics & Delivery */}
          <div className="space-y-2">
            <span className="kk-tag">DELIVERY & PAYMENT</span>
            <ul className="space-y-1 text-[11px] text-[var(--muted)]">
              <li className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[var(--accent-green)]" />
                <span>Phnom Penh: 1–2h dispatch</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-[var(--accent-amber)]" />
                <span>25 Provinces: Virak Buntham / J&T</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[var(--accent-blue)]" />
                <span>Cash on Delivery & ABA KHQR</span>
              </li>
            </ul>
          </div>

          {/* Official Guarantee */}
          <div className="space-y-2">
            <span className="kk-tag">GUARANTEE</span>
            <p className="text-[11px] text-[var(--subtle)] leading-relaxed">
              100% Genuine guaranteed. All devices include a 1-year official hardware warranty and 7-day immediate replacement policy.
            </p>
            <div className="pt-2 text-[10px] text-[var(--subtle)]">
              © {new Date().getFullYear()} NovaMart Cambodia. All rights reserved.
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
