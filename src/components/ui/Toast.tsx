import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Toast } from '../../types';

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useStore((s) => s.removeToast);
  const timerRef    = useRef<ReturnType<typeof setTimeout>>();
  const Icon        = ICONS[toast.type];

  useEffect(() => {
    timerRef.current = setTimeout(() => removeToast(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
