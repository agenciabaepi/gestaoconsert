import React, { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface DialogProps {
  children: ReactNode;
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg relative max-w-full w-auto"
        onClick={e => e.stopPropagation()} // Impede que clique dentro feche
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Fechar"
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Dialog; 