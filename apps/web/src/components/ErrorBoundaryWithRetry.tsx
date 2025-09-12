'use client';

import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { Button } from './Button';

interface ErrorStateProps {
  error?: any;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryAttempt?: number;
  maxAttempts?: number;
  title?: string;
  description?: string;
  showRetryButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  isRetrying = false,
  retryAttempt = 0,
  maxAttempts = 3,
  title = "Ops! Algo deu errado",
  description,
  showRetryButton = true
}) => {
  const getErrorMessage = () => {
    if (description) return description;
    
    if (error?.message?.includes('fetch')) {
      return "Não foi possível conectar com o servidor. Verifique sua conexão com a internet.";
    }
    
    if (error?.message?.includes('timeout')) {
      return "A requisição demorou muito para responder. Tente novamente.";
    }
    
    if (error?.code === 'PGRST301') {
      return "Dados não encontrados. Tente atualizar a página.";
    }
    
    return "Não foi possível carregar os dados. Tente novamente em alguns instantes.";
  };

  const getRetryButtonText = () => {
    if (isRetrying) {
      return retryAttempt > 0 ? `Tentando... (${retryAttempt}/${maxAttempts})` : 'Tentando...';
    }
    return retryAttempt > 0 ? `Tentar novamente (${retryAttempt}/${maxAttempts})` : 'Tentar novamente';
  };

  const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6">
          {isNetworkError ? (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <FiWifiOff className="w-8 h-8 text-red-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {getErrorMessage()}
        </p>

        {/* Retry Info */}
        {retryAttempt > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
              {isRetrying ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tentando reconectar...</span>
                </>
              ) : (
                <>
                  <FiWifi className="w-4 h-4" />
                  <span>Tentativa {retryAttempt} de {maxAttempts}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Retry Button */}
        {showRetryButton && onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center space-x-2"
          >
            {isRetrying ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiRefreshCw className="w-4 h-4" />
            )}
            <span>{getRetryButtonText()}</span>
          </Button>
        )}

        {/* Technical Details (Development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Carregando...",
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center">
        {/* Spinner */}
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-4">{message}</p>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
