import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    RefreshCw,
    MoreVertical,
    Check,
    X,
    AlertCircle,
    UtensilsCrossed,
    Layers,
    Circle,
    ChevronRight,
    Filter
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    isAvailable: boolean;
}

interface Category {
    _id: string;
    name: string;
    isActive: boolean;
    items?: MenuItem[];
}

interface Settings {
    currency: string;
}

export default function MenuPage() {
    const { request } = useApi();
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [activeTab, setActiveTab] = useState<'categories' | 'items'>('items');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [settings, setSettings] = useState<Settings | null>(null);

    // Modal states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Category | MenuItem | null>(null);

    // Form states
    const [categoryName, setCategoryName] = useState('');
    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        categoryName: '', // Plain text category field in backend
        image: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const getCurrencySymbol = (currencyCode: string) => {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            default: return '$';
        }
    };

    const formatCurrency = (amount: number) => {
        if (!settings) return `$${amount.toFixed(2)}`; // Fallback
        const symbol = getCurrencySymbol(settings.currency);
        return `${symbol}${amount.toFixed(2)}`;
    };

    const currencySymbol = settings ? getCurrencySymbol(settings.currency) : '$';

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catsData, itemsData, settingsData] = await Promise.all([
                request('/menu/categories'),
                request('/menu/items'),
                request('/settings')
            ]);
            setCategories(catsData);
            setItems(itemsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to fetch menu data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEntity && 'name' in editingEntity && !('price' in editingEntity)) {
                await request(`/menu/categories/${editingEntity._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name: categoryName }),
                });
            } else {
                await request('/menu/categories', {
                    method: 'POST',
                    body: JSON.stringify({ name: categoryName }),
                });
            }
            setIsCategoryModalOpen(false);
            setCategoryName('');
            setEditingEntity(null);
            fetchData();
        } catch (error) {
            alert('Failed to save category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...itemForm,
                price: parseFloat(itemForm.price),
                category: itemForm.categoryName || categories.find(c => c._id === itemForm.categoryId)?.name
            };

            if (editingEntity && 'price' in editingEntity) {
                await request(`/menu/items/${editingEntity._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await request('/menu/items', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            setIsItemModalOpen(false);
            setItemForm({ name: '', description: '', price: '', categoryId: '', categoryName: '', image: '' });
            setEditingEntity(null);
            fetchData();
        } catch (error) {
            alert('Failed to save menu item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Deleting a category will NOT delete items but might disconnect them. Continue?')) return;
        try {
            await request(`/menu/categories/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await request(`/menu/items/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            alert('Failed to delete item');
        }
    };

    const toggleAvailability = async (id: string) => {
        try {
            await request(`/menu/items/${id}/availability`, { method: 'PUT' });
            // Optimized: just update local state
            setItems(items.map(item => item._id === id ? { ...item, isAvailable: !item.isAvailable } : item));
        } catch (error) {
            alert('Failed to toggle availability');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory ||
            item.category === categories.find(c => c._id === selectedCategory)?.name;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
                    <p className="text-muted-foreground mt-1">Design your dishes and organize your kitchen</p>
                </div>
                <div className="flex bg-secondary/50 p-1.5 rounded-2xl border border-border">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            activeTab === 'items' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UtensilsCrossed size={16} /> Dishes
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            activeTab === 'categories' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Layers size={16} /> Categories
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 'items' ? (
                <div className="space-y-6">
                    {/* Item Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-card/50 p-4 rounded-2xl border border-border/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-secondary/30 border border-border rounded-xl py-2.5 px-4 outline-none focus:border-primary/50 transition-all font-medium min-w-[160px]"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setEditingEntity(null);
                                    setItemForm({ name: '', description: '', price: '', categoryId: '', categoryName: '', image: '' });
                                    setIsItemModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
                            >
                                <Plus size={20} /> New Dish
                            </button>
                        </div>
                    </div>

                    {/* Items Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-64 rounded-3xl bg-secondary/30 animate-pulse border border-border" />
                            ))}
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredItems.map(item => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card group flex flex-col h-full"
                                >
                                    <div className="relative h-40 overflow-hidden bg-secondary/50 rounded-t-[2rem]">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                <UtensilsCrossed size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-white/10">
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                            <div className="flex bg-primary/10 px-2 py-1 rounded-lg text-primary font-black text-sm">
                                                {formatCurrency(item.price)}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-6 flex-1 italic">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                                            <button
                                                onClick={() => toggleAvailability(item._id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border",
                                                    item.isAvailable
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                )}
                                            >
                                                <Circle size={8} fill="currentColor" />
                                                {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                                            </button>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingEntity(item);
                                                        setItemForm({
                                                            name: item.name,
                                                            description: item.description,
                                                            price: item.price.toString(),
                                                            categoryId: categories.find(c => c.name === item.category)?._id || '',
                                                            categoryName: item.category,
                                                            image: item.image || ''
                                                        });
                                                        setIsItemModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item._id)}
                                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border/50">
                            <h3 className="text-xl font-bold">No dishes found</h3>
                            <p className="text-muted-foreground mt-1">Try a different search or add a new recipe</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                            setEditingEntity(null);
                            setCategoryName('');
                            setIsCategoryModalOpen(true);
                        }}
                        className="h-40 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all bg-secondary/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs">New Category</span>
                    </motion.button>

                    {categories.map(cat => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 h-40 flex flex-col justify-between group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                    <Layers size={24} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingEntity(cat);
                                            setCategoryName(cat.name);
                                            setIsCategoryModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(cat._id)}
                                        className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="font-bold text-xl">{cat.name}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">{items.filter(i => i.category === cat.name).length} Dishes Total</p>
                                </div>
                                <ChevronRight className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal - Category */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold">{editingEntity ? 'Edit' : 'New'} Category</h3>
                                    <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCategorySubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-[0.2em]">Category Name</label>
                                        <input
                                            type="text"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Breakfast, Desserts"
                                            required
                                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-5 outline-none focus:border-primary transition-all font-bold text-lg"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Category'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal - Item */}
            <AnimatePresence>
                {isItemModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsItemModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl relative z-[61] overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold">{editingEntity ? 'Update Dish' : 'Create New Dish'}</h3>
                                    <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Dish Name</label>
                                            <input
                                                type="text"
                                                value={itemForm.name}
                                                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                                required
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Price ({currencySymbol})</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={itemForm.price}
                                                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                                required
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Category</label>
                                            <select
                                                value={itemForm.categoryId}
                                                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                                                required
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-bold appearance-none"
                                            >
                                                <option value="">Select a category</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Description</label>
                                            <textarea
                                                rows={4}
                                                value={itemForm.description}
                                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-medium text-xs resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest">Image URL (Optional)</label>
                                            <input
                                                type="text"
                                                value={itemForm.image}
                                                onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:border-primary transition-all font-medium text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Processing...' : (editingEntity ? 'Update Menu Item' : 'Add to Menu')}
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
