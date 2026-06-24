import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open:       boolean;
  onClose:    () => void;
  children:   ReactNode;
  /** Height of the sheet. Can be any valid CSS value like '80vh', '600px' */
  height?:    string;
  /** CSS classname to add to the sheet panel */
  className?: string;
}

/**
 * iOS-style bottom sheet that slides up from the bottom.
 * - Drag-handle at top
 * - Blurred backdrop
 * - Closes on backdrop click or ESC
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  height = '90vh',
  className = '',
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`bs-overlay${open ? ' bs-overlay--open' : ''}`}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`bs-panel ${className}`}
        style={{ maxHeight: height }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="bs-handle-bar">
          <div className="bs-handle" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
