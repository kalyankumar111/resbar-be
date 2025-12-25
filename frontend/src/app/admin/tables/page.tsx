'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    QrCode,
    Edit2,
    Trash2,
    RefreshCw,
    MoreVertical,
    Check,
    X,
    Clock,
    LayoutGrid,
    List,
    AlertCircle,
    Download
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface Table {
    _id: string;
    tableNumber: string;
    qrToken: string;
    isActive: boolean;
    status: 'available' | 'occupied' | 'reserved' | 'dirty';
    capacity?: number;
}

export default function TablesPage() {
    const { request } = useApi();
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);

    // Form states
    const [formTableNumber, setFormTableNumber] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formCapacity, setFormCapacity] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            setIsLoading(true);
            const data = await request('/tables');
            setTables(data);
        } catch (error) {
            console.error('Failed to fetch tables', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await request('/tables', {
                method: 'POST',
                body: JSON.stringify({
                    tableNumber: formTableNumber,
                    capacity: formCapacity
                }),
            });
            setIsAddModalOpen(false);
            setFormTableNumber('');
            setFormCapacity(4);
            fetchTables();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to add table');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTable) return;
        setIsSubmitting(true);
        try {
            await request(`/tables/${selectedTable._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    tableNumber: formTableNumber,
                    isActive: formIsActive,
                    capacity: formCapacity
                }),
            });
            setIsEditModalOpen(false);
            fetchTables();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to update table');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm('Are you sure you want to delete this table?')) return;
        try {
            await request(`/tables/${id}`, { method: 'DELETE' });
            fetchTables();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete table');
        }
    };

    const handleViewQR = async (table: Table) => {
        setSelectedTable(table);
        setQrCodeData(null);
        setIsQRModalOpen(true);
        try {
            const data = await request(`/tables/${table._id}/qr`);
            setQrCodeData(data.qrCode);
        } catch (error) {
            console.error('Failed to fetch QR code', error);
        }
    };

    const handleRegenerateQR = async () => {
        if (!selectedTable) return;
        if (!confirm('Regenerating will invalidate the previous QR code. Continue?')) return;
        try {
            await request(`/tables/${selectedTable._id}/regenerate-qr`, { method: 'POST' });
            handleViewQR(selectedTable);
        } catch (error) {
            alert('Failed to regenerate QR code');
        }
    };

    const filteredTables = tables.filter(t =>
        t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
                    <p className="text-muted-foreground mt-1">Configure restaurant layout and QR ordering</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        Add Table
                    </button>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-4 bg-card/50 p-4 rounded-2xl border border-border/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by table number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl py-2 pl-10 pr-4 outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <button
                    onClick={fetchTables}
                    className="p-2.5 hover:bg-secondary rounded-xl transition-colors border border-border text-muted-foreground"
                >
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Tables Display */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-secondary/30 animate-pulse border border-border" />
                    ))}
                </div>
            ) : filteredTables.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTables.map((table) => (
                            <motion.div
                                key={table._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card group overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                                                {table.tableNumber}
                                            </div>
                                            <div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                    table.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                )}>
                                                    {table.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative group/menu">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border shadow-2xl rounded-xl opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-all z-20 overflow-hidden">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setFormTableNumber(table.tableNumber);
                                                        setFormIsActive(table.isActive);
                                                        setFormCapacity(table.capacity || 4);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-secondary text-sm transition-colors"
                                                >
                                                    <Edit2 size={14} /> Edit Table
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table._id)}
                                                    className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-500 text-sm transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <button
                                            onClick={() => handleViewQR(table)}
                                            className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg transition-all"
                                        >
                                            <QrCode size={14} /> View QR
                                        </button>
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
                                            <Clock size={10} />
                                            ID: {table._id.slice(-6)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-hidden glass-card">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border text-xs uppercase font-black text-muted-foreground tracking-widest">
                                    <th className="px-6 py-4">Table</th>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredTables.map((table) => (
                                    <tr key={table._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm font-bold">
                                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                    {table.tableNumber}
                                                </div>
                                                Table {table.tableNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                {table._id}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                table.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                            )}>
                                                {table.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewQR(table)}
                                                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                    title="View QR"
                                                >
                                                    <QrCode size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setFormTableNumber(table.tableNumber);
                                                        setFormIsActive(table.isActive);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table._id)}
                                                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border/50">
                    <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center text-muted-foreground mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold">No tables found</h3>
                    <p className="text-muted-foreground mt-1">Start by adding your first table</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-6 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold transition-all"
                    >
                        <Plus size={20} /> Add Table
                    </button>
                </div>
            )}

            {/* Modal - Add Table */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Add New Table</h3>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleAddTable} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Table Number / Name</label>
                                        <input
                                            type="text"
                                            value={formTableNumber}
                                            onChange={(e) => setFormTableNumber(e.target.value)}
                                            placeholder="e.g. 01, VIP-A"
                                            required
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Seating Capacity</label>
                                        <input
                                            type="number"
                                            value={formCapacity}
                                            onChange={(e) => setFormCapacity(parseInt(e.target.value))}
                                            min="1"
                                            required
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="flex-1 py-3 bg-secondary hover:bg-secondary/70 rounded-xl font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Adding...' : 'Add Table'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal - Edit Table */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Edit Table {selectedTable?.tableNumber}</h3>
                                    <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateTable} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Table Number / Name</label>
                                        <input
                                            type="text"
                                            value={formTableNumber}
                                            onChange={(e) => setFormTableNumber(e.target.value)}
                                            required
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Seating Capacity</label>
                                        <input
                                            type="number"
                                            value={formCapacity}
                                            onChange={(e) => setFormCapacity(parseInt(e.target.value))}
                                            min="1"
                                            required
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Active Status</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">Enable or disable ordering</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formIsActive}
                                                onChange={(e) => setFormIsActive(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="flex-1 py-3 bg-secondary hover:bg-secondary/70 rounded-xl font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving Changes' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal - QR Code View */}
            <AnimatePresence>
                {isQRModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsQRModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-sm bg-card border border-border rounded-[3rem] shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="flex justify-end mb-2">
                                    <button onClick={() => setIsQRModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-2xl mx-auto mb-2">
                                        {selectedTable?.tableNumber}
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight">Digital QR Menu</h3>
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">Scan to place order</p>
                                </div>

                                <div className="aspect-square bg-white rounded-[2rem] p-6 mb-8 flex items-center justify-center relative shadow-inner">
                                    {!qrCodeData ? (
                                        <div className="animate-spin text-gray-200">
                                            <RefreshCw size={48} />
                                        </div>
                                    ) : (
                                        <img
                                            src={qrCodeData}
                                            alt={`QR Code for Table ${selectedTable?.tableNumber}`}
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-2">
                                    <a
                                        href={qrCodeData || '#'}
                                        download={`table-${selectedTable?.tableNumber}-qr.png`}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3.5 bg-secondary hover:bg-secondary/70 rounded-2xl text-xs font-black uppercase transition-all",
                                            !qrCodeData && "pointer-events-none opacity-50"
                                        )}
                                    >
                                        <Download size={16} /> Save
                                    </a>
                                    <button
                                        onClick={handleRegenerateQR}
                                        className="flex items-center justify-center gap-2 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase transition-all"
                                    >
                                        <RefreshCw size={16} /> Reset
                                    </button>
                                </div>
                            </div>
                            <div className="bg-primary py-3 text-center">
                                <span className="text-[10px] text-primary-foreground font-black uppercase tracking-[0.2em]">Powered by GastroHub</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
