'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const role = user?.role;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (role) {
      router.push(`/${role === 'superadmin' ? 'admin' : role}`);
    }
  }, [role, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-muted-foreground">Initializing Management Portal...</h2>
      </div>
    </div>
  );
}
