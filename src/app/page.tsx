'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Send, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  CheckCircle, 
  ArrowRight, 
  Search,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getWhatsAppProductLink = (product: Product) => {
    const phone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '85599944923').replace(/[^0-9]/g, '');
    const msg = `Hello NovaMart! 🛍️\nI would like to order *${product.name}* (Price: $${product.price.toFixed(2)}, SKU: ${product.sku}).\nPlease confirm delivery availability.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const getTelegramProductLink = (product: Product) => {
    const botUser = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');
    return `https://t.me/${botUser}?start=buy_${product.id}`;
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fast-Track Commerce • Zero Native App Overhead</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Order Normally from <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Web, Telegram & WhatsApp
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Instead of forcing customers to download another 100MB mobile app, we connected our e-commerce platform straight to 
            <strong className="text-sky-400 font-semibold"> Telegram</strong> and 
            <strong className="text-emerald-400 font-semibold"> WhatsApp</strong>. Browse, order, and track parcels inside the messaging apps you already use every day.
          </p>

          {/* Quick CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#products-section"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog</span>
            </a>

            <Link
              href="/telegram-app"
              className="px-6 py-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-medium text-sm transition backdrop-blur-md border border-sky-400/30 flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Open in Telegram</span>
            </Link>

            <Link
              href="/admin"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition border border-slate-700 flex items-center gap-2"
            >
              <span>Admin Order View</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Channel Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">1. Official Web Store</h3>
              <p className="text-xs text-slate-400 mt-1">Full responsive desktop & mobile web experience with instant cart checkout.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">2. Telegram Bot & TMA</h3>
              <p className="text-xs text-slate-400 mt-1">Interactive chatbot + native Telegram Mini App (TMA) without leaving Telegram.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">3. WhatsApp Direct Order</h3>
              <p className="text-xs text-slate-400 mt-1">1-click order transmission & automated conversational ordering via Cloud API.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Section */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
              <span>Verified Hardware</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Featured Products</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select any item to purchase online or send an order directly through WhatsApp / Telegram.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-800">No products found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-medium">
                      {product.category}
                    </span>
                    {product.stock <= 25 && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold">
                        Low Stock ({product.stock})
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/90 text-slate-600 font-semibold shadow-sm">
                      {product.sku}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Retail Price</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                  {/* Fast Messaging Buy Options */}
                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200">
                    <a
                      href={getWhatsAppProductLink(product)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition text-[11px] font-medium border border-emerald-200"
                      title="Buy instantly via WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>Order on WhatsApp</span>
                    </a>

                    <a
                      href={getTelegramProductLink(product)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition text-[11px] font-medium border border-sky-200"
                      title="Buy instantly via Telegram"
                    >
                      <Send className="w-3 h-3 text-sky-600" />
                      <span>Order on Telegram</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Business Case / Architecture Comparison Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
          <div className="max-w-3xl mb-10">
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
              Strategic Engineering Decision
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 tracking-tight">
              Why Connect Telegram & WhatsApp Instead of Building a Mobile App?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Building a dedicated native iOS and Android application requires massive overhead: hiring separate mobile teams, maintaining two codebases, waiting weeks for App Store approvals, and fighting for user phone storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Mobile App Pain points */}
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">
                  ✕
                </div>
                <h3 className="font-bold text-white text-base">Traditional Native Mobile App</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Development Time:</strong> 3 to 6 months for iOS (Swift) + Android (Kotlin).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Store Approval & Delays:</strong> 1-2 weeks review per update; risk of rejection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>High User Dropoff:</strong> 78% of shoppers abandon when forced to install an app just to buy one item.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>App Store Fees:</strong> 15% - 30% commission cuts on in-app digital payments.</span>
                </li>
              </ul>
            </div>

            {/* Our Messaging & Web Architecture */}
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-white text-base">NovaMart Web + Messaging Architecture</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Time-to-Market:</strong> Deployed in days with 1 unified codebase & database.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Zero Friction:</strong> Customers already have Telegram & WhatsApp open on their phones.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Instant Updates:</strong> Deploy instant schema and bot changes without waiting for Apple/Google approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>98% Read Rates:</strong> Order confirmations and delivery alerts get opened instantly in chat.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Direct Telegram Action */}
          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Order directly without app downloads: chat with our official verified bot.
            </div>
            <a
              href="https://t.me/nova123456789_bot"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs hover:opacity-90 transition shadow-md flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chat with @nova123456789_bot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
