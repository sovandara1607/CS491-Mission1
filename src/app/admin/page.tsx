'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderChannel } from '@/lib/types';
import {
  Send,
  Globe,
  Search,
  RefreshCw,
  Bell
} from 'lucide-react';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'telegram' | 'web'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setSelectedOrder(prev => {
          if (!prev) return null;
          return data.orders.find((o: Order) => o.id === prev.id) || prev;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        setFeedback({
          type: 'ok',
          msg: data.telegramNotified
            ? `Updated #${orderId} to ${newStatus} • Customer notified on Telegram`
            : `Updated #${orderId} to ${newStatus}`
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'err', msg: data.error || 'Failed to update status' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'err', msg: 'Network error updating status' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const webOrders = orders.filter(o => o.channel === 'web');
  const tgOrders = orders.filter(o => o.channel === 'telegram');

  const filteredOrders = orders.filter(order => {
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
      order.customerAddress.toLowerCase().includes(search.toLowerCase());
    return matchesChannel && matchesStatus && matchesSearch;
  });

  const getChannelBadge = (channel: OrderChannel) => {
    switch (channel) {
      case 'telegram':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-sky-400/30 text-sky-400 bg-sky-950/20">
            <Send className="w-2.5 h-2.5" />
            <span>TELEGRAM</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-white/20 text-white bg-white/5">
            <Globe className="w-2.5 h-2.5" />
            <span>WEB</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-blue-400/30 text-blue-400 bg-blue-950/20">CONFIRMED</span>;
      case 'PROCESSING':
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-amber-400/30 text-amber-400 bg-amber-950/20">PROCESSING</span>;
      case 'SHIPPED':
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-purple-400/30 text-purple-400 bg-purple-950/20">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-emerald-400/30 text-emerald-400 bg-emerald-950/20">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-rose-400/30 text-rose-400 bg-rose-950/20">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-zinc-500/30 text-zinc-400 bg-zinc-900/40">PENDING</span>;
    }
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-khmer text-[11px] font-bold leading-none select-none">
              ន
            </span>
            <span className="kk-tag">SYSTEM // OPERATIONS CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Omnichannel Orders
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono">
            Real-time feed across Web Store and Telegram Bot & Mini App. Status changes automatically push Telegram alerts.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="kk-btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Status Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 border text-xs font-mono flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-300'
              : 'border-rose-400/40 bg-rose-950/30 text-rose-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--line)] bg-[var(--card-bg)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
        <div className="p-5 space-y-1">
          <span className="kk-tag">TOTAL REVENUE</span>
          <p className="text-2xl font-bold font-mono text-white">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-[10px] text-[var(--subtle)] font-mono">{orders.length} orders total</p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">TELEGRAM CHANNEL</span>
          <p className="text-2xl font-bold font-mono text-sky-400">
            {tgOrders.length}
          </p>
          <p className="text-[10px] text-[var(--subtle)] font-mono">
            ${tgOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} via Bot & TMA
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">WEB CHANNEL</span>
          <p className="text-2xl font-bold font-mono text-white">
            {webOrders.length}
          </p>
          <p className="text-[10px] text-[var(--subtle)] font-mono">
            ${webOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} on web store
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">FULFILLMENT</span>
          <p className="text-2xl font-bold font-mono text-[var(--accent-green)]">
            {orders.filter(o => o.status === 'DELIVERED').length} / {orders.length}
          </p>
          <p className="text-[10px] text-[var(--subtle)] font-mono">Delivered packages</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[var(--subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Order ID, customer, phone, address..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white placeholder-[var(--subtle)] font-mono focus:outline-none focus:border-[var(--line-strong)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[var(--line)] bg-[var(--card-bg-subtle)]">
            {(['all', 'telegram', 'web'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 text-xs font-mono uppercase transition ${
                  channelFilter === ch
                    ? 'bg-white text-black font-bold'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--input-bg)] border border-[var(--line)] text-white focus:outline-none focus:border-[var(--line-strong)]"
          >
            <option value="all">ALL STATUSES</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Master/Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Orders List */}
        <div className="lg:col-span-7 border border-[var(--line)] bg-[var(--card-bg)] divide-y divide-[var(--line)]">
          <div className="p-3 bg-[var(--card-bg-subtle)] border-b border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--subtle)]">
            <span>ORDERS FEED ({filteredOrders.length})</span>
            <span>CLICK TO INSPECT</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[var(--subtle)] space-y-2">
              <p>[ NO_ORDERS_MATCHING_FILTER ]</p>
              <p className="text-[11px] text-[var(--muted)]">Orders from Telegram and Web will appear here in real-time.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 transition cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white/5 border-l-2 border-l-white'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-white">#{order.id}</span>
                      {getChannelBadge(order.channel)}
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                      <span className="font-bold text-white truncate">{order.customerName}</span>
                      <span className="text-[var(--subtle)]">•</span>
                      <span className="font-mono">{order.customerPhone}</span>
                    </div>

                    <p className="text-[11px] text-[var(--subtle)] font-mono truncate max-w-sm">
                      {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="font-mono font-bold text-sm text-white">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--subtle)]">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Order Detail Inspector */}
        <div className="lg:col-span-5 border border-[var(--line)] bg-[var(--card-bg)] sticky top-24">
          <div className="p-4 bg-[var(--card-bg-subtle)] border-b border-[var(--line)] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white">ORDER INSPECTOR</span>
            {selectedOrder && <span className="text-[var(--subtle)]">#{selectedOrder.id}</span>}
          </div>

          {selectedOrder ? (
            <div className="p-5 space-y-5 text-xs font-mono">
              
              {/* Status & Channel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <div>
                  <span className="text-[10px] text-[var(--subtle)] block">CHANNEL</span>
                  {getChannelBadge(selectedOrder.channel)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--subtle)] block">STATUS</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--subtle)] uppercase">Change Status:</span>
                  {selectedOrder.channelUserId && (
                    <span className="text-[10px] text-sky-400">Auto-notifies Telegram</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      disabled={updatingStatus || selectedOrder.status === st}
                      className={`py-1.5 px-2 border text-[11px] transition text-center ${
                        selectedOrder.status === st
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-[var(--line)] text-[var(--muted)] hover:border-white hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] space-y-2">
                <span className="text-[10px] text-[var(--subtle)] block uppercase">Shipping Recipient</span>
                <div className="space-y-1">
                  <p className="text-white font-bold">{selectedOrder.customerName}</p>
                  <p className="text-[var(--muted)]">Phone: {selectedOrder.customerPhone}</p>
                  <p className="text-[var(--muted)] leading-relaxed">
                    Address: {selectedOrder.customerAddress}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-[11px] text-[var(--accent-purple)] pt-1 border-t border-[var(--line)]">
                      Notes: {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[10px] text-[var(--subtle)] uppercase">Order Items:</span>
                <div className="border border-[var(--line)] divide-y divide-[var(--line)]">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <p className="text-white font-bold truncate">{item.productName}</p>
                        <p className="text-[10px] text-[var(--subtle)]">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-white flex-shrink-0">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-[var(--card-bg-subtle)] flex justify-between items-center font-bold">
                    <span>Total Amount:</span>
                    <span className="text-sm text-white">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-[10px] text-[var(--subtle)] pt-2 border-t border-[var(--line)] flex justify-between">
                <span>Created: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                <span>Payment: {selectedOrder.paymentMethod === 'BANK_TRANSFER' ? 'ABA KHQR' : selectedOrder.paymentMethod}</span>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-[var(--subtle)]">
              Select an order on the left to view customer details and update delivery status.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
