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
    ChevronRight,
    UtensilsCrossed,
    Trash2
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

interface Order {
    _id: string;
    tableId: any;
    status: string;
    totalAmount: number;
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

    const fetchData = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const [tablesData, menuData, ordersData] = await Promise.all([
                request('/tables'),
                request('/menu/items'),
                request('/orders')
            ]);
            setTables(tablesData);
            setMenuItems(menuData);
            setActiveOrders(ordersData.filter((o: any) => ['pending', 'preparing', 'ready'].includes(o.status)));
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
        if (!selectedTable || cart.length === 0) return;

        try {
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
                totalAmount
            };

            await request('/orders', {
                method: 'POST',
                body: JSON.stringify(orderPayload),
            });

            // Update table status to occupied
            await request(`/tables/${selectedTable._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'occupied' }),
            });

            setIsOrderModalOpen(false);
            setCart([]);
            fetchData();
        } catch (error) {
            alert('Failed to create order');
        }
    };

    const handleUpdateTableStatus = async (tableId: string, newStatus: string) => {
        try {
            await request(`/tables/${tableId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            setTables(prev => prev.map(t => t._id === tableId ? { ...t, status: newStatus as any } : t));
        } catch (error) {
            alert('Failed to update table status');
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

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.item._id !== itemId));
    };

    const filteredTables = tables.filter(t => {
        if (activeFilter === 'Available') return t.status === 'available';
        if (activeFilter === 'Occupied') return t.status === 'occupied';
        return true;
    });

    const filteredMenuItems = menuItems.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
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
                    {filteredTables.map((table, index) => {
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
                                    table.status === 'occupied' && "border-primary bg-primary/5 shadow-xl shadow-primary/5",
                                    table.status === 'available' && "border-border bg-emerald-500/5 hover:border-emerald-500/20 shadow-sm",
                                    table.status === 'dirty' && "border-border bg-amber-500/5 opacity-80",
                                    table.status === 'reserved' && "border-border bg-indigo-500/5 opacity-80"
                                )}
                            >
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
                                        <div className="mt-4 pt-4 border-t border-primary/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Active Bill</span>
                                                <span className="text-lg font-black text-primary">${tableOrder?.totalAmount.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleUpdateTableStatus(table._id, 'dirty')}
                                                className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                            >
                                                Mark for Clearing
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="pt-8">
                                            {table.status === 'available' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setIsOrderModalOpen(true);
                                                    }}
                                                    className="w-full py-3 rounded-2xl border-2 border-dashed border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase text-muted-foreground group-hover:text-primary"
                                                >
                                                    <Plus size={16} />
                                                    Start Order
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateTableStatus(table._id, 'available')}
                                                    className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/70 text-muted-foreground text-xs font-black uppercase tracking-widest transition-all"
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
                                        <h3 className="text-2xl font-black">Table {selectedTable.tableNumber}</h3>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Select items for the order</p>
                                    </div>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search menu..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
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
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 italic">
                                            <UtensilsCrossed size={48} className="mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No items selected</p>
                                        </div>
                                    ) : (
                                        cart.map(({ item, quantity }) => (
                                            <div key={item._id} className="flex justify-between items-center bg-card p-3 rounded-xl border border-border">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold leading-tight">{item.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">${item.price.toFixed(2)} x {quantity}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-border">
                                    <div className="flex justify-between items-end mb-6">
                                        <span className="text-xs font-black uppercase text-muted-foreground">Total Amount</span>
                                        <span className="text-2xl font-black text-primary">
                                            ${cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={handleCreateTableOrder}
                                        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-all active:scale-[0.98]"
                                    >
                                        Place Order
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
        </div>
    );
}
