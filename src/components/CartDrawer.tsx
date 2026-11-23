'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, MessageSquare, Check, ArrowRight, ShieldCheck } from 'lucide-react';

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
      alert('Please fill in your name, phone number, and delivery address.');
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
          notes: 'Web store order'
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
        clearCart();
        setIsCheckingOut(false);
      } else {
        alert('Checkout error: ' + (data.error || 'Please try again.'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error placing order');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const businessPhone = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '85599944923').replace(/[^0-9]/g, '');
    let text = `Hello NovaMart! 🛍️\nI would like to order the following items from your website:\n\n`;

    cart.forEach(item => {
      text += `• ${item.productName} (x${item.quantity}) — $${(item.unitPrice * item.quantity).toFixed(2)}\n`;
    });

    text += `\nTotal: $${totalAmount.toFixed(2)}\n`;
    if (customerName) text += `Name: ${customerName}\n`;
    if (customerAddress) text += `Address: ${customerAddress}\n`;
    text += `\nPlease confirm availability and delivery. Thank you!`;

    const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleTelegramOrder = () => {
    const botUser = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'nova123456789_bot').replace(/^@/, '');
    const url = `https://t.me/${botUser}?start=catalog`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm transition-opacity font-sans text-white">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-md bg-[#0c0d12] border-l border-[var(--line)] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[#12141b]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-khmer text-[11px] font-bold leading-none select-none">
                ន
              </span>
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                Your Shopping Cart
              </h2>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckingOut(false);
                setOrderSuccess(null);
              }}
              className="p-1 border border-[var(--line)] hover:border-white text-[var(--muted)] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {orderSuccess ? (
              <div className="p-6 border border-[var(--line)] bg-[var(--card-bg)] text-center space-y-4 my-8">
                <div className="w-10 h-10 bg-white text-black flex items-center justify-center mx-auto font-bold font-mono">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-white">Order Placed</h3>
                  <p className="text-xs font-mono text-[var(--accent-green)] mt-1">
                    Order ID: #{orderSuccess.id}
                  </p>
                </div>

                <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] text-left text-xs font-mono space-y-1.5">
                  <p className="flex justify-between"><span className="text-[var(--subtle)]">Customer:</span> <span className="font-bold text-white">{orderSuccess.customerName}</span></p>
                  <p className="flex justify-between"><span className="text-[var(--subtle)]">Total:</span> <span className="font-bold text-white">${orderSuccess.totalAmount.toFixed(2)}</span></p>
                  <p className="flex justify-between"><span className="text-[var(--subtle)]">Payment:</span> <span>{orderSuccess.paymentMethod}</span></p>
                  <p className="flex justify-between"><span className="text-[var(--subtle)]">Shipping to:</span> <span className="truncate max-w-[180px]">{orderSuccess.customerAddress}</span></p>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Thank you! Our courier will call your phone before arriving.
                </p>

                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setIsCartOpen(false);
                  }}
                  className="w-full py-2.5 bg-white text-black font-mono text-xs font-bold hover:bg-slate-200 transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-24 space-y-3">
                <p className="font-mono text-xs text-[var(--subtle)]">[ Your cart is empty ]</p>
                <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                  Browse our catalog and add products, or purchase directly via Telegram and WhatsApp.
                </p>
              </div>
            ) : isCheckingOut ? (
              <form onSubmit={handleWebCheckout} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-xs font-mono font-bold text-white">Shipping Details</span>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="text-[11px] font-mono text-[var(--accent-purple)] hover:underline"
                  >
                    ← Back to items
                  </button>
                </div>

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
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
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
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Street, Sangkat, Khan / Province"
                    className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-[var(--line-strong)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--subtle)] uppercase mb-1">
                    Payment Option
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-2.5 border text-center transition ${
                        paymentMethod === 'COD'
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-[var(--line)] text-[var(--muted)] hover:border-white'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-2.5 border text-center transition ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-[var(--line)] text-[var(--muted)] hover:border-white'
                      }`}
                    >
                      ABA / KHQR
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--line)] space-y-3">
                  <div className="flex justify-between font-mono font-bold text-sm">
                    <span>Total Amount:</span>
                    <span className="text-white">${totalAmount.toFixed(2)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Place Order ($${totalAmount.toFixed(2)}) →`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.productId}
                    className="p-3 border border-[var(--line)] bg-[var(--card-bg)] flex gap-3 items-center"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 object-cover border border-[var(--line)] bg-black/40 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.productName}</h4>
                      <p className="text-[10px] font-mono text-[var(--subtle)]">${item.unitPrice.toFixed(2)} each</p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-5 h-5 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-5 h-5 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end self-stretch">
                      <span className="text-xs font-mono font-bold text-white">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[var(--subtle)] hover:text-rose-400 text-[10px] font-mono"
                      >
                        [Remove]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Action Footer */}
          {!orderSuccess && !isCheckingOut && cart.length > 0 && (
            <div className="p-6 bg-[#12141b] border-t border-[var(--line)] space-y-3">
              <div className="flex justify-between items-center font-mono font-bold text-sm">
                <span className="text-[var(--subtle)]">Subtotal:</span>
                <span className="text-white">${totalAmount.toFixed(2)}</span>
              </div>

              {/* Standard Web Checkout */}
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full py-2.5 bg-white text-black font-mono font-bold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <span>Checkout on Web →</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[var(--line)]"></div>
                <span className="flex-shrink mx-2 text-[9px] font-mono text-[var(--subtle)] uppercase">
                  Or Order via Chat
                </span>
                <div className="flex-grow border-t border-[var(--line)]"></div>
              </div>

              {/* WhatsApp Checkout */}
              <button
                onClick={handleWhatsAppOrder}
                className="w-full py-2 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-[#25D366] text-[#25D366] font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send Cart to WhatsApp</span>
              </button>

              {/* Telegram Checkout */}
              <button
                onClick={handleTelegramOrder}
                className="w-full py-2 bg-[var(--card-bg-subtle)] border border-[var(--line)] hover:border-sky-400 text-sky-400 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Telegram Bot</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
