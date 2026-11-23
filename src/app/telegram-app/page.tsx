'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { ShoppingBag, ArrowLeft, Send, Check, Minus, Plus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TelegramMiniApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'catalog' | 'checkout' | 'success'>('catalog');
  const [tgUser, setTgUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check Telegram WebApp environment
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setTgUser(u);
        setName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
      }
    }

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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      alert('Please fill in your name and delivery address');
      return;
    }

    setSubmitting(true);
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
          customerName: name,
          customerPhone: phone || tgUser?.username || 'Telegram User',
          customerAddress: address,
          items: orderItems,
          totalAmount,
          channel: 'telegram',
          paymentMethod: 'COD',
          notes: `Placed via Telegram Mini App. User: ${tgUser?.username || tgUser?.first_name || 'Browser Preview'}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder(data.order);
        setStep('success');

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
      }
    } catch (err) {
      console.error(err);
      alert('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] flex justify-center py-4 sm:py-8 px-2 sm:px-4 text-white font-sans">
      
      {/* Mini App Shell Container */}
      <div className="w-full max-w-md bg-[#12141b] border border-[var(--line)] overflow-hidden flex flex-col min-h-[640px] shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#0c0d12] border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step !== 'catalog' ? (
              <button
                onClick={() => setStep('catalog')}
                className="p-1 border border-[var(--line)] hover:border-white text-[var(--muted)] hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <span className="w-6 h-6 bg-white text-black flex items-center justify-center font-khmer text-[12px] font-bold leading-none select-none">
                ន
              </span>
            )}
            <div>
              <h2 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                <span>NovaMart Store</span>
              </h2>
              <p className="text-[10px] font-mono text-[var(--subtle)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></span>
                <span>Phnom Penh & Provincial Delivery</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'catalog' && (
              <button
                onClick={() => cart.length > 0 && setStep('checkout')}
                className="px-2.5 py-1 bg-white text-black text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-200 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{totalItems}</span>
              </button>
            )}
          </div>
        </div>

        {/* User Status Bar */}
        <div className="bg-[var(--card-bg-subtle)] border-b border-[var(--line)] px-4 py-1.5 text-[10px] font-mono text-[var(--muted)] flex items-center justify-between">
          <span>{tgUser ? `Logged in as @${tgUser.username || tgUser.first_name}` : 'Telegram In-App Checkout'}</span>
          <span className="text-[var(--accent-green)] font-semibold">Cash on Delivery</span>
        </div>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {step === 'catalog' && (
            <div className="space-y-4">
              
              {/* Products List */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-20 border border-[var(--line)] bg-[var(--card-bg)] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {products.map(p => {
                    const inCart = cart.find(i => i.product.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 border border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--line-strong)] transition flex gap-3 items-center"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-14 h-14 object-cover border border-[var(--line)] bg-black/40 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-[var(--subtle)]">{p.sku}</span>
                            <span className="text-xs font-mono font-bold text-white">${p.price.toFixed(2)}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                          <p className="text-[10px] text-[var(--muted)] line-clamp-1">{p.description}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex-shrink-0">
                          {inCart ? (
                            <div className="flex items-center border border-[var(--line)] bg-[#0c0d12]">
                              <button
                                onClick={() => updateQty(p.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-bold px-1.5">{inCart.quantity}</span>
                              <button
                                onClick={() => updateQty(p.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              className="px-2.5 py-1.5 bg-white text-black text-[11px] font-mono font-bold hover:bg-slate-200 transition"
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

          {step === 'checkout' && (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-xs font-mono font-bold text-white">Order Items</span>
                <span className="text-[10px] font-mono text-[var(--subtle)]">{cart.length} items</span>
              </div>

              {/* Items Table */}
              <div className="border border-[var(--line)] bg-[var(--card-bg)] divide-y divide-[var(--line)] text-xs">
                {cart.map(i => (
                  <div key={i.product.id} className="p-2.5 flex justify-between items-center">
                    <span className="truncate max-w-[200px] text-[var(--muted)]">
                      {i.product.name} (x{i.quantity})
                    </span>
                    <span className="font-mono font-bold text-white">
                      ${(i.product.price * i.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-[var(--card-bg-subtle)] flex justify-between items-center font-bold font-mono">
                  <span>Total Amount:</span>
                  <span className="text-base text-white">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-[var(--line-strong)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 099 944 923"
                    className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-[var(--line-strong)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street, Sangkat, Khan / Province"
                    className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-[var(--line-strong)] font-mono"
                  />
                </div>

                <div className="p-2.5 border border-[var(--line)] bg-[var(--card-bg-subtle)] text-[11px] font-mono text-[var(--muted)] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  <span>Payment: Cash on Delivery (COD) or ABA KHQR</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-white text-black font-bold font-mono text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Placing Order...' : `Confirm Order ($${totalAmount.toFixed(2)}) →`}
              </button>
            </form>
          )}

          {step === 'success' && createdOrder && (
            <div className="p-6 border border-[var(--line)] bg-[var(--card-bg)] text-center space-y-4 my-auto">
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center mx-auto font-bold font-mono">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-white">Order Received</h3>
                <p className="text-xs font-mono text-[var(--accent-green)] mt-1">
                  Order ID: #{createdOrder.id}
                </p>
              </div>

              <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] text-left text-xs font-mono space-y-1.5">
                <p className="flex justify-between"><span className="text-[var(--subtle)]">Customer:</span> <span className="text-white">{createdOrder.customerName}</span></p>
                <p className="flex justify-between"><span className="text-[var(--subtle)]">Phone:</span> <span className="text-white">{createdOrder.customerPhone}</span></p>
                <p className="flex justify-between"><span className="text-[var(--subtle)]">Total:</span> <span className="font-bold text-white">${createdOrder.totalAmount.toFixed(2)}</span></p>
                <p className="flex justify-between"><span className="text-[var(--subtle)]">Payment:</span> <span>Cash on Delivery</span></p>
              </div>

              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Our dispatch team will contact your phone before arriving with your parcel.
              </p>

              <button
                onClick={() => {
                  setCart([]);
                  setStep('catalog');
                }}
                className="w-full py-2.5 border border-[var(--line)] text-white hover:bg-white hover:text-black font-mono text-xs font-bold transition"
              >
                Return to Shop
              </button>
            </div>
          )}

        </div>

        {/* Sticky Cart Footer for Catalog view */}
        {step === 'catalog' && cart.length > 0 && (
          <div className="p-3 bg-[#0c0d12] border-t border-[var(--line)] flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono text-[var(--subtle)] block">Cart Total</span>
              <span className="text-sm font-mono font-bold text-white">${totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setStep('checkout')}
              className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <span>Checkout ({totalItems})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
