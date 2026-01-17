/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Clock,
    MapPin,
    Plus,
    CircleDollarSign,
    RefreshCw,
    X,
    Check,
    Search,
    ChevronDown,
    ChevronRight,
    UtensilsCrossed,
    Trash2,
    Receipt,
    Bell,
    Minus
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface Table {
    _id: string;
    tableNumber: string;
    status: 'available' | 'occupied' | 'dirty' | 'reserved';
    capacity: number;
    isActive: boolean;
}

interface MenuItem {
    _id: string;
    name: string;
    price: number;
    category: string;
}

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    status: string;
    _id?: string;
}

interface Order {
    _id: string;
    tableId: any;
    status: string;
    totalAmount: number;
    items: OrderItem[];
}

export default function WaiterDashboard() {
    const { request } = useApi();
    const [tables, setTables] = useState<Table[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'All' | 'Available' | 'Occupied'>('All');

    // Modal States
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingBillOrder, setViewingBillOrder] = useState<any | null>(null);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [activeSection, setActiveSection] = useState<'tables' | 'orders'>('tables');
    const [seatsAllocated, setSeatsAllocated] = useState<number>(0);
    const [settings, setSettings] = useState<any>(null);

    const getCurrencySymbol = (currencyCode: string) => {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            // Add more as needed
            default: return '$';
        }
    };

    const formatCurrency = (amount: number) => {
        if (!settings) return `$${amount.toFixed(2)}`; // Fallback
        const symbol = getCurrencySymbol(settings.currency);
        return `${symbol}${amount.toFixed(2)}`;
    };

    const fetchData = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const [tablesData, menuData, ordersData, settingsData] = await Promise.all([
                request('/tables'),
                request('/menu/items'),
                request('/orders'),
                request('/settings')
            ]);
            setTables(tablesData);
            setMenuItems(menuData);
            setActiveOrders(ordersData.filter((o: any) => ['pending', 'preparing', 'ready', 'served'].includes(o.status)));
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to fetch waiter data', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [request]);

    useEffect(() => {
        fetchData(true);
        const interval = setInterval(() => fetchData(), 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleCreateTableOrder = async () => {
        if (!selectedTable || (cart.length === 0 && !isEditingOrder)) return;

        const tableOrder = activeOrders.find(o =>
            (typeof o.tableId === 'string' ? o.tableId : o.tableId?._id) === selectedTable._id
        );

        try {
            if (isEditingOrder && tableOrder) {
                // Update existing order
                await request(`/orders/${tableOrder._id}/items`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        items: cart.map(i => ({
                            menuItemId: i.item._id,
                            name: i.item.name,
                            quantity: i.quantity,
                            price: i.item.price
                        }))
                    })
                });
            } else {
                // Create new order
                const totalAmount = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
                const orderPayload = {
                    tableId: selectedTable._id,
                    items: cart.map(i => ({
                        menuItemId: i.item._id,
                        name: i.item.name,
                        quantity: i.quantity,
                        price: i.item.price,
                        status: 'pending'
                    })),
                    totalAmount,
                    seatsAllocated: seatsAllocated || selectedTable.capacity
                };

                await request('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderPayload),
                });

                // Update table status to occupied
                await handleUpdateTableStatus(selectedTable._id, 'occupied');
            }

            setIsOrderModalOpen(false);
            setCart([]);
            setSeatsAllocated(0);
            fetchData();
        } catch (error) {
            alert('Failed to process order');
        }
    };

    const handleUpdateTableStatus = async (tableId: string, newStatus: string, orderId?: string) => {
        if (newStatus === 'available' && !confirm('Are you sure the table is clean and ready for new guests?')) return;

        try {
            await request(`/tables/${tableId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });

            if ((newStatus === 'dirty' || newStatus === 'available') && orderId) {
                await request(`/orders/${orderId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'paid' }),
                });
            }

            setTables(prev => prev.map(t => t._id === tableId ? { ...t, status: newStatus as any } : t));
            fetchData();
        } catch (error) {
            alert('Failed to update table status');
        }
    };

    const handleUpdateItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
        try {
            await request(`/kitchen/orders/${orderId}/items/${itemId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            fetchData();
        } catch (error) {
            alert('Failed to update item status');
        }
    };

    const handleGenerateBill = (order: any) => {
        setViewingBillOrder(order);
        setIsBillModalOpen(true);
    };

    const handleFinalizePayment = async (orderId: string, tableId: string) => {
        if (!confirm('Mark as paid and clear table?')) return;
        try {
            await handleUpdateTableStatus(tableId, 'dirty', orderId);
            setIsBillModalOpen(false);
        } catch (error) {
            alert('Failed to finalize payment');
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.item._id === item._id);
            if (existing) {
                return prev.map(i => i.item._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const decreaseQuantity = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.item._id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map(i => i.item._id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.item._id !== itemId);
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.item._id !== itemId));
    };

    const filteredTables = tables.filter(t => {
        if (activeFilter === 'Available') return t.status === 'available';
        if (activeFilter === 'Occupied') return t.status === 'occupied';
        return true;
    });

    const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

    const filteredMenuItems = menuItems.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getItemStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'text-emerald-500';
            case 'preparing': return 'text-orange-500';
            case 'cancelled': return 'text-rose-500';
            case 'served': return 'text-emerald-500 opacity-60';
            case 'pending': return 'text-primary/60';
            default: return 'text-muted-foreground';
        }
    };

    const getItemStatusLabel = (status: string) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Navigation Tabs */}
            <div className="flex bg-card/30 p-1.5 rounded-2xl border border-border w-fit">
                <button
                    onClick={() => setActiveSection('tables')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        activeSection === 'tables' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                >
                    <MapPin size={18} />
                    Tables
                </button>
                <button
                    onClick={() => setActiveSection('orders')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        activeSection === 'orders' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                >
                    <Clock size={18} />
                    Active Orders
                    {activeOrders.flatMap(o => o.items).some(i => i.status === 'ready') && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                    )}
                </button>
            </div>

            {activeSection === 'tables' ? (
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
                            <p className="text-muted-foreground italic flex items-center gap-2 mt-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                Main Dining Area
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchData(true)}
                                className="p-2.5 hover:bg-secondary rounded-xl transition-colors border border-border text-muted-foreground"
                            >
                                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                            </button>
                            <div className="flex bg-card/50 p-1 rounded-xl border border-border shadow-inner">
                                {(['All', 'Available', 'Occupied'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                            activeFilter === filter ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-[2rem] bg-secondary/30 animate-pulse border border-border" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
                            {filteredTables.map((table) => {
                                const tableOrder = activeOrders.find(o =>
                                    (typeof o.tableId === 'string' ? o.tableId : o.tableId?._id) === table._id
                                );

                                return (
                                    <motion.div
                                        key={table._id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "group relative p-6 rounded-[2.5rem] border-2 transition-all duration-300",
                                            table.status === 'occupied' && tableOrder?.items.some(i => i.status === 'ready') && "border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20",
                                            table.status === 'occupied' && !tableOrder?.items.some(i => i.status === 'ready') && "border-primary bg-primary/5 shadow-xl shadow-primary/5",
                                            table.status === 'available' && "border-border bg-emerald-500/5 hover:border-emerald-500/20 shadow-sm",
                                            table.status === 'dirty' && "border-border bg-amber-500/5 opacity-80",
                                            table.status === 'reserved' && "border-border bg-indigo-500/5 opacity-80"
                                        )}
                                    >
                                        {/* Ready Notification Badge */}
                                        {table.status === 'occupied' && tableOrder?.items.some(i => i.status === 'ready') && (
                                            <div className="absolute -top-3 -right-3 z-20">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                                                    <div className="relative bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                                                        <Bell size={14} fill="white" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl tracking-tighter shadow-sm",
                                                table.status === 'occupied' ? "bg-primary text-white" : "bg-card text-muted-foreground border border-border"
                                            )}>
                                                {table.tableNumber}
                                            </div>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                table.status === 'occupied' && "bg-primary/10 border-primary/20 text-primary",
                                                table.status === 'available' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
                                                table.status === 'dirty' && "bg-amber-500/10 border-amber-500/20 text-amber-600",
                                                table.status === 'reserved' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"
                                            )}>
                                                {table.status}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-bold">{table.capacity} Seats</span>
                                            </div>

                                            {table.status === 'occupied' ? (
                                                <div className="mt-4 pt-4 border-t border-primary/10 space-y-3">
                                                    {tableOrder?.items && (
                                                        <div className="px-1 py-1 bg-secondary/30 rounded-lg border border-border/50 max-h-16 overflow-y-auto custom-scrollbar">
                                                            {tableOrder.items.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between text-[9px] font-bold py-0.5">
                                                                    <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                                                                    <span className={cn(
                                                                        "shrink-0",
                                                                        getItemStatusColor(item.status)
                                                                    )}>
                                                                        {getItemStatusLabel(item.status)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Active Bill</span>
                                                        <span className="text-lg font-black text-primary">{formatCurrency(tableOrder?.totalAmount || 0)}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            defaultValue=""
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === 'bill' && tableOrder) handleGenerateBill(tableOrder);
                                                                if (val === 'add') {
                                                                    setSelectedTable(table);
                                                                    setIsEditingOrder(true);
                                                                    setCart([]);
                                                                    setSeatsAllocated(0);
                                                                    setIsOrderModalOpen(true);
                                                                }
                                                                if (val === 'clear') handleUpdateTableStatus(table._id, 'dirty', tableOrder?._id);
                                                                e.target.value = '';
                                                            }}
                                                            className="w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all appearance-none cursor-pointer outline-none border border-primary/20"
                                                        >
                                                            <option value="" disabled>Table Actions</option>
                                                            <option value="add" className="bg-card text-foreground">Add Items</option>
                                                            <option value="bill" className="bg-card text-foreground">View/Generate Bill</option>
                                                            <option value="clear" className="bg-card text-foreground">Clear Table</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                                                            <ChevronDown size={14} className="text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pt-8">
                                                    {table.status === 'available' ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTable(table);
                                                                setIsEditingOrder(false);
                                                                setCart([]);
                                                                setSeatsAllocated(0);
                                                                setIsOrderModalOpen(true);
                                                            }}
                                                            className="w-full py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary"
                                                        >
                                                            <Plus size={16} />
                                                            Start Order
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateTableStatus(table._id, 'available')}
                                                            className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-2xl border border-border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600"
                                                        >
                                                            Set Available
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeOrders.map((order) => {
                            const hasReadyItems = order.items.some(i => i.status === 'ready');
                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "p-6 rounded-[2.5rem] bg-card border-2 transition-all",
                                        hasReadyItems ? "border-emerald-500 bg-emerald-500/5 shadow-xl shadow-emerald-500/10" : "border-border"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-2xl font-black text-primary">Table {order.tableId?.tableNumber || '??'}</span>
                                                {hasReadyItems && (
                                                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                        Items Ready
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Order ID: #{order._id.slice(-6)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-primary">${order.totalAmount.toFixed(2)}</span>
                                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">{order.status}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {order.items.map((item: any) => (
                                            <div key={item._id || item.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl border border-border/50">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 bg-card rounded-xl flex items-center justify-center text-xs font-black border border-border">
                                                        {item.quantity}x
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-bold">{item.name}</p>
                                                        <p className={cn("text-[10px] font-black uppercase", getItemStatusColor(item.status))}>
                                                            {item.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.status === 'ready' && (
                                                    <button
                                                        onClick={() => handleUpdateItemStatus(order._id, item._id, 'served')}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                                    >
                                                        Mark Served
                                                    </button>
                                                )}
                                                {item.status === 'served' && (
                                                    <div className="flex items-center gap-1.5 text-emerald-500 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                                        <Check size={14} className="stroke-[3]" />
                                                        <span className="text-[10px] font-black uppercase">Served</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-border flex gap-3">
                                        <button
                                            onClick={() => handleGenerateBill(order)}
                                            className="flex-1 py-3 bg-secondary hover:bg-border text-muted-foreground text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            View Bill
                                        </button>
                                        <button
                                            onClick={() => {
                                                const table = tables.find(t => t._id === (typeof order.tableId === 'string' ? order.tableId : order.tableId?._id));
                                                if (table) {
                                                    setSelectedTable(table);
                                                    setIsEditingOrder(true);
                                                    setCart([]);
                                                    setSeatsAllocated(0);
                                                    setIsOrderModalOpen(true);
                                                }
                                            }}
                                            className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Add More Items
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {activeOrders.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground italic border-2 border-dashed border-border rounded-[3rem]">
                                <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest opacity-40">No active orders found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Order Modal */}
            <AnimatePresence>
                {isOrderModalOpen && selectedTable && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOrderModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-5xl h-[80vh] bg-card border border-border rounded-[3rem] shadow-2xl relative z-[101] overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Menu Selection (Left) */}
                            <div className="flex-1 flex flex-col p-8 border-r border-border min-h-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black">
                                            {isEditingOrder ? `Add to Table ${selectedTable.tableNumber}` : `New Order: Table ${selectedTable.tableNumber}`}
                                        </h3>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Select items for the order</p>
                                    </div>
                                </div>

                                {/* Seat Allocation - Only show for new orders */}
                                {!isEditingOrder && (
                                    <div className="mb-6 p-4 bg-secondary/30 rounded-2xl border border-border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Seats Allocated</label>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    Table capacity: {selectedTable.capacity} seats
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setSeatsAllocated(Math.max(1, (seatsAllocated || selectedTable.capacity) - 1))}
                                                    className="w-8 h-8 bg-secondary hover:bg-border rounded-lg flex items-center justify-center transition-colors"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="text-2xl font-black w-12 text-center">{seatsAllocated || selectedTable.capacity}</span>
                                                <button
                                                    onClick={() => setSeatsAllocated((seatsAllocated || selectedTable.capacity) + 1)}
                                                    className="w-8 h-8 bg-secondary hover:bg-border rounded-lg flex items-center justify-center transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {settings && (seatsAllocated || selectedTable.capacity) > selectedTable.capacity && (
                                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                <span className="text-xs font-bold text-orange-500">
                                                    Extra seats: {(seatsAllocated || selectedTable.capacity) - selectedTable.capacity}
                                                </span>
                                                <span className="text-sm font-black text-orange-500">
                                                    +${(((seatsAllocated || selectedTable.capacity) - selectedTable.capacity) * settings.extraSeatPrice).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="relative w-full mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search menu..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>

                                {/* Category Chips */}
                                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                                selectedCategory === category
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
                                            )}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
                                    {filteredMenuItems.map(item => (
                                        <button
                                            key={item._id}
                                            onClick={() => addToCart(item)}
                                            className="text-left p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group flex justify-between items-center"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.name}</span>
                                                <span className="text-[10px] uppercase font-black text-muted-foreground opacity-60">{item.category}</span>
                                            </div>
                                            <div className="font-black text-primary">${item.price.toFixed(2)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cart (Right) */}
                            <div className="w-full md:w-80 bg-secondary/20 flex flex-col p-8 min-h-0">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-lg font-black uppercase tracking-widest">Cart</h4>
                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-black">{cart.length} items</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {isEditingOrder && (
                                        <div className="mb-6 space-y-2 opacity-60">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Already Ordered</p>
                                            {activeOrders.find(o =>
                                                (typeof o.tableId === 'string' ? o.tableId : o.tableId?._id) === selectedTable._id
                                            )?.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-secondary/40 p-3 rounded-xl border border-border/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold leading-tight">{item.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">Qty: {item.quantity} • {item.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="h-px bg-border my-4" />
                                        </div>
                                    )}

                                    {isEditingOrder && cart.length > 0 && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">New Additions</p>
                                    )}

                                    {cart.length === 0 ? (
                                        <div className={cn(
                                            "flex flex-col items-center justify-center text-muted-foreground opacity-30 italic",
                                            isEditingOrder ? "py-8" : "h-full"
                                        )}>
                                            <UtensilsCrossed size={48} className="mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No new items selected</p>
                                        </div>
                                    ) : (
                                        cart.map(({ item, quantity }) => (
                                            <div key={item._id} className="flex justify-between items-center bg-card p-3 rounded-xl border border-border">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold leading-tight">{item.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">${item.price.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center bg-secondary/50 rounded-lg border border-border p-1">
                                                        <button
                                                            onClick={() => decreaseQuantity(item._id)}
                                                            className="p-1 hover:bg-card rounded-md transition-colors text-muted-foreground hover:text-rose-500"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-black">{quantity}</span>
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className="p-1 hover:bg-card rounded-md transition-colors text-muted-foreground hover:text-emerald-500"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item._id)}
                                                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-border space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-xs font-bold text-muted-foreground">Food & Beverages</span>
                                        <span className="font-mono font-bold">
                                            ${cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {!isEditingOrder && settings && (seatsAllocated || selectedTable.capacity) > selectedTable.capacity && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-xs font-bold text-orange-500">Extra Seats Charge</span>
                                            <span className="font-mono font-bold text-orange-500">
                                                +${(((seatsAllocated || selectedTable.capacity) - selectedTable.capacity) * settings.extraSeatPrice).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-3 border-t border-border">
                                        <span className="text-xs font-black uppercase text-muted-foreground">Total Amount</span>
                                        <span className="text-2xl font-black text-primary">
                                            ${(() => {
                                                const foodTotal = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
                                                const extraSeatCharge = (!isEditingOrder && settings && (seatsAllocated || selectedTable.capacity) > selectedTable.capacity)
                                                    ? ((seatsAllocated || selectedTable.capacity) - selectedTable.capacity) * settings.extraSeatPrice
                                                    : 0;
                                                return (foodTotal + extraSeatCharge).toFixed(2);
                                            })()}
                                        </span>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={handleCreateTableOrder}
                                        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-all active:scale-[0.98]"
                                    >
                                        {isEditingOrder ? 'Add to Current Items' : 'Place Order'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-card hover:bg-secondary rounded-xl border border-border shadow-sm text-muted-foreground transition-all"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bill Modal */}
            <AnimatePresence>
                {isBillModalOpen && viewingBillOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsBillModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-[3rem] shadow-2xl relative z-[101] overflow-hidden flex flex-col p-8"
                        >
                            <div className="flex flex-col items-center mb-8 pb-8 border-b border-border border-dashed">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                    <Receipt size={32} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest">Table #{viewingBillOrder.tableId?.tableNumber || '??'}</h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Order #{viewingBillOrder._id.slice(-6)}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {viewingBillOrder.seatsAllocated > 0 && (
                                    <div className="mb-4 p-3 bg-secondary/30 rounded-xl border border-border">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-muted-foreground">Seats Allocated</span>
                                            <span className="font-black">{viewingBillOrder.seatsAllocated}</span>
                                        </div>
                                    </div>
                                )}
                                {viewingBillOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-muted-foreground">{item.quantity}x</span>
                                            <span className="font-bold">{item.name}</span>
                                        </div>
                                        <span className="font-mono font-bold">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                                {viewingBillOrder.extraSeatsCharge > 0 && (
                                    <div className="flex justify-between items-center text-sm pt-3 border-t border-border/50">
                                        <span className="font-bold text-orange-500">Extra Seats Charge</span>
                                        <span className="font-mono font-bold text-orange-500">{formatCurrency(viewingBillOrder.extraSeatsCharge)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-border space-y-4">
                                <div className="flex justify-between items-center text-lg font-black uppercase">
                                    <span>Total Amount</span>
                                    <span className="text-primary">{formatCurrency(viewingBillOrder.totalAmount)}</span>
                                </div>
                                <button
                                    onClick={() => handleFinalizePayment(viewingBillOrder._id, viewingBillOrder.tableId?._id || viewingBillOrder.tableId)}
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <CircleDollarSign size={20} />
                                    Mark Paid & Clear Table
                                </button>
                                <button
                                    onClick={() => setIsBillModalOpen(false)}
                                    className="w-full py-3 bg-secondary text-muted-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-secondary/70 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
