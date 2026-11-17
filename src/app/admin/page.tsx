'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderChannel, OrderStatus } from '@/lib/types';
import { 
  ShoppingBag, 
  Send, 
  MessageSquare, 
  Globe, 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  RefreshCw, 
  Filter, 
  Search, 
  DollarSign, 
  TrendingUp, 
  ChevronRight,
  Eye,
  X
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <Send className="w-3 h-3 text-sky-600" />
            <span>Telegram</span>
          </span>
        );
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            <span>WhatsApp</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <Globe className="w-3 h-3 text-slate-600" />
            <span>Web Store</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Confirmed</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Processing</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Shipped</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Unified Order Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed of purchases originating across Web Store, Telegram Bot, and WhatsApp Business.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {orders.length} total orders across all channels
          </p>
        </div>

        {/* Telegram Channel Share */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold uppercase tracking-wider">Telegram Channel</span>
            <Send className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-sky-950">
            {tgOrders.length} <span className="text-xs font-medium text-slate-400">orders</span>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">
            ${tgOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} revenue ({orders.length ? Math.round((tgOrders.length / orders.length) * 100) : 0}% of orders)
          </p>
        </div>

        {/* WhatsApp Channel Share */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Channel</span>
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-950">
            {waOrders.length} <span className="text-xs font-medium text-slate-400">orders</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            ${waOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} revenue ({orders.length ? Math.round((waOrders.length / orders.length) * 100) : 0}% of orders)
          </p>
        </div>

        {/* Web Channel Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">Web Store</span>
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {webOrders.length} <span className="text-xs font-medium text-slate-400">orders</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            ${webOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)} revenue ({orders.length ? Math.round((webOrders.length / orders.length) * 100) : 0}% of orders)
          </p>
        </div>
      </div>

      {/* Orders Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, phone, or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {(['all', 'web', 'telegram', 'whatsapp'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  channelFilter === ch
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch === 'all' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-100 border border-transparent rounded-xl focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Channel</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items Summary</th>
                <th className="px-6 py-3.5">Total ($)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Placed</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4">
                      {getChannelBadge(order.channel)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${order.totalAmount.toFixed(2)}
                      <span className="block text-[10px] font-normal text-slate-400">{order.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()} <br />
                      <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Order #{selectedOrder.id}</h3>
                <span className="text-xs text-slate-500">Channel: <strong className="uppercase">{selectedOrder.channel}</strong></span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Customer Name</span>
                <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact Phone</span>
                <span className="font-semibold text-slate-800">{selectedOrder.customerPhone || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Delivery Address</span>
                <span className="font-semibold text-slate-800">{selectedOrder.customerAddress || 'Direct via chat'}</span>
              </div>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{item.productName}</span>
                      <span className="text-slate-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center font-bold text-sm text-slate-900 pt-3 border-t border-slate-100 mt-3">
                <span>Total Amount:</span>
                <span>${selectedOrder.totalAmount.toFixed(2)} ({selectedOrder.paymentMethod})</span>
              </div>
            </div>

            {/* Change status controls */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Update Order Status:</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).map(st => (
                  <button
                    key={st}
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`py-2 rounded-xl border text-center font-semibold transition ${
                      selectedOrder.status === st
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
