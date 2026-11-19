'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderChannel, OrderStatus } from '@/lib/types';
import { 
  ShoppingBag, 
  Send, 
  MessageSquare, 
  Globe, 
  Check, 
  RefreshCw, 
  Search, 
  Eye,
  X,
  ArrowUpRight
} from 'lucide-react';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<'all' | OrderChannel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const webOrders = orders.filter(o => o.channel === 'web');
  const tgOrders = orders.filter(o => o.channel === 'telegram');
  const waOrders = orders.filter(o => o.channel === 'whatsapp');

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
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-emerald-400/30 text-emerald-400 bg-emerald-950/20">
            <MessageSquare className="w-2.5 h-2.5" />
            <span>WHATSAPP</span>
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
        return <span className="px-2 py-0.5 text-[10px] font-mono border border-white/10 text-[var(--muted)]">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans text-white">
      
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--accent-green)]"></span>
            <span className="kk-tag">OPERATIONS // CENTRAL DISPATCH</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Order Management</h1>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="kk-btn-secondary text-xs self-start sm:self-auto font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>SYNC_ORDERS</span>
        </button>
      </div>

      {/* Metric Cards Matrix (KhmerKit Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--line)] bg-[var(--card-bg)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
        <div className="p-5 space-y-1">
          <span className="kk-tag">GROSS SALES</span>
          <div className="text-2xl font-mono font-bold text-white">
            ${totalRevenue.toFixed(2)}
          </div>
          <p className="text-[10px] font-mono text-[var(--subtle)]">
            {orders.length} TOTAL_ORDERS
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">TELEGRAM CHANNEL</span>
          <div className="text-2xl font-mono font-bold text-sky-400">
            {tgOrders.length}
          </div>
          <p className="text-[10px] font-mono text-[var(--subtle)]">
            ${tgOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} REVENUE
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">WHATSAPP CHANNEL</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {waOrders.length}
          </div>
          <p className="text-[10px] font-mono text-[var(--subtle)]">
            ${waOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} REVENUE
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="kk-tag">WEB CHANNEL</span>
          <div className="text-2xl font-mono font-bold text-white">
            {webOrders.length}
          </div>
          <p className="text-[10px] font-mono text-[var(--subtle)]">
            ${webOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} REVENUE
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 border border-[var(--line)] bg-[var(--card-bg)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[var(--subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white placeholder-[var(--subtle)] font-mono focus:outline-none focus:border-[var(--line-strong)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel selector */}
          <div className="flex items-center border border-[var(--line)] bg-[var(--card-bg-subtle)] text-xs font-mono">
            {(['all', 'telegram', 'whatsapp', 'web'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 uppercase transition ${
                  channelFilter === ch
                    ? 'bg-white text-black font-bold'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[var(--input-bg)] border border-[var(--line)] text-white font-mono focus:outline-none"
          >
            <option value="all">STATUS: ALL</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-[var(--line)] bg-[var(--card-bg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--card-bg-subtle)] text-[var(--subtle)] font-mono uppercase text-[10px] tracking-wider border-b border-[var(--line)]">
              <tr>
                <th className="px-5 py-3">ORDER_ID</th>
                <th className="px-5 py-3">CHANNEL</th>
                <th className="px-5 py-3">CUSTOMER</th>
                <th className="px-5 py-3">ITEMS</th>
                <th className="px-5 py-3">TOTAL (USD)</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">TIMESTAMP</th>
                <th className="px-5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--muted)] font-mono">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--subtle)] font-mono">
                    NO_ORDERS_FOUND
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 font-bold text-white">
                      #{order.id}
                    </td>
                    <td className="px-5 py-3.5">
                      {getChannelBadge(order.channel)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white font-sans">{order.customerName}</div>
                      <div className="text-[10px] text-[var(--subtle)]">{order.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-[var(--muted)] font-sans">
                      {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      ${order.totalAmount.toFixed(2)}
                      <span className="block text-[9px] text-[var(--subtle)]">{order.paymentMethod}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-5 py-3.5 text-[10px] text-[var(--subtle)]">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 border border-[var(--line)] hover:border-white text-white text-[10px] font-mono transition"
                      >
                        MANAGE →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141b] border border-[var(--line)] max-w-lg w-full p-6 shadow-2xl space-y-6 font-mono text-white">
            
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">ORDER DETAILS // #{selectedOrder.id}</h3>
                <span className="text-[10px] text-[var(--subtle)] uppercase">CHANNEL: {selectedOrder.channel}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 border border-[var(--line)] hover:border-white text-[var(--muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3 border border-[var(--line)] bg-[var(--input-bg)] text-xs space-y-1.5">
              <p className="flex justify-between"><span className="text-[var(--subtle)]">NAME:</span> <span className="font-bold text-white font-sans">{selectedOrder.customerName}</span></p>
              <p className="flex justify-between"><span className="text-[var(--subtle)]">PHONE:</span> <span>{selectedOrder.customerPhone || 'N/A'}</span></p>
              <p className="flex justify-between"><span className="text-[var(--subtle)]">ADDRESS:</span> <span className="font-sans text-right max-w-xs">{selectedOrder.customerAddress}</span></p>
              <p className="flex justify-between"><span className="text-[var(--subtle)]">NOTES:</span> <span className="text-[var(--subtle)]">{selectedOrder.notes || 'N/A'}</span></p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-[10px] text-[var(--subtle)] block uppercase">ORDERED_ITEMS</span>
              <div className="border border-[var(--line)] divide-y divide-[var(--line)] text-xs">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <span className="text-[var(--muted)] font-sans">{i.productName} (x{i.quantity})</span>
                    <span className="font-bold text-white">${(i.unitPrice * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="p-2.5 bg-[var(--card-bg-subtle)] flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>${selectedOrder.totalAmount.toFixed(2)} ({selectedOrder.paymentMethod})</span>
                </div>
              </div>
            </div>

            {/* Dispatch Status Update */}
            <div className="pt-2 border-t border-[var(--line)] space-y-2">
              <span className="text-[10px] text-[var(--subtle)] block uppercase">UPDATE_STATUS</span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).map(st => (
                  <button
                    key={st}
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`py-1.5 border text-center transition ${
                      selectedOrder.status === st
                        ? 'border-white bg-white text-black font-bold'
                        : 'border-[var(--line)] text-[var(--muted)] hover:border-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2 border border-[var(--line)] text-[var(--muted)] hover:text-white hover:border-white text-xs font-bold transition"
            >
              CLOSE
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
