import { createStore } from 'zustand/vanilla'

export const counterStore = createStore((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
    dec: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),
}))
