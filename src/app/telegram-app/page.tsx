'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { ShoppingBag, ArrowLeft, Send, CheckCircle2, Minus, Plus } from 'lucide-react';
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
    // Check for Telegram WebApp environment
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
      alert('Please fill in name and delivery address');
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
          notes: `Placed via Telegram Mini App (TMA). User ID: ${tgUser?.id || 'Browser Preview'}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder(data.order);
        setStep('success');

        // If running inside Telegram WebApp, notify Telegram
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
    <div className="min-h-screen bg-slate-100 flex justify-center py-6 px-4">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[640px]">
        {/* Telegram App Header */}
        <div className="bg-[#242f3d] text-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            {step !== 'catalog' ? (
              <button
                onClick={() => setStep('catalog')}
                className="p-1 rounded-full text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center text-white font-bold text-xs">
                <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold leading-tight">NovaMart Mini App</h2>
              <p className="text-[10px] text-sky-400">Telegram In-App Storefront</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'catalog' && (
              <button
                onClick={() => cart.length > 0 && setStep('checkout')}
                className="relative p-2 rounded-xl bg-slate-800 text-white"
              >
                <ShoppingBag className="w-4 h-4 text-sky-300" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Telegram User Notice */}
        <div className="bg-sky-50 px-4 py-2 border-b border-sky-100 text-[11px] text-sky-800 flex items-center justify-between">
          <span>{tgUser ? `Logged in as @${tgUser.username || tgUser.first_name}` : 'Running in Telegram WebApp Mode'}</span>
          <span className="font-semibold text-sky-600">Zero App Install</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-base">Shop Inside Telegram</h3>
                <p className="text-xs text-sky-100 mt-1">
                  Enjoy the full native e-commerce store experience directly in your chat messenger.
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map(p => {
                    const inCart = cart.find(i => i.product.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition items-center"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                          <span className="text-xs font-extrabold text-indigo-600 mt-1 block">
                            ${p.price.toFixed(2)}
                          </span>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
                            <button
                              onClick={() => updateQty(p.id, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                            <button
                              onClick={() => updateQty(p.id, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Review & Shipping</h3>

              {/* Items in cart */}
              <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {cart.map(i => (
                  <div key={i.product.id} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">
                      {i.product.name} (x{i.quantity})
                    </span>
                    <span className="font-bold text-slate-900">
                      ${(i.product.price * i.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Input fields */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Delivery Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-[11px] text-sky-800">
                💵 Payment: <strong>Cash on Delivery (COD)</strong> upon package receipt.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#2AABEE] text-white font-bold rounded-xl text-xs hover:bg-[#229ED9] transition shadow-md disabled:opacity-50"
              >
                {submitting ? 'Placing Order...' : `Confirm & Place Order ($${totalAmount.toFixed(2)})`}
              </button>
            </form>
          )}

          {step === 'success' && createdOrder && (
            <div className="text-center py-10 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Order Placed in Telegram!</h3>
              <p className="text-xs text-slate-600">
                Order Reference: <strong className="font-mono text-slate-900">#{createdOrder.id}</strong>
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-200 text-xs space-y-1.5">
                <p><span className="text-slate-400">Total:</span> <strong>${createdOrder.totalAmount.toFixed(2)}</strong></p>
                <p><span className="text-slate-400">Customer:</span> {createdOrder.customerName}</p>
                <p><span className="text-slate-400">Shipping to:</span> {createdOrder.customerAddress}</p>
                <p><span className="text-slate-400">Channel:</span> <span className="font-bold text-sky-600 uppercase">Telegram Mini App</span></p>
              </div>

              <button
                onClick={() => {
                  setCart([]);
                  setStep('catalog');
                }}
                className="w-full bg-[#242f3d] text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                Back to Store
              </button>
            </div>
          )}
        </div>

        {/* Footer sticky checkout bar for catalog */}
        {step === 'catalog' && cart.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Cart Total</span>
              <span className="text-sm font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setStep('checkout')}
              className="px-5 py-2.5 bg-[#2AABEE] text-white rounded-xl text-xs font-bold hover:bg-[#229ED9] transition shadow-md flex items-center gap-1.5"
            >
              <span>Checkout ({totalItems})</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
