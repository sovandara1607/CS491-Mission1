'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount, isCartOpen, setIsCartOpen } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleWebCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Please fill in all shipping fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          items: cart,
          totalAmount,
          paymentMethod,
          channel: 'web',
          notes: 'Standard Web Order Checkout'
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
        clearCart();
        setIsCheckingOut(false);
      } else {
        alert('Checkout error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error placing order');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '14155550199';
    let text = `Hello NovaMart! 🛍️\nI would like to order the following items from your website:\n\n`;

    cart.forEach(item => {
      text += `• ${item.productName} (x${item.quantity}) - $${(item.unitPrice * item.quantity).toFixed(2)}\n`;
    });

    text += `\n💰 Total Amount: $${totalAmount.toFixed(2)}\n`;
    if (customerName) text += `👤 Customer: ${customerName}\n`;
    if (customerAddress) text += `📍 Address: ${customerAddress}\n`;
    text += `\nPlease confirm my order!`;

    const cleanPhone = businessPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleTelegramOrder = () => {
    const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'NovaMartShopBot';
    const url = `https://t.me/${botUser}?start=catalog`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold">Your Shopping Cart</h2>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckingOut(false);
                setOrderSuccess(null);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {orderSuccess ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-800">Order Placed Successfully!</h3>
                <p className="text-sm text-slate-600">
                  Your Order Reference is <span className="font-mono font-bold text-slate-900">#{orderSuccess.id}</span>
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200 text-sm space-y-2">
                  <p><span className="text-slate-500">Total:</span> <span className="font-semibold">${orderSuccess.totalAmount.toFixed(2)}</span></p>
                  <p><span className="text-slate-500">Payment:</span> {orderSuccess.paymentMethod}</p>
                  <p><span className="text-slate-500">Shipping to:</span> {orderSuccess.customerAddress}</p>
                  <p><span className="text-slate-500">Channel:</span> <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{orderSuccess.channel}</span></p>
                </div>
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setIsCartOpen(false);
                  }}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-800">Your cart is empty</h3>
                <p className="text-sm text-slate-500">
                  Explore our tech products and add items to your cart or purchase directly via Telegram & WhatsApp!
                </p>
              </div>
            ) : isCheckingOut ? (
              <form onSubmit={handleWebCheckout} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">Shipping & Checkout</h3>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Back to items
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Delivery Address</label>
                  <textarea
                    required
                    rows={3}
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Street, City, Postal Code"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-2.5 rounded-lg border text-center font-medium transition ${
                        paymentMethod === 'COD'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-2.5 rounded-lg border text-center font-medium transition ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total to Pay:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Place Order ($${totalAmount.toFixed(2)})`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 items-center"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{item.productName}</h4>
                      <p className="text-xs text-slate-500">${item.unitPrice.toFixed(2)} each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="block mt-2 text-rose-500 hover:text-rose-700 text-xs ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Omnichannel checkout options */}
          {!orderSuccess && !isCheckingOut && cart.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-base font-bold text-slate-900">
                <span>Subtotal:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              {/* Standard Web Checkout */}
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow"
              >
                <span>Standard Web Checkout</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink mx-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  No App Needed • Order via Chat
                </span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>

              {/* Omnichannel WhatsApp Option */}
              <button
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#25D366] text-white py-2.5 rounded-xl font-medium hover:bg-[#20ba5a] transition flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>1-Click Order via WhatsApp</span>
              </button>

              {/* Omnichannel Telegram Option */}
              <button
                onClick={handleTelegramOrder}
                className="w-full bg-[#229ED9] text-white py-2.5 rounded-xl font-medium hover:bg-[#1c8ec4] transition flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Order via Telegram Bot</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
