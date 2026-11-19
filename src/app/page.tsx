'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Send, 
  MessageSquare, 
  ArrowRight, 
  Search,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Layers,
  Cpu,
  Zap,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart();

  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');
  const waPhone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '85599944923').replace(/[^0-9]/g, '');

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
    const msg = `Hello NovaMart! 🛍️\nI want to order *${product.name}* (Price: $${product.price.toFixed(2)}, SKU: ${product.sku}).\nPlease confirm delivery availability.`;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getTelegramProductLink = (product: Product) => {
    return `https://t.me/${botUsername}?start=buy_${product.id}`;
  };

  return (
    <div className="space-y-20 pb-24 text-[var(--ink)]">
      
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-12 px-4 sm:px-8 border-b border-[var(--line)]">
        <div className="max-w-[1140px] mx-auto space-y-8">
          
          {/* Monospace System Badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[var(--muted)]">
            <span className="text-[var(--accent-purple)] font-bold"># INFRASTRUCTURE</span>
            <span className="text-[var(--subtle)]">/</span>
            <span>OMNICHANNEL E-COMMERCE</span>
            <span className="text-[var(--subtle)]">/</span>
            <span className="text-[var(--accent-green)]">ZERO-APP</span>
          </div>

          {/* Headline */}
          <div className="max-w-4xl space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Commerce without apps.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
                Direct on Telegram & WhatsApp.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl font-normal leading-relaxed pt-2">
              Instead of spending months building a mobile app that customers won't install, 
              we connected our store directly to the messengers already on their phones.
              Browse, purchase, and track parcels seamlessly.
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="kk-btn-primary"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch @{botUsername}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/telegram-app"
              className="kk-btn-secondary"
            >
              <span>Preview Mini App</span>
              <span className="font-mono text-[10px] text-[var(--subtle)]">/tma</span>
            </Link>

            <a
              href={`https://wa.me/${waPhone}?text=Hello%20NovaMart!%20I%20would%20like%20to%20order`}
              target="_blank"
              rel="noreferrer"
              className="kk-btn-secondary text-[#25D366] hover:text-[#25D366]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Direct</span>
            </a>
          </div>

          {/* Architecture Pillars Matrix (KhmerKit Values Banner) */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--line)] bg-[var(--card-bg)] mt-12 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
            <div className="p-6 space-y-2">
              <span className="kk-tag">01 // TELEGRAM MINI APP</span>
              <h3 className="text-sm font-bold text-white">Full In-App Store Experience</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Runs inside Telegram via WebApp SDK. User auth, cart, and native checkout without leaving chat.
              </p>
            </div>

            <div className="p-6 space-y-2">
              <span className="kk-tag">02 // WHATSAPP AUTOMATION</span>
              <h3 className="text-sm font-bold text-white">1-Click Order Transmission</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Customers send prefilled cart items directly to WhatsApp or purchase conversationally via Cloud API.
              </p>
            </div>

            <div className="p-6 space-y-2">
              <span className="kk-tag">03 // REAL-TIME PERSISTENCE</span>
              <h3 className="text-sm font-bold text-white">Central Inventory Engine</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Stock is decremented and orders are synchronized across Web, Telegram, and WhatsApp into one database.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Product Catalog Section */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--accent-green)]"></span>
              <span className="kk-tag">INVENTORY // VERIFIED HARDWARE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Available Products</h2>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white placeholder-[var(--subtle)] font-mono focus:outline-none focus:border-[var(--line-strong)] w-44 sm:w-56"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center border border-[var(--line)] bg-[var(--card-bg-subtle)]">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-white text-black font-bold'
                      : 'text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-96 border border-[var(--line)] bg-[var(--card-bg)] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 border border-[var(--line)] text-center space-y-3 bg-[var(--card-bg)]">
            <p className="text-sm font-mono text-[var(--muted)]">NO_PRODUCTS_MATCH_FILTER</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="kk-card flex flex-col group overflow-hidden"
              >
                {/* Image Header with technical overlay */}
                <div className="relative aspect-[16/11] overflow-hidden bg-black/40 border-b border-[var(--line)]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* SKU & Category badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                      {product.sku}
                    </span>
                    <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-mono text-[var(--accent-purple)] border border-white/10">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-mono text-[var(--accent-green)] border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></span>
                      <span>STOCK: {product.stock}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-[var(--accent-blue)] transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Primary Buy */}
                  <div className="pt-4 border-t border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--subtle)] block">PRICE (USD)</span>
                        <span className="text-xl font-bold font-mono text-white">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        className="kk-btn-primary text-xs py-2 px-3"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>+ CART</span>
                      </button>
                    </div>

                    {/* Instant Messaging Channels */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-[var(--line)]">
                      <a
                        href={getTelegramProductLink(product)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[11px] font-mono text-sky-400 hover:text-white transition flex items-center justify-center gap-1 text-center"
                      >
                        <Send className="w-3 h-3 text-sky-400" />
                        <span>TELEGRAM ↗</span>
                      </a>

                      <a
                        href={getWhatsAppProductLink(product)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-[var(--line-strong)] text-[11px] font-mono text-emerald-400 hover:text-white transition flex items-center justify-center gap-1 text-center"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WHATSAPP ↗</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Engineering Decision / Architecture Matrix */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-8">
        <div className="border border-[var(--line)] bg-[var(--card-bg)] p-6 sm:p-10 space-y-8">
          
          <div className="space-y-2">
            <span className="kk-tag">SYSTEM ANALYSIS // STRATEGY</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Messaging Outperforms Native Mobile Apps
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
              Eliminating the native iOS and Android build pipeline removes friction, eliminates Apple/Google commission overhead, and speeds up time-to-market.
            </p>
          </div>

          {/* Split Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Traditional App drawbacks */}
            <div className="p-6 border border-rose-500/20 bg-rose-950/10 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold">
                <span>[ ✕ ] TRADITIONAL MOBILE APPS</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--muted)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono">•</span>
                  <span><strong>High Latency:</strong> 3–6 months building Swift + Kotlin apps.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono">•</span>
                  <span><strong>78% User Friction:</strong> Customers abandon rather than download a 100MB app for a single checkout.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono">•</span>
                  <span><strong>Platform Tax:</strong> 15%–30% in-app billing commission cuts.</span>
                </li>
              </ul>
            </div>

            {/* Our Architecture advantages */}
            <div className="p-6 border border-emerald-500/20 bg-emerald-950/10 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <span>[ ✓ ] NOVAMART OMNICHANNEL ENGINE</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--muted)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono">•</span>
                  <span><strong>Instant Adoption:</strong> Customers already use Telegram & WhatsApp every day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono">•</span>
                  <span><strong>Real-time Sync:</strong> Shared database with live status dispatching.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono">•</span>
                  <span><strong>98% Read Rates:</strong> Order confirmations land immediately in chat.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer Call to Action */}
          <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-mono text-[var(--subtle)]">
              BOT: @{botUsername} • REPOSITORY: MISSION1 • STATUS: OPERATIONAL
            </span>

            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="kk-btn-primary"
            >
              <span>Test Live in Telegram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
