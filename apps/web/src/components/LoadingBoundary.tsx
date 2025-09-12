import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, usuarioData, loading } = useAuth();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    // Se usuário está logado mas dados não carregaram após 10 segundos
    if (user && !usuarioData && !loading) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [user, usuarioData, loading]);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (user && !usuarioData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Problema no carregamento
          </h3>
          <p className="text-gray-600 mb-4">
            Os dados do usuário não puderam ser carregados.
          </p>
          {showRetry && (
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};