import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Toast, ToastType } from '../types';

interface AppState {
  // ── Auth ──────────────────────────────────────────────────
  user:           User | null;
  setUser:        (user: User | null) => void;
  isAuthLoading:  boolean;
  setAuthLoading: (loading: boolean) => void;

  // ── Theme ──────────────────────────────────────────────────
  isDarkMode:    boolean;
  toggleDarkMode: () => void;

  // ── Toasts ────────────────────────────────────────────────
  toasts:      Toast[];
  addToast:    (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // ── Auth ──────────────────────────────────────────────────
  user:          null,
  setUser:       (user) => set({ user }),
  isAuthLoading: true,
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  // ── Theme ──────────────────────────────────────────────────
  isDarkMode: (() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    // Apply immediately on init
    if (dark) document.documentElement.classList.add('dark');
    return dark;
  })(),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return { isDarkMode: newMode };
    }),

  // ── Toasts ────────────────────────────────────────────────
  toasts: [],
  addToast: (message, type = 'success', duration = 3500) =>
    set((state) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      return { toasts: [...state.toasts, { id, message, type, duration }] };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
