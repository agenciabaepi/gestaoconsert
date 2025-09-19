'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

export class OSErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para monitoramento
    console.group('🚨 OSErrorBoundary - Erro capturado');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Boundary Props:', this.props);
    console.groupEnd();

    this.setState({
      error,
      errorInfo
    });

    // Callback personalizado de erro
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Erro no callback onError:', callbackError);
      }
    }

    // Auto-retry para erros específicos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development' && this.shouldAutoRetry(error)) {
      this.scheduleAutoRetry();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset quando resetKeys mudam
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, idx) => prevResetKeys[idx] !== key);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset quando props mudam (se habilitado)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  shouldAutoRetry = (error: Error): boolean => {
    // Lista de erros que podem ser resolvidos com retry
    const retryableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      'Failed to fetch'
    ];

    return retryableErrors.some(errorType => 
      error.message?.includes(errorType) || error.name?.includes(errorType)
    );
  };

  scheduleAutoRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
      
      this.retryTimeoutId = setTimeout(() => {
        console.log(`🔄 Auto-retry ${retryCount + 1}/${maxRetries} em ${delay}ms`);
        this.handleRetry();
      }, delay);
    }
  };

  resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: ''
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      console.warn('🚫 Máximo de tentativas atingido');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Fallback customizado
      if (fallback) {
        return fallback;
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Algo deu errado
            </h1>
            
            <p className="text-gray-600 mb-6">
              {process.env.NODE_ENV === 'development' 
                ? error.message
                : 'Encontramos um erro inesperado. Nossa equipe foi notificada.'
              }
            </p>

            {retryCount < maxRetries && (
              <div className="mb-4">
                <Button
                  onClick={this.handleRetry}
                  className="w-full mb-3"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente ({retryCount}/{maxRetries})
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <FiHome className="w-4 h-4 mr-2" />
                Início
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes técnicos
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC para envolver componentes com Error Boundary
 */
export const withOSErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <OSErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </OSErrorBoundary>
  );
  
  WrappedComponent.displayName = `withOSErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default OSErrorBoundary;