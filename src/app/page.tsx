'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Send,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  Smartphone,
  X,
  Check,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart } = useCart();

  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');

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
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTelegramProductLink = (product: Product) => {
    return `https://t.me/${botUsername}?start=buy_${product.id}`;
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(prev => (prev === product.id ? null : prev)), 1200);
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
              Order directly on our web store, or chat seamlessly via Telegram with instant Cash on Delivery and ABA KHQR.
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href="#products" className="kk-btn-primary">
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
              <span>Open Telegram Bot (@{botUsername})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--subtle)]" />
            </a>

            <Link href="/telegram-app" className="kk-btn-secondary">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Mini App</span>
            </Link>
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
                <span>Cash on Delivery & KHQR</span>
              </h3>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Inspect your items before paying. Supports Cash on Delivery and ABA KHQR / Bakong.
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

            <div className="flex items-center border border-[var(--line)] bg-[var(--card-bg-subtle)] overflow-x-auto max-w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono font-medium transition whitespace-nowrap ${
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
                {/* Image Container (clickable for specs modal) */}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="relative aspect-[16/11] overflow-hidden bg-black/40 border-b border-[var(--line)] text-left w-full"
                >
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

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-mono text-[var(--accent-green)] border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></span>
                      <span>IN STOCK ({product.stock})</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10 opacity-0 group-hover:opacity-100 transition">
                      <Info className="w-3 h-3" />
                      <span>SPECS</span>
                    </span>
                  </div>
                </button>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="text-left font-bold text-white text-base leading-snug group-hover:text-[var(--accent-blue)] transition"
                    >
                      {product.name}
                    </button>
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
                        onClick={() => handleQuickAdd(product)}
                        disabled={product.stock <= 0}
                        className="kk-btn-primary text-xs py-2 px-3 disabled:opacity-40"
                      >
                        {addedId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>ADDED</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>+ CART</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct Telegram Order Button */}
                    <div className="pt-2 border-t border-dashed border-[var(--line)]">
                      <a
                        href={getTelegramProductLink(product)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1.5 px-3 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-sky-400 text-[11px] font-mono text-sky-400 hover:text-white transition flex items-center justify-center gap-1.5 text-center"
                      >
                        <Send className="w-3 h-3 text-sky-400" />
                        <span>ORDER VIA TELEGRAM ↗</span>
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
              We make hardware shopping seamless across Cambodia. Order directly on web or via Telegram without downloading heavy apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-white">01 // WEB CHECKOUT</span>
              <h3 className="text-sm font-bold text-white">Direct on Website</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Add items to your cart, click checkout, enter your phone and delivery address. Fast delivery with Cash on Delivery or ABA KHQR.
              </p>
            </div>

            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-sky-400">02 // TELEGRAM MINI APP</span>
              <h3 className="text-sm font-bold text-white">Embedded Mini App</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Open our Telegram Mini App directly inside your chat. Browse photos, filter categories, checkout in 10 seconds, and receive live Telegram shipping alerts.
              </p>
            </div>

            <div className="p-5 border border-[var(--line)] bg-[var(--card-bg-subtle)] space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400">03 // TELEGRAM BOT</span>
              <h3 className="text-sm font-bold text-white">Chat With @{botUsername}</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Send /start or /catalog to place conversational orders, choose your destination, and receive instant tracking notifications.
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
              Contact our sales desk on Telegram (@{botUsername}) anytime.
            </div>
          </div>

        </div>
      </section>

      {/* Product Detail & Specs Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#0c0d12] border border-[var(--line-strong)] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Left Image */}
            <div className="relative bg-black/50 border-b md:border-b-0 md:border-r border-[var(--line)] min-h-[240px]">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/85 border border-white/10 text-[10px] font-mono text-white">
                {selectedProduct.sku}
              </span>
            </div>

            {/* Right Specs & Actions */}
            <div className="p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--accent-purple)] uppercase">
                      {selectedProduct.category}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-snug mt-0.5">
                      {selectedProduct.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 border border-[var(--line)] hover:border-white text-[var(--muted)] hover:text-white transition"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {selectedProduct.description}
                </p>

                {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="kk-tag block">TECHNICAL SPECS</span>
                    <ul className="space-y-1 text-xs font-mono text-white/90">
                      {selectedProduct.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-[var(--accent-blue)] flex-shrink-0" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-2.5 border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[11px] font-mono text-[var(--accent-green)] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{selectedProduct.warranty || '1-Year Official Warranty'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--line)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-white">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--accent-green)]">
                    ● {selectedProduct.stock} units in stock
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleQuickAdd(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="kk-btn-primary text-xs py-2.5 w-full"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>+ ADD TO CART</span>
                  </button>

                  <a
                    href={getTelegramProductLink(selectedProduct)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-sky-400 text-xs font-mono text-sky-400 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>TELEGRAM ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
