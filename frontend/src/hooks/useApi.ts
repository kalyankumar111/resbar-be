'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export const useApi = () => {
    // Use selectors for stability
    const token = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://resbar-be-w6dk.vercel.app/api';

    const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                logout();
                window.location.href = '/login';
                throw new Error('Session expired');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error: unknown) {
            console.error(`API Error [${endpoint}]:`, error);
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(String(error));
            }
        }
    }, [token, logout, baseUrl]);

    return { request };
};
