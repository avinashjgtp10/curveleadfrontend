import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

const ConfirmDialogContext = createContext(null);

const DEFAULT_CONFIRM = {
  title: 'Are you sure?',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    setDialog({ ...DEFAULT_CONFIRM, ...options });
    return new Promise(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog && createPortal((
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => close(false)} />
          <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-2xl">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Trash2 size={17} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-gray-900">{dialog.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{dialog.message}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => close(false)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {dialog.cancelText}
                </button>
                <button
                  onClick={() => close(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Trash2 size={14} />
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = () => {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) throw new Error('useConfirmDialog must be used inside ConfirmDialogProvider');
  return confirm;
};
