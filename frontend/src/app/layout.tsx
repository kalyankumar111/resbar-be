'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

// Note: Metadata cannot be exported from a client component. 
// For now, I'll move this if strictly necessary, but sticking to functionality first.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const isLoginPage = pathname === '/login';
  const showResponsiveSidebar = isAuthenticated && !isLoginPage;

  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "bg-background min-h-screen")}>
        {showResponsiveSidebar && <Sidebar />}
        <main className={cn("min-h-screen", showResponsiveSidebar && "pl-64")}>
          {showResponsiveSidebar && (
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground italic">Welcome back, {user?.name || 'User'}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
            </header>
          )}
          <div className={cn(isLoginPage ? "" : "p-8")}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
