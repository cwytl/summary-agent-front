// Toast 提示组件

import { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ visible, message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: type === 'success' ? '#dcfce7' : '#fef2f2',
        border: `1px solid ${type === 'success' ? '#86efac' : '#fecaca'}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 2000,
        fontSize: '14px',
        color: type === 'success' ? '#166534' : '#dc2626',
      }}
    >
      {type === 'success' ? (
        <CheckCircle size={18} color="#166534" />
      ) : (
        <XCircle size={18} color="#dc2626" />
      )}
      {message}
    </div>
  );
}