'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import { Product, Order } from '@/lib/types';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Minus, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  Sparkles,
  MapPin,
  RefreshCw,
  X
} from 'lucide-react';

export default function TelegramMiniApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'cart' | 'track'>('store');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Telegram User & Checkout Form State
  const [tgUser, setTgUser] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState<'phnom_penh' | 'province'>('phnom_penh');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'KHQR'>('COD');
  
  // Order result & tracking state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Trigger Telegram Haptic Feedback safely
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try {
        const haptic = (window as any).Telegram.WebApp.HapticFeedback;
        if (type === 'success' || type === 'error') {
          haptic.notificationOccurred(type);
        } else {
          haptic.impactOccurred(type);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    // Initialize Telegram WebApp SDK
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.enableClosingConfirmation?.();
      } catch (e) {}

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setTgUser(u);
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
        if (fullName) setCustomerName(fullName);
      }
    }

    // Fetch Products
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

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    triggerHaptic('light');
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    triggerHaptic('light');
    setCart(prev => {
      return prev
        .map(i => {
          if (i.product.id === productId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert('Please fill in your recipient name, phone number, and delivery address.');
      return;
    }

    setSubmitting(true);
    triggerHaptic('medium');

    const fullAddress = `${deliveryRegion === 'phnom_penh' ? '[Phnom Penh Express]' : '[Provincial Express]'} ${customerAddress.trim()}`;

    try {
      const orderItems = cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        totalPrice: i.product.price * i.quantity
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: fullAddress,
          items: orderItems,
          totalAmount,
          channel: 'telegram',
          paymentMethod: paymentMethod === 'COD' ? 'COD' : 'BANK_TRANSFER',
          notes: `Placed via Telegram Mini App. User: ${tgUser?.username ? `@${tgUser.username}` : tgUser?.first_name || 'Telegram User'}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder(data.order);
        setTrackOrderId(data.order.id);
        setCart([]);
        triggerHaptic('success');

        // Notify Telegram WebApp
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          try {
            (window as any).Telegram.WebApp.sendData(JSON.stringify({
              action: 'ORDER_PLACED',
              orderId: data.order.id,
              total: data.order.totalAmount
            }));
          } catch (e) {
            // ignore
          }
        }
      } else {
        triggerHaptic('error');
        alert('Order placement failed: ' + (data.error || 'Please try again'));
      }
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
      alert('Network error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) return;

    setTrackingLoading(true);
    setTrackError('');
    setTrackedOrder(null);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        const found = data.orders.find((o: Order) => o.id.toLowerCase() === trackOrderId.trim().toLowerCase());
        if (found) {
          setTrackedOrder(found);
          triggerHaptic('success');
        } else {
          setTrackError(`Order "${trackOrderId.trim()}" was not found.`);
          triggerHaptic('error');
        }
      }
    } catch (err) {
      setTrackError('Failed to fetch order status. Please check your connection.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 25;
      case 'PROCESSING': return 50;
      case 'SHIPPED': return 75;
      case 'DELIVERED': return 100;
      default: return 15;
    }
  };

  return (
    <>
      {/* Inject Telegram WebApp SDK Script */}
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive" 
      />

      <div className="min-h-screen bg-[#0c0d12] flex justify-center text-white font-sans select-none antialiased">
        <div className="w-full max-w-md bg-[#12141b] border-x border-[var(--line)] min-h-screen flex flex-col shadow-2xl relative">
          
          {/* Header */}
          <div className="sticky top-0 z-30 bg-[#0c0d12]/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-white text-black flex items-center justify-center font-khmer text-[12px] font-bold leading-none select-none">
                ន
              </span>
              <div>
                <h1 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                  <span>NovaMart</span>
                  <span className="text-[10px] text-[var(--accent-purple)] font-normal">/ TMA</span>
                </h1>
                <p className="text-[10px] font-mono text-[var(--subtle)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse"></span>
                  <span>Phnom Penh & 25 Provinces</span>
                </p>
              </div>
            </div>

            {/* Telegram User Indicator */}
            <div className="flex items-center gap-2">
              {tgUser ? (
                <div className="px-2 py-0.5 border border-sky-400/30 bg-sky-950/20 text-sky-400 text-[10px] font-mono flex items-center gap-1">
                  <span>@{tgUser.username || tgUser.first_name}</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[10px] font-mono text-[var(--muted)]">
                  Telegram Store
                </span>
              )}
            </div>
          </div>

          {/* Navigation Segment Tabs */}
          <div className="grid grid-cols-3 border-b border-[var(--line)] bg-[#0c0d12] text-xs font-mono">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('store');
              }}
              className={`py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'store'
                  ? 'border-white text-white font-bold bg-white/5'
                  : 'border-transparent text-[var(--muted)] hover:text-white'
              }`}
            >
              <span>🛍️ Store</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('cart');
              }}
              className={`py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'cart'
                  ? 'border-white text-white font-bold bg-white/5'
                  : 'border-transparent text-[var(--muted)] hover:text-white'
              }`}
            >
              <span>🛒 Cart</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-black text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('track');
              }}
              className={`py-2.5 border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'track'
                  ? 'border-white text-white font-bold bg-white/5'
                  : 'border-transparent text-[var(--muted)] hover:text-white'
              }`}
            >
              <span>🔍 Track</span>
            </button>
          </div>

          {/* Dynamic Content Views */}
          <div className="flex-1 p-4 pb-24 overflow-y-auto space-y-4">
            
            {/* 1. STORE VIEW */}
            {activeTab === 'store' && (
              <div className="space-y-4">
                
                {/* Search Input Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search hardware, audio, SKU..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white placeholder-[var(--subtle)] font-mono focus:outline-none focus:border-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--subtle)] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCategory(cat);
                      }}
                      className={`px-3 py-1 flex-shrink-0 border transition ${
                        selectedCategory === cat
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-[var(--line)] bg-[var(--card-bg-subtle)] text-[var(--muted)] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products List */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="h-24 border border-[var(--line)] bg-[var(--card-bg)] animate-pulse" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-12 border border-[var(--line)] bg-[var(--card-bg)] text-center space-y-2">
                    <p className="text-xs font-mono text-[var(--subtle)]">[ NO_PRODUCTS_FOUND ]</p>
                    <p className="text-[11px] text-[var(--muted)]">Try adjusting your search query or category.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map(p => {
                      const inCart = cart.find(i => i.product.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="p-3 border border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--line-strong)] transition flex gap-3 items-center"
                        >
                          {/* Image */}
                          <div className="relative w-16 h-16 flex-shrink-0 bg-black/50 border border-[var(--line)] overflow-hidden">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono px-1 text-[var(--accent-purple)]">
                              {p.category}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-[var(--subtle)]">{p.sku}</span>
                              <span className="text-xs font-mono font-bold text-white">${p.price.toFixed(2)}</span>
                            </div>
                            <h3 className="text-xs font-bold text-white truncate">{p.name}</h3>
                            <p className="text-[10px] text-[var(--muted)] line-clamp-1">{p.description}</p>
                            <span className="inline-block text-[9px] font-mono text-[var(--accent-green)]">
                              ● {p.stock > 0 ? `In Stock (${p.stock})` : 'Sold out'}
                            </span>
                          </div>

                          {/* Action Controller */}
                          <div className="flex-shrink-0">
                            {inCart ? (
                              <div className="flex items-center border border-white bg-[#0c0d12]">
                                <button
                                  onClick={() => updateQty(p.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                                  aria-label="Decrease"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-mono font-bold px-1.5 text-white">
                                  {inCart.quantity}
                                </span>
                                <button
                                  onClick={() => updateQty(p.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                                  aria-label="Increase"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(p)}
                                disabled={p.stock <= 0}
                                className="px-3 py-1.5 bg-white text-black text-[11px] font-mono font-bold hover:bg-slate-200 transition disabled:opacity-40"
                              >
                                + Buy
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* 2. CART & CHECKOUT VIEW */}
            {activeTab === 'cart' && (
              <div className="space-y-4">
                
                {createdOrder ? (
                  /* Order Success Confirmation */
                  <div className="p-6 border border-[var(--line)] bg-[var(--card-bg)] text-center space-y-4 my-6">
                    <div className="w-12 h-12 bg-white text-black flex items-center justify-center mx-auto font-bold font-mono text-xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-mono text-white">Order Confirmed!</h3>
                      <p className="text-xs font-mono text-[var(--accent-green)] mt-1">
                        Order ID: #{createdOrder.id}
                      </p>
                    </div>

                    <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] text-left text-xs font-mono space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Customer:</span>
                        <span className="text-white font-bold">{createdOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Phone:</span>
                        <span className="text-white font-mono">{createdOrder.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Total Amount:</span>
                        <span className="text-white font-bold">${createdOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Payment:</span>
                        <span className="text-[var(--accent-green)] font-semibold">Cash on Delivery</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--line)] leading-relaxed">
                        Address: {createdOrder.customerAddress}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Our dispatch team will contact your phone before courier arrival.
                    </p>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setTrackedOrder(createdOrder);
                          setActiveTab('track');
                        }}
                        className="w-full py-2.5 bg-white text-black font-mono text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Track Delivery Status →
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setCreatedOrder(null);
                          setActiveTab('store');
                        }}
                        className="w-full py-2.5 border border-[var(--line)] text-white hover:bg-white hover:text-black font-mono text-xs font-bold transition"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                ) : cart.length === 0 ? (
                  /* Empty Cart */
                  <div className="p-12 border border-[var(--line)] bg-[var(--card-bg)] text-center space-y-3 my-8">
                    <p className="text-xs font-mono text-[var(--subtle)]">[ YOUR_CART_IS_EMPTY ]</p>
                    <p className="text-xs text-[var(--muted)]">Browse our store and pick high-grade hardware to add to your cart.</p>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveTab('store');
                      }}
                      className="mt-3 px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition"
                    >
                      Browse Products →
                    </button>
                  </div>
                ) : (
                  /* Cart Items & Checkout Form */
                  <div className="space-y-5">
                    
                    {/* Items Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                      <span className="text-xs font-mono font-bold text-white">Your Items ({totalItems})</span>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setCart([]);
                        }}
                        className="text-[10px] font-mono text-[var(--subtle)] hover:text-red-400"
                      >
                        Clear Cart
                      </button>
                    </div>

                    {/* Items List */}
                    <div className="border border-[var(--line)] bg-[var(--card-bg)] divide-y divide-[var(--line)] text-xs">
                      {cart.map(item => (
                        <div key={item.product.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white truncate">{item.product.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                              <span className="text-[var(--subtle)]">${item.product.price.toFixed(2)}</span>
                              <span className="text-[var(--muted)]">x {item.quantity}</span>
                              <span className="text-white font-bold">
                                = ${(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center border border-[var(--line)] bg-[#0c0d12]">
                            <button
                              onClick={() => updateQty(item.product.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.product.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Summary Row */}
                      <div className="p-3 bg-[var(--card-bg-subtle)] space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-[var(--muted)]">
                          <span>Subtotal:</span>
                          <span className="text-white">${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[var(--muted)]">
                          <span>Express Delivery:</span>
                          <span className="text-[var(--accent-green)] font-semibold">FREE</span>
                        </div>
                        <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-[var(--line)]">
                          <span>Total to Pay:</span>
                          <span>${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Form */}
                    <form onSubmit={handlePlaceOrder} className="space-y-4 pt-2">
                      <div className="text-xs font-mono font-bold text-white pb-2 border-b border-[var(--line)] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>Delivery Destination</span>
                      </div>

                      {/* Region Selector */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setDeliveryRegion('phnom_penh');
                          }}
                          className={`p-2.5 border text-left transition ${
                            deliveryRegion === 'phnom_penh'
                              ? 'border-white bg-white/10 text-white font-bold'
                              : 'border-[var(--line)] text-[var(--muted)] hover:border-white/40'
                          }`}
                        >
                          <span className="block text-white">📍 Phnom Penh</span>
                          <span className="text-[10px] text-[var(--subtle)]">1–2 Hours Express</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setDeliveryRegion('province');
                          }}
                          className={`p-2.5 border text-left transition ${
                            deliveryRegion === 'province'
                              ? 'border-white bg-white/10 text-white font-bold'
                              : 'border-[var(--line)] text-[var(--muted)] hover:border-white/40'
                          }`}
                        >
                          <span className="block text-white">🚚 All Provinces</span>
                          <span className="text-[10px] text-[var(--subtle)]">24–48h Virak Buntham/J&T</span>
                        </button>
                      </div>

                      {/* Name Field */}
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder="e.g. Sovandara Rith"
                          className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-white font-mono"
                        />
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                          Phone Number (for Courier Dispatch)
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 099 944 923"
                          className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-white font-mono"
                        />
                      </div>

                      {/* Street Address */}
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                          {deliveryRegion === 'phnom_penh' ? 'Street, Sangkat, Khan / Landmark' : 'Province, District, & Nearest Branch'}
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={customerAddress}
                          onChange={e => setCustomerAddress(e.target.value)}
                          placeholder={deliveryRegion === 'phnom_penh' ? 'e.g. Street 2004, Sangkat Teuk Thla, near Northbridge' : 'e.g. Siem Reap town, near Virak Buntham branch'}
                          className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-white font-mono"
                        />
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                          Payment Option
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setPaymentMethod('COD');
                            }}
                            className={`p-2.5 border text-left transition ${
                              paymentMethod === 'COD'
                                ? 'border-white bg-white/10 text-white font-bold'
                                : 'border-[var(--line)] text-[var(--muted)] hover:border-white/40'
                            }`}
                          >
                            <span className="block text-white">💵 Cash on Delivery</span>
                            <span className="text-[10px] text-[var(--subtle)]">Pay when parcel arrives</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setPaymentMethod('KHQR');
                            }}
                            className={`p-2.5 border text-left transition ${
                              paymentMethod === 'KHQR'
                                ? 'border-white bg-white/10 text-white font-bold'
                                : 'border-[var(--line)] text-[var(--muted)] hover:border-white/40'
                            }`}
                          >
                            <span className="block text-white">📱 ABA KHQR</span>
                            <span className="text-[10px] text-[var(--subtle)]">Scan upon receipt</span>
                          </button>
                        </div>
                      </div>

                      {/* Submit Order Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg"
                      >
                        {submitting ? 'Placing Order...' : `Confirm Order ($${totalAmount.toFixed(2)}) →`}
                      </button>
                    </form>

                  </div>
                )}

              </div>
            )}

            {/* 3. TRACKING VIEW */}
            {activeTab === 'track' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Real-time Parcel Tracking</span>
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Enter your Order ID (e.g. <span className="font-mono text-white">ORD-23358</span>) to check status.
                  </p>
                </div>

                {/* Tracking Search Input */}
                <form onSubmit={handleSearchOrder} className="flex gap-2">
                  <input
                    type="text"
                    value={trackOrderId}
                    onChange={e => setTrackOrderId(e.target.value)}
                    placeholder="Enter ORD-XXXXX"
                    className="flex-1 px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-white font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading || !trackOrderId.trim()}
                    className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    {trackingLoading ? 'Searching...' : 'Track'}
                  </button>
                </form>

                {trackError && (
                  <div className="p-3 border border-red-500/30 bg-red-950/20 text-red-400 text-xs font-mono">
                    {trackError}
                  </div>
                )}

                {trackedOrder && (
                  <div className="p-4 border border-[var(--line)] bg-[var(--card-bg)] space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--subtle)]">ORDER ID</span>
                        <h4 className="text-sm font-bold font-mono text-white">#{trackedOrder.id}</h4>
                      </div>
                      <span className="px-2 py-0.5 border border-sky-400/30 bg-sky-950/20 text-sky-400 text-xs font-mono font-bold">
                        {trackedOrder.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-[#0c0d12] border border-[var(--line)] h-2 overflow-hidden">
                        <div 
                          className="bg-white h-full transition-all duration-500"
                          style={{ width: `${getStatusProgress(trackedOrder.status)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-[var(--subtle)]">
                        <span>Confirmed</span>
                        <span>Packing</span>
                        <span>Dispatched</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    {/* Details Table */}
                    <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] text-xs font-mono space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Recipient:</span>
                        <span className="text-white">{trackedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Phone:</span>
                        <span className="text-white">{trackedOrder.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--subtle)]">Total Amount:</span>
                        <span className="text-white font-bold">${trackedOrder.totalAmount.toFixed(2)} ({trackedOrder.paymentMethod})</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                        Destination: {trackedOrder.customerAddress}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-[var(--subtle)] uppercase">Items:</span>
                      <div className="divide-y divide-[var(--line)] border border-[var(--line)] text-xs">
                        {trackedOrder.items.map((i, idx) => (
                          <div key={idx} className="p-2 flex justify-between items-center">
                            <span className="text-white truncate max-w-[200px]">{i.productName} (x{i.quantity})</span>
                            <span className="font-mono text-[var(--muted)]">${i.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* Sticky Quick Cart Bottom Bar (when in Store mode & cart has items) */}
          {activeTab === 'store' && cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-[#0c0d12]/95 backdrop-blur-md border-t border-[var(--line)] flex items-center justify-between z-40">
              <div>
                <span className="text-[9px] font-mono text-[var(--subtle)] block">
                  Total ({totalItems} items)
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveTab('cart');
                }}
                className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition flex items-center gap-1.5 shadow-lg"
              >
                <span>Checkout Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
