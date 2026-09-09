import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { icon: CheckCircle2, iconCls: 'text-emerald-500', barCls: 'bg-emerald-500' },
  error: { icon: XCircle, iconCls: 'text-red-500', barCls: 'bg-red-500' },
  info: { icon: Info, iconCls: 'text-brand-500', barCls: 'bg-brand-500' },
};

const ToastItem = ({ toast, onDismiss }) => {
  const { icon: Icon, iconCls, barCls } = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div className="relative flex items-start gap-2.5 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden pointer-events-auto animate-[fieldFadeIn_.2s_ease]">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${barCls}`} />
      <div className="flex items-start gap-2.5 p-3.5 pl-4 flex-1 min-w-0">
        <Icon size={18} className={`shrink-0 mt-0.5 ${iconCls}`} />
        <p className="text-sm text-gray-700 leading-snug break-words flex-1">{toast.message}</p>
        <button onClick={() => onDismiss(toast.id)} className="shrink-0 p-0.5 text-gray-300 hover:text-gray-500 rounded">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message, type) => {
    const id = ++idRef.current;
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = useRef({
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
    info: (message) => push(message, 'info'),
  }).current;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 && createPortal((
        <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </div>
      ), document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside ToastProvider');
  return toast;
};
