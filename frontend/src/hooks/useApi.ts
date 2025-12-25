'use client';

import { useAuthStore } from '@/store/useAuthStore';

export const useApi = () => {
    const { token, logout } = useAuthStore();
    const baseUrl = 'http://localhost:5000/api';

    const request = async (endpoint: string, options: RequestInit = {}) => {
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
        } catch (error: any) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    };

    return { request };
};
