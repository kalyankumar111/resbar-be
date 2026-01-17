'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    Settings,
    ChevronRight,
    LogOut,
    ChefHat,
    Smartphone,
    ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';
import { useAuthStore, UserRole } from '@/store/useAuthStore';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Staff Management',
        href: '/admin/staff',
        icon: Users,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Table Editor',
        href: '/admin/tables',
        icon: LayoutDashboard,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Menu Editor',
        href: '/admin/menu',
        icon: UtensilsCrossed,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Kitchen View',
        href: '/chef',
        icon: ChefHat,
        roles: ['chef', 'superadmin'],
    },
    {
        title: 'Active Orders',
        href: '/chef/orders',
        icon: ClipboardList,
        roles: ['chef', 'superadmin'],
    },
    {
        title: 'Table View',
        href: '/waiter',
        icon: Smartphone,
        roles: ['waiter', 'superadmin'],
    },
    {
        title: 'Create Order',
        href: '/waiter/new-order',
        icon: UtensilsCrossed,
        roles: ['waiter', 'superadmin'],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['admin', 'superadmin', 'chef', 'waiter'],
    },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [isHydrated, setIsHydrated] = React.useState(false);

    React.useEffect(() => {
        setIsHydrated(true);
    }, []);
    const role = user?.role;
    const roleString = role ? role.toLowerCase() : undefined;

    const filteredItems = navItems.filter((item) => {
        if (!roleString) return false;
        return item.roles.includes(roleString as UserRole);
    });

    const handleLogout = () => {
        Cookies.remove('gastrohub_auth_status');
        Cookies.remove('gastrohub_user_role');
        logout();
        router.push('/login');
    };

    if (!isHydrated) return null;

    return (
        <div className="h-screen w-64 bg-card/95 backdrop-blur-sm border-r-2 border-primary/10 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <UtensilsCrossed className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">GastroHub</h1>
                        <p className="text-xs text-muted-foreground capitalize">{role || 'User'} Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                            <span className="font-medium text-sm">{item.title}</span>
                            {isActive && (
                                <div className="absolute right-2">
                                    <ChevronRight className="w-4 h-4 opacity-70" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-destructive transition-colors duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};
