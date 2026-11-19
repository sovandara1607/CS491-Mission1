import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'NovaMart | Next-Gen Web & Messaging Commerce',
  description: 'Shop top tech gadgets directly via Web, Telegram Mini App, or WhatsApp without downloading native mobile apps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');
  const waPhone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '85599944923').replace(/[^0-9]/g, '');

  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col text-[var(--ink)]">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-1">
            {children}
          </main>
          
          {/* KhmerKit Style Footer */}
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
                    Zero-app mobile retail infrastructure. Orders route directly from Telegram and WhatsApp into one unified database.
                  </p>
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <span className="kk-tag">CHANNELS</span>
                  <ul className="space-y-1.5 text-[11px] text-[var(--muted)]">
                    <li><a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="hover:text-white transition">Telegram Bot (@{botUsername}) ↗</a></li>
                    <li><a href="/telegram-app" className="hover:text-white transition">Telegram Mini App (/tma)</a></li>
                    <li><a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp Direct (+{waPhone}) ↗</a></li>
                    <li><a href="/" className="hover:text-white transition">Web Storefront</a></li>
                  </ul>
                </div>

                {/* Operations */}
                <div className="space-y-2">
                  <span className="kk-tag">SYSTEM</span>
                  <ul className="space-y-1.5 text-[11px] text-[var(--muted)]">
                    <li><a href="/admin" className="hover:text-white transition">Admin Orders Dispatch</a></li>
                    <li><a href="/api/products" className="hover:text-white transition">JSON Catalog Endpoint</a></li>
                    <li><a href="/api/orders" className="hover:text-white transition">Orders REST API</a></li>
                    <li><a href="/api/webhook/telegram" className="hover:text-white transition">Telegram Webhook Router</a></li>
                  </ul>
                </div>

                {/* Specs */}
                <div className="space-y-2">
                  <span className="kk-tag">ENGINEERING</span>
                  <p className="text-[11px] text-[var(--subtle)] leading-relaxed font-sans">
                    Built with Next.js, Node.js, Telegram Bot API & WebApp SDK. Eliminates 100% of app store review overhead.
                  </p>
                </div>

              </div>

              <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--subtle)]">
                <span>© {new Date().getFullYear()} NOVAMART TECHNOLOGIES. ALL RIGHTS RESERVED.</span>
                <span>STATUS: 100% OPERATIONAL // PHNOM PENH & GLOBAL</span>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
