'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { 
  ShoppingBag, 
  Send, 
  MessageSquare, 
  Search,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  HelpCircle,
  PhoneCall
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
    const msg = `Hello NovaMart! 🛍️\nI would like to order *${product.name}* (Price: $${product.price.toFixed(2)}, Code: ${product.sku}).\nPlease confirm delivery availability.`;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getTelegramProductLink = (product: Product) => {
    return `https://t.me/${botUsername}?start=buy_${product.id}`;
  };

  return (
    <div className="space-y-20 pb-24 text-[var(--ink)] font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-14 sm:pt-20 pb-12 px-4 sm:px-8 border-b border-[var(--line)]">
        <div className="max-w-[1140px] mx-auto space-y-8">
          
          {/* Header Telemetry Badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[var(--muted)]">
            <span className="text-[var(--accent-purple)] font-bold"># STORE</span>
            <span className="text-[var(--subtle)]">/</span>
            <span>HARDWARE & DESKTOP GEAR</span>
            <span className="text-[var(--subtle)]">/</span>
            <span className="text-[var(--accent-green)] font-semibold">PHNOM PENH & PROVINCES</span>
          </div>

          {/* Headline */}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Premium Hardware.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
                Delivered Across Cambodia.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl leading-relaxed pt-1">
              Studio wireless audio, mechanical keyboards, smart wearables, and desktop peripherals. 
              Order directly on our web store, or chat with our team on Telegram and WhatsApp with instant Cash on Delivery.
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#products"
              className="kk-btn-primary"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Browse Products</span>
            </a>

            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="kk-btn-secondary"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Open in Telegram (@{botUsername})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--subtle)]" />
            </a>

            <a
              href={`https://wa.me/${waPhone}?text=Hello%20NovaMart!%20I%20have%20an%20order%20inquiry`}
              target="_blank"
              rel="noreferrer"
              className="kk-btn-secondary text-[#25D366] hover:text-[#25D366]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp: +{waPhone}</span>
            </a>
          </div>

          {/* Core Service Guarantees Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--line)] bg-[var(--card-bg)] mt-12 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
            <div className="p-5 space-y-1.5">
              <span className="kk-tag">01 // DISPATCH</span>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                <span>Same-Day Delivery</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                1–2 hours delivery across Phnom Penh. Provincial express delivery within 24–48 hours.
              </p>
            </div>

            <div className="p-5 space-y-1.5">
              <span className="kk-tag">02 // PAYMENT</span>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                <span>Cash on Delivery</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Inspect your items before paying. Zero upfront payment required for local orders.
              </p>
            </div>

            <div className="p-5 space-y-1.5">
              <span className="kk-tag">03 // LOGISTICS</span>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>All 25 Provinces</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Daily parcels dispatched via Virak Buntham, J&T, and Capitol Express.
              </p>
            </div>

            <div className="p-5 space-y-1.5">
              <span className="kk-tag">04 // WARRANTY</span>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                <span>Official Warranty</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                100% genuine products with 1-year warranty and 7-day replacement for factory defects.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Product Catalog Section */}
      <section id="products" className="max-w-[1140px] mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--accent-green)]"></span>
              <span className="kk-tag">CATALOG // VERIFIED HARDWARE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Available Products</h2>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white placeholder-[var(--subtle)] font-mono focus:outline-none focus:border-[var(--line-strong)] w-44 sm:w-56"
              />
            </div>

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
                {/* Image Container with Badges */}
                <div className="relative aspect-[16/11] overflow-hidden bg-black/40 border-b border-[var(--line)]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
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
                      <span>IN STOCK ({product.stock})</span>
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-[var(--accent-blue)] transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Primary Action */}
                  <div className="pt-4 border-t border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--subtle)] block">PRICE</span>
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

                    {/* Direct Messaging Order Buttons */}
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

      {/* Practical Ordering Guide Section */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-8">
        <div className="border border-[var(--line)] bg-[var(--card-bg)] p-6 sm:p-10 space-y-8">
          
          <div className="space-y-1">
            <span className="kk-tag">ORDERING // HOW IT WORKS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Order Your Way
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
              We make ordering fast and straightforward. Pick whichever channel is most convenient for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-white">01 // WEB CHECKOUT</span>
              <h3 className="text-sm font-bold text-white">Direct on Website</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Add items to your cart, click checkout, enter your phone and delivery address. No account registration needed.
              </p>
            </div>

            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-sky-400">02 // TELEGRAM BOT & TMA</span>
              <h3 className="text-sm font-bold text-white">Inside Telegram</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Message <strong className="text-white">@{botUsername}</strong> to browse or open our Mini App. Receive instant live order and shipping updates.
              </p>
            </div>

            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-400">03 // WHATSAPP DIRECT</span>
              <h3 className="text-sm font-bold text-white">Chat & Confirm</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Click "WhatsApp" on any product to send an instant order inquiry to our team at <strong className="text-white">+{waPhone}</strong>.
              </p>
            </div>

          </div>

          {/* Quick FAQ Strip */}
          <div className="pt-6 border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[var(--muted)]">
            <div>
              <span className="font-mono text-white font-bold block mb-1">What payment methods?</span>
              Cash on Delivery (COD) upon receiving your package, or ABA KHQR / Bakong.
            </div>
            <div>
              <span className="font-mono text-white font-bold block mb-1">How fast is delivery?</span>
              Phnom Penh: 1–2 hours. Provinces: 24–48 hours via Virak Buntham or J&T Express.
            </div>
            <div>
              <span className="font-mono text-white font-bold block mb-1">Need help or advice?</span>
              Contact our sales desk on Telegram (@{botUsername}) or call +{waPhone}.
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
