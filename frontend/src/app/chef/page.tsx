'use client';

import React from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    Clock,
    ChefHat,
    Flame,
    CheckCircle2,
    Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
    id: string;
    table: string;
    items: string[];
    status: 'pending' | 'preparing' | 'ready';
    time: string;
    severity: 'normal' | 'urgent';
}

const mockOrders: OrderItem[] = [
    { id: '#1024', table: 'Table 4', items: ['Eggs Benedict x2', 'Pancakes x1'], status: 'preparing', time: '12 min', severity: 'urgent' },
    { id: '#1025', table: 'Table 2', items: ['Grilled Salmon x1', 'Ribeye Steak x1'], status: 'preparing', time: '8 min', severity: 'normal' },
    { id: '#1026', table: 'Table 7', items: ['Fresh Orange Juice x3', 'Cappuccino x1'], status: 'pending', time: '2 min', severity: 'normal' },
    { id: '#1027', table: 'Table 5', items: ['Ribeye Steak x2', 'Fries x1'], status: 'pending', time: '1 min', severity: 'normal' },
];

export default function ChefDashboard() {
    const [orders, setOrders] = React.useState(mockOrders);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kitchen Live Queue</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                        Station 1 • Hot Kitchen
                    </p>
                </div>
                <div className="flex bg-card p-1 rounded-lg border border-border">
                    <button className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold">In Progress</button>
                    <button className="px-4 py-1.5 rounded-md text-muted-foreground text-xs font-bold hover:bg-secondary">History</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {orders.map((order, index) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={cn(
                            "flex flex-col rounded-2xl border-2 transition-all duration-300",
                            order.severity === 'urgent' ? "border-rose-500/20 bg-rose-500/5 shadow-rose-500/10" : "border-border bg-card shadow-sm hover:shadow-md"
                        )}
                    >
                        <div className={cn(
                            "p-4 border-b flex justify-between items-center",
                            order.severity === 'urgent' ? "border-rose-500/20" : "border-border"
                        )}>
                            <div>
                                <span className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Order ID</span>
                                <span className="font-bold">{order.id}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">{order.table}</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold bg-secondary px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    {order.time}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-4 space-y-3">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Order Items</span>
                            <ul className="space-y-2">
                                {order.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-4 pt-0">
                            <button
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all",
                                    order.status === 'preparing'
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[0.98]"
                                        : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[0.98]"
                                )}
                            >
                                {order.status === 'preparing' ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark as Ready
                                    </>
                                ) : (
                                    <>
                                        <Timer className="w-4 h-4" />
                                        Start Preparing
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
