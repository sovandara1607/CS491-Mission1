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
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                      N
                    </div>
                    <span className="text-lg font-bold text-white">NovaMart</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero-app mobile commerce. Customers order seamlessly through the website, Telegram bots, or WhatsApp Business without downloading native apps.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Order Channels</h4>
                  <ul className="space-y-2 text-xs">
                    <li><span className="text-slate-300">Web Storefront:</span> Instant online checkout</li>
                    <li><span className="text-slate-300">Telegram Bot:</span> In-chat catalog & checkout</li>
                    <li><span className="text-slate-300">Telegram Mini App:</span> Native webview store</li>
                    <li><span className="text-slate-300">WhatsApp Cloud:</span> Click-to-chat & automated bot</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform Tools</h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href="/simulator" className="hover:text-white transition">Chatbots Test Simulator</a></li>
                    <li><a href="/admin" className="hover:text-white transition">Unified Orders Management</a></li>
                    <li><a href="/telegram-app" className="hover:text-white transition">Telegram Mini App Preview</a></li>
                    <li><a href="/api/webhook/telegram" className="hover:text-white transition">Telegram Webhook Endpoint</a></li>
                    <li><a href="/api/webhook/whatsapp" className="hover:text-white transition">WhatsApp Webhook Endpoint</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Company Policy</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By leveraging messaging platforms, our company reduces app development & maintenance costs by 85% while meeting customers where they spend 90% of their mobile screen time.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} NovaMart Technologies. Omnichannel Commerce Architecture.
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
