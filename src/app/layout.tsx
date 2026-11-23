import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'NovaMart | Premium Electronics & Hardware',
  description: 'Verified audio, mechanical keyboards, wearables, and desktop gear. Order on web, Telegram, or WhatsApp with Cash on Delivery across Cambodia.',
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
          
          {/* Footer */}
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
                    Verified electronics & desktop peripherals. Same-day delivery in Phnom Penh and express delivery to all 25 provinces.
                  </p>
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <span className="kk-tag">CHANNELS</span>
                  <ul className="space-y-1.5 text-[11px] text-[var(--muted)]">
                    <li><a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="hover:text-white transition">Telegram Bot (@{botUsername}) ↗</a></li>
                    <li><a href="/telegram-app" className="hover:text-white transition">Telegram Mini App</a></li>
                    <li><a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp (+{waPhone}) ↗</a></li>
                    <li><a href="/" className="hover:text-white transition">Store Catalog</a></li>
                  </ul>
                </div>

                {/* Operations */}
                <div className="space-y-2">
                  <span className="kk-tag">ORDERS & DISPATCH</span>
                  <ul className="space-y-1.5 text-[11px] text-[var(--muted)]">
                    <li><a href="/admin" className="hover:text-white transition">Order Management</a></li>
                    <li><span className="text-[var(--subtle)]">Hours: 8:00 AM – 8:00 PM</span></li>
                    <li><span className="text-[var(--subtle)]">Phnom Penh & Siem Reap</span></li>
                    <li><span className="text-[var(--subtle)]">Phone: +855 99 944 923</span></li>
                  </ul>
                </div>

                {/* Service Specs */}
                <div className="space-y-2">
                  <span className="kk-tag">CUSTOMER CARE</span>
                  <p className="text-[11px] text-[var(--subtle)] leading-relaxed font-sans">
                    Cash on Delivery (COD) and ABA KHQR accepted. 1-year official hardware warranty with 7-day replacement for defects.
                  </p>
                </div>

              </div>

              <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[var(--subtle)]">
                <span>© {new Date().getFullYear()} NOVAMART CAMBODIA. ALL RIGHTS RESERVED.</span>
                <span>FREE DELIVERY ON ORDERS OVER $30</span>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
