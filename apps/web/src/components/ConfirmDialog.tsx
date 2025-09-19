import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextProps {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextProps | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>(resolve => {
      setResolver(() => resolve);
    });
  };

  const handleClose = (result: boolean) => {
    if (resolver) resolver(result);
    setOptions(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            {options.title && <h3 className="text-lg font-semibold mb-2">{options.title}</h3>}
            <p className="mb-4">{options.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              >
                {options.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className="px-4 py-2 rounded bg-[#cffb6d] text-black"
              >
                {options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ((options: ConfirmOptions) => Promise<boolean>) => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context.confirm;
};