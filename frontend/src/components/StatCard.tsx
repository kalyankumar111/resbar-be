'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    rawAmount?: number; // Make optional for non-currency stats
    value?: string; // Keep for non-currency stats like "24 min"
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    className?: string;
    delay?: number;
    currencySymbol?: string; // New prop for currency symbol
}

export const StatCard = ({ title, rawAmount, value, icon: Icon, trend, className, delay = 0, currencySymbol = '$' }: StatCardProps) => {
    const displayValue = rawAmount !== undefined ? `${currencySymbol}${rawAmount.toFixed(2)}` : value;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                "p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden",
                className
            )}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />

            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="text-primary w-6 h-6" />
                </div>
                {trend && (
                    <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        trend.positive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                    )}>
                        {trend.value}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <p className="text-2xl font-bold mt-1 tracking-tight">{displayValue}</p>
            </div>
        </motion.div>
    );
};
