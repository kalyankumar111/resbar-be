'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Flame,
    CheckCircle2,
    Timer,
    AlertCircle,
    RefreshCw,
    ChefHat,
    Utensils,
    Bell,
    ChevronDown
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface OrderItem {
    _id: string;
    name: string;
    quantity: number;
    price: number;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
    firedAt?: string;
}

interface Order {
    _id: string;
    tableId: {
        _id: string;
        tableNumber: string;
    } | null;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
    items: OrderItem[];
    createdAt: string;
}

export default function ChefDashboard() {
    const { request } = useApi();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const fetchOrders = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const data = await request(`/kitchen/orders?history=${showHistory}`);
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch kitchen orders', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [request, showHistory]);

    useEffect(() => {
        fetchOrders(true);
        const interval = setInterval(() => fetchOrders(), 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            setIsUpdating(orderId);
            await request(`/kitchen/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }), // No more bulk update
            });
            setOrders(prev => prev.map(o => o._id === orderId ? {
                ...o,
                status: newStatus as any
            } : o));
        } catch (error) {
            alert('Failed to update order status');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleItemStatusUpdate = async (orderId: string, itemId: string, newStatus: string) => {
        try {
            setIsUpdating(`${orderId}-${itemId}`);
            await request(`/kitchen/orders/${orderId}/items/${itemId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            setOrders(prev => prev.map(o => o._id === orderId ? {
                ...o,
                items: o.items.map(i => i._id === itemId ? { ...i, status: newStatus as any } : i)
            } : o));
        } catch (error) {
            alert('Failed to update item status');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleItemReorder = async (orderId: string, itemId: string) => {
        if (!confirm('Re-fire this item? This will add it back to the order as pending.')) return;
        try {
            setIsUpdating(`${orderId}-${itemId}-reorder`);
            await request(`/kitchen/orders/${orderId}/items/${itemId}/reorder`, {
                method: 'POST',
            });
            fetchOrders(); // Refresh to get the new list
        } catch (error) {
            alert('Failed to re-fire item');
        } finally {
            setIsUpdating(null);
        }
    };

    const getWaitTime = (createdAt: string) => {
        const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
        return diff;
    };

    const getUrgencyColor = (createdAt: string) => {
        const minutes = getWaitTime(createdAt);
        if (minutes > 20) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        if (minutes > 10) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    };

    const getItemStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'preparing': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kitchen Live Queue</h1>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                            Station 1 • Hot Kitchen
                        </p>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <p className="text-primary font-bold">{orders.filter(o => o.status !== 'ready').length} Active Orders</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchOrders(true)}
                        className="p-2.5 hover:bg-secondary rounded-xl transition-colors border border-border text-muted-foreground"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <div className="flex bg-card/50 p-1 rounded-xl border border-border shadow-inner">
                        <button
                            onClick={() => setShowHistory(false)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                !showHistory ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setShowHistory(true)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                showHistory ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 rounded-[2rem] bg-secondary/30 animate-pulse border border-border" />
                    ))}
                </div>
            ) : orders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order) => {
                            const waitTime = getWaitTime(order.createdAt);
                            const isUrgent = waitTime > 15;

                            return (
                                <motion.div
                                    key={order._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={cn(
                                        "flex flex-col rounded-[2.5rem] border-2 transition-all duration-500 relative group overflow-hidden",
                                        order.status === 'ready'
                                            ? "border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-500/5"
                                            : isUrgent
                                                ? "border-rose-500/30 bg-rose-500/5 shadow-2xl shadow-rose-500/10"
                                                : "border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/20"
                                    )}
                                >
                                    {/* Urgency Badge */}
                                    {isUrgent && order.status !== 'ready' && (
                                        <div className="absolute -right-12 -top-12 w-24 h-24 bg-rose-500/10 rotate-45 flex items-end justify-center pb-2">
                                            <Bell className="w-4 h-4 text-rose-500 animate-bounce" />
                                        </div>
                                    )}

                                    <div className="p-5 border-b border-border/50 bg-white/5 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-widest">Table</span>
                                            <span className="font-black text-xl text-primary">#{order.tableId?.tableNumber || '??'}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border transition-colors",
                                                getUrgencyColor(order.createdAt)
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {waitTime}m Waiting
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-5 space-y-4">
                                        <div className="space-y-4">
                                            {order.items.map((item, i) => (
                                                <div key={item._id || i} className="group/item bg-secondary/20 p-3 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex gap-2 items-center">
                                                            <div className="flex gap-2 items-start">
                                                                <span className="flex-shrink-0 w-6 h-6 bg-secondary rounded-lg flex items-center justify-center text-[10px] font-bold">
                                                                    {item.quantity}x
                                                                </span>
                                                                <span className="text-sm font-bold leading-tight group-hover/item:text-primary transition-colors">{item.name}</span>
                                                            </div>
                                                            {item.firedAt && item.status !== 'ready' && (
                                                                <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                                                                    {getWaitTime(item.firedAt)}m
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleItemReorder(order._id, item._id)}
                                                            className="p-1 hover:bg-orange-500/10 text-orange-500 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                                                            title="Re-fire Item"
                                                        >
                                                            <RefreshCw size={14} className={isUpdating === `${order._id}-${item._id}-reorder` ? "animate-spin" : ""} />
                                                        </button>
                                                    </div>

                                                    <div className="relative">
                                                        <select
                                                            value={item.status || 'pending'}
                                                            onChange={(e) => handleItemStatusUpdate(order._id, item._id, e.target.value)}
                                                            className={cn(
                                                                "w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider appearance-none cursor-pointer border outline-none transition-colors",
                                                                getItemStatusColor(item.status || 'pending')
                                                            )}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="preparing">Preparing</option>
                                                            <option value="ready">Ready</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                            <ChevronDown size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0">
                                        <div className="relative group/status">
                                            {(() => {
                                                const canBeServed = order.items.every(item =>
                                                    ['ready', 'served', 'cancelled'].includes(item.status)
                                                );
                                                return (
                                                    <select
                                                        disabled={isUpdating?.includes(order._id)}
                                                        value={order.status}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'served' && !canBeServed) {
                                                                alert('Please ensure all items are Ready or Served first.');
                                                                return;
                                                            }
                                                            handleStatusUpdate(order._id, val);
                                                        }}
                                                        className={cn(
                                                            "w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest appearance-none transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer outline-none border-2",
                                                            order.status === 'ready'
                                                                ? "bg-emerald-500 text-white shadow-emerald-500/20 border-emerald-400"
                                                                : order.status === 'preparing'
                                                                    ? "bg-orange-500 text-white shadow-orange-500/20 border-orange-400"
                                                                    : "bg-primary text-white shadow-primary/20 border-primary-400"
                                                        )}
                                                    >
                                                        <option value="pending" className="bg-card text-foreground">Pending</option>
                                                        <option value="preparing" className="bg-card text-foreground">Preparing</option>
                                                        <option value="ready" className="bg-card text-foreground">Ready</option>
                                                        <option value="served" className={cn("bg-card text-foreground", !canBeServed && "opacity-50")} disabled={!canBeServed}>
                                                            Served {!canBeServed && "(Items in Prep)"}
                                                        </option>
                                                        <option value="cancelled" className="bg-card text-foreground">Cancelled</option>
                                                    </select>
                                                );
                                            })()}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                                                {isUpdating === order._id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-card/30 rounded-[3rem] border-2 border-dashed border-border/50">
                    <div className="w-24 h-24 bg-secondary/50 rounded-[2rem] flex items-center justify-center text-muted-foreground mb-6 shadow-inner">
                        <Utensils size={48} className="opacity-20" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-white/40 italic">Kitchen Quiet...</h3>
                    <p className="text-muted-foreground mt-2 font-medium">Sit tight, orders will appear here in real-time.</p>
                </div>
            )}
        </div>
    );
}
