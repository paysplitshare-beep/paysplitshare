import { useStore } from '../store/useStore';
import type { ToastType } from '../types';

export function useToast() {
  const addToast    = useStore((s) => s.addToast);
  const removeToast = useStore((s) => s.removeToast);

  const toast = {
    success: (message: string, duration?: number) =>
      addToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      addToast(message, 'error', duration ?? 5000),
    warning: (message: string, duration?: number) =>
      addToast(message, 'warning', duration),
    info: (message: string, duration?: number) =>
      addToast(message, 'info', duration),
    custom: (message: string, type: ToastType, duration?: number) =>
      addToast(message, type, duration),
  };

  return { toast, dismiss: removeToast };
}
