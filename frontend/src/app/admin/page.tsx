import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    Clock,
    AlertCircle
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';

interface Settings {
    currency: string;
    // Add other settings properties if needed
}

export default function AdminDashboard() {
    const { request } = useApi();
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsData = await request('/settings');
                setSettings(settingsData);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, [request]);

    const getCurrencySymbol = (currencyCode: string) => {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            default: return '$';
        }
    };

    const currencySymbol = settings ? getCurrencySymbol(settings.currency) : '$';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
                    <p className="text-muted-foreground">Monitor performance and manage your operations.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors">
                        Generate Report
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                        System Settings
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    rawAmount={12845.00}
                    currencySymbol={currencySymbol}
                    icon={DollarSign}
                    trend={{ value: "+12.5%", positive: true }}
                    delay={0.1}
                />
                <StatCard
                    title="Active Orders"
                    value="42"
                    icon={ShoppingBag}
                    trend={{ value: "+3", positive: true }}
                    delay={0.2}
                />
                <StatCard
                    title="New Customers"
                    value="156"
                    icon={Users}
                    trend={{ value: "+18%", positive: true }}
                    delay={0.3}
                />
                <StatCard
                    title="Avg. Order Time"
                    value="24 min"
                    icon={Clock}
                    trend={{ value: "-2 min", positive: true }}
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="lg:col-span-2 bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold">Recent Activity</h2>
                        <button className="text-sm text-primary font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                                    {i}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Order #{1024 + i} placed</p>
                                    <p className="text-xs text-muted-foreground">Kitchen station 2 • 5 mins ago</p>
                                </div>
                                <div className="text-right font-medium text-sm">
                                    {currencySymbol}45.00
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="text-lg font-bold mb-6 text-rose-500 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Stock Alerts
                    </h2>
                    <div className="space-y-4">
                        {['Fresh Salmon', 'Ribeye Steak', 'Avocado'].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-semibold">{item}</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">Low Stock</span>
                                </div>
                                <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-rose-500 w-1/4" />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 italic">Refill required by tomorrow morning.</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
