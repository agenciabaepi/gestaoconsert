import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  type: ToastType;
  content: string;
}

interface ToastContextProps {
  addToast: (type: ToastType, content: string) => void;
  showModal: (opts: { title: string; message?: string; messageNode?: ReactNode; confirmLabel?: string; onConfirm?: () => void; onClose?: () => void }) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

let toastCount = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [modal, setModal] = useState<{ title: string; message?: string; messageNode?: ReactNode; confirmLabel?: string; onConfirm?: () => void; onClose?: () => void } | null>(null);

  const addToast = useCallback((type: ToastType, content: string) => {
    const id = ++toastCount;
    setToasts(prev => [...prev, { id, type, content }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const showModal = useCallback((opts: { title: string; message?: string; messageNode?: ReactNode; confirmLabel?: string; onConfirm?: () => void; onClose?: () => void }) => {
    setModal({ title: opts.title, message: opts.message, messageNode: opts.messageNode, confirmLabel: opts.confirmLabel, onConfirm: opts.onConfirm, onClose: opts.onClose });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, showModal }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
        {toasts.map(({ id, type, content }) => (
          <div
            key={id}
            className={`flex items-center max-w-xs w-full p-4 rounded-lg shadow-lg transition-all ${
              type === 'success' ? 'bg-green-100 text-green-800' :
              type === 'error' ? 'bg-red-100 text-red-800' :
              type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            <span className="flex-1 text-sm">{content}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== id))}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200">
            <button
              aria-label="Fechar"
              className="absolute right-3 top-3 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => {
                const oc = modal.onClose;
                setModal(null);
                if (oc) oc();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
            </button>
            <div className="text-lg font-semibold mb-2">{modal.title}</div>
            <div className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">
              {modal.messageNode ? modal.messageNode : modal.message}
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900"
                onClick={() => {
                  const cb = modal.onConfirm;
                  setModal(null);
                  if (cb) cb();
                }}
              >
                {modal.confirmLabel || 'Ok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};