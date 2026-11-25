'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, OrderItem } from '@/lib/types';

interface CartItem extends OrderItem {
  image?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toastMessage: string | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('novamart_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('novamart_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3200);
  };

  const dismissToast = () => {
    setToastMessage(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * item.unitPrice
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          image: product.image
        }
      ];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        toastMessage,
        dismissToast
      }}
    >
      {children}

      {/* Non-intrusive KhmerKit Add-to-Cart Toast */}
      {toastMessage && !isCartOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#0c0d12] border border-white/25 shadow-2xl px-4 py-3 flex items-center gap-3 font-mono text-xs text-white animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] flex-shrink-0" />
          <span className="truncate max-w-[200px]">{toastMessage}</span>
          <button
            onClick={() => {
              dismissToast();
              setIsCartOpen(true);
            }}
            className="px-2.5 py-1 bg-white text-black font-bold hover:bg-slate-200 transition flex-shrink-0"
          >
            VIEW CART →
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
