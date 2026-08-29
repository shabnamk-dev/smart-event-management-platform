import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {/* Accessible Toast Container with ARIA Live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '380px',
          width: 'calc(100% - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${
                toast.type === 'success'
                  ? 'var(--status-success-border)'
                  : toast.type === 'error'
                  ? 'var(--status-danger-border)'
                  : 'var(--border-medium)'
              }`,
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'error' && <AlertCircle size={18} color="var(--status-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'info' && <Info size={18} color="var(--brand-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />}

            <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.4 }}>{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
