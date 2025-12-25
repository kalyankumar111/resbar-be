'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Clock,
    MapPin,
    Plus,
    CircleDollarSign,
    Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
    id: string;
    number: string;
    status: 'available' | 'occupied' | 'dirty' | 'reserved';
    seats: number;
    timeActive?: string;
    totalOrder?: string;
}

const mockTables: Table[] = [
    { id: '1', number: '01', status: 'occupied', seats: 4, timeActive: '45m', totalOrder: '$124.00' },
    { id: '2', number: '02', status: 'available', seats: 2 },
    { id: '3', number: '03', status: 'occupied', seats: 6, timeActive: '1h 12m', totalOrder: '$245.50' },
    { id: '4', number: '04', status: 'dirty', seats: 4 },
    { id: '5', number: '05', status: 'available', seats: 4 },
    { id: '6', number: '06', status: 'reserved', seats: 8 },
    { id: '7', number: '07', status: 'occupied', seats: 2, timeActive: '12m', totalOrder: '$32.00' },
    { id: '8', number: '08', status: 'available', seats: 4 },
];

export default function WaiterDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
                    <p className="text-muted-foreground italic flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        Main Dining Area
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {['All', 'Available', 'Occupied'].map((filter) => (
                        <button key={filter} className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                            filter === 'All' ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground hover:bg-secondary"
                        )}>
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
                {mockTables.map((table, index) => (
                    <motion.div
                        key={table.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={cn(
                            "group relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer",
                            table.status === 'occupied' && "border-primary bg-primary/5 shadow-xl shadow-primary/5",
                            table.status === 'available' && "border-border bg-emerald-500/5 hover:border-emerald-500/20 shadow-sm",
                            table.status === 'dirty' && "border-border bg-amber-500/5 opacity-80",
                            table.status === 'reserved' && "border-border bg-indigo-500/5 opacity-80"
                        )}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl tracking-tighter shadow-sm",
                                table.status === 'occupied' ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                            )}>
                                {table.number}
                            </div>
                            <div className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                table.status === 'occupied' && "bg-primary/20 text-primary",
                                table.status === 'available' && "bg-emerald-500/20 text-emerald-600",
                                table.status === 'dirty' && "bg-amber-500/20 text-amber-600",
                                table.status === 'reserved' && "bg-indigo-500/20 text-indigo-600"
                            )}>
                                {table.status}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-bold">{table.seats} Seats</span>
                            </div>

                            {table.status === 'occupied' ? (
                                <>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-bold">{table.timeActive}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center">
                                        <span className="text-xs font-black uppercase text-primary/60">Total Bill</span>
                                        <span className="text-lg font-black text-primary">{table.totalOrder}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="pt-8">
                                    <button className="w-full py-2.5 rounded-xl border border-dashed border-border group-hover:border-primary/40 group-hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase text-muted-foreground group-hover:text-primary">
                                        <Plus className="w-4 h-4" />
                                        New Order
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hover Effects Layout Decoration */}
                        <div className="absolute -z-10 bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3x-l pointer-events-none" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
