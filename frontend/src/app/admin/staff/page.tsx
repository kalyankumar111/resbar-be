'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    UserPlus,
    Edit2,
    Trash2,
    RefreshCw,
    X,
    Shield,
    Mail,
    User as UserIcon,
    MoreVertical,
    Check,
    AlertCircle
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface Role {
    _id: string;
    name: string;
    permissions: string[];
}

interface User {
    _id: string;
    name: string;
    email: string;
    roleId: Role;
    isActive: boolean;
    createdAt: string;
}

export default function StaffPage() {
    const { request } = useApi();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersData, rolesData] = await Promise.all([
                request('/users'),
                request('/roles')
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error('Failed to fetch staff data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (editingUser) {
                await request(`/users/${editingUser._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        roleId: formData.roleId,
                    }),
                });
            } else {
                await request('/users', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to remove ${user.name}? This action cannot be undone.`)) return;
        try {
            await request(`/users/${user._id}`, { method: 'DELETE' });
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', roleId: '' });
        setEditingUser(null);
        setError('');
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.roleId?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'superadmin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'admin': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'chef': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'waiter': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">Manage team members, roles, and access permissions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus size={20} /> Add Team Member
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card/50 p-4 rounded-2xl border border-border/50">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all font-medium"
                    />
                </div>
                <button
                    onClick={fetchData}
                    className="p-3 hover:bg-secondary rounded-xl transition-colors border border-border text-muted-foreground"
                >
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Staff List */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-secondary/30 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
                                    <th className="px-8 py-5">Team Member</th>
                                    <th className="px-8 py-5">Role</th>
                                    <th className="px-8 py-5">Joined</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-3 py-1 rounded-lg border",
                                                getRoleColor(user.roleId?.name || '')
                                            )}>
                                                {user.roleId?.name || 'No Role'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">ID: {user._id.slice(-6)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setFormData({
                                                            name: user.name,
                                                            email: user.email,
                                                            password: '',
                                                            roleId: user.roleId?._id || '',
                                                        });
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2.5 hover:bg-rose-500/10 rounded-xl transition-all text-rose-500/60 hover:text-rose-500"
                                                    title="Remove Member"
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center text-muted-foreground mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold">No team members found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            We couldn't find any staff matching your search. Try adjusting your filters or add a new member.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                            {editingUser ? <Edit2 size={24} /> : <UserPlus size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">{editingUser ? 'Edit Member' : 'Add Member'}</h3>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">
                                                {editingUser ? 'Update account details' : 'Create a new team account'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-3">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Full Name</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="John Doe"
                                                    required
                                                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="john@example.com"
                                                    required
                                                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {!editingUser && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Temporary Password</label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="••••••••"
                                                    required
                                                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 px-5 outline-none focus:border-primary transition-all font-bold"
                                                />
                                            </div>
                                        )}
                                        <div className={cn("space-y-2", editingUser && "md:col-span-2")}>
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Assign Role</label>
                                            <div className="relative">
                                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <select
                                                    value={formData.roleId}
                                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                                    required
                                                    className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select a role...</option>
                                                    {roles.map(role => (
                                                        <option key={role._id} value={role._id}>{role.name.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <RefreshCw size={20} className="animate-spin" />
                                            ) : (
                                                editingUser ? 'Update Staff Member' : 'Create Account'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
