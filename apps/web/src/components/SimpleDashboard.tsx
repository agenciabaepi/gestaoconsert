'use client';

import { useAuth } from '@/context/AuthContext';
// import { usePreventInfiniteLoop } from '@/hooks/usePreventInfiniteLoop';

export default function SimpleDashboard() {
  const { user, session, usuarioData, empresaData, loading } = useAuth();
  
  // ✅ USAR HOOK DE PREVENÇÃO DE LOOPS INFINITOS
  // const { renderCount, isLoopDetected, resetCounter } = usePreventInfiniteLoop({
  //   maxRenders: 50,
  //   maxTime: 5000,
  //   onLoopDetected: () => {
  //     console.error('🚨 SimpleDashboard: Loop infinito detectado!');
  //     // Forçar re-render com dados limpos
  //     window.location.reload();
  //   }
  // });
  
  // ✅ VERSÃO SIMPLIFICADA SEM HOOK REMOVIDO
  const renderCount = 0;
  const isLoopDetected = false;
  const resetCounter = () => {};

  // ✅ MOSTRAR ALERTA SE LOOP FOR DETECTADO
  if (isLoopDetected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="text-red-500 text-6xl mb-4">🚨</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Loop Infinito Detectado!</h1>
          <p className="text-red-600 mb-6">
            O componente está renderizando em loop. Renderizações: {renderCount}
          </p>
          <div className="space-x-4">
            <button
              onClick={resetCounter}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Resetar Contador
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
          <p className="text-xs text-gray-500 mt-2">SimpleDashboard - Loading: {loading}</p>
          <p className="text-xs text-gray-500">Render #: {renderCount}</p>
          {renderCount > 20 && (
            <p className="text-xs text-yellow-600 mt-2">⚠️ Muitas renderizações: {renderCount}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Simplificado</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Renderizações: {renderCount}</span>
            <button
              onClick={resetCounter}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Resetar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status da Autenticação</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Usuário:</span>
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? '✅ Logado' : '❌ Não logado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sessão:</span>
                <span className={session ? 'text-green-600' : 'text-red-600'}>
                  {session ? '✅ Ativa' : '❌ Inativa'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Dados do Usuário:</span>
                <span className={usuarioData ? 'text-green-600' : 'text-red-600'}>
                  {usuarioData ? '✅ Carregados' : '❌ Não carregados'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Dados da Empresa:</span>
                <span className={empresaData ? 'text-green-600' : 'text-red-600'}>
                  {empresaData ? '✅ Carregados' : '❌ Não carregados'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Usuário</h3>
            {usuarioData ? (
              <div className="space-y-2">
                <div><strong>Nome:</strong> {usuarioData.nome}</div>
                <div><strong>Email:</strong> {usuarioData.email}</div>
                <div><strong>Nível:</strong> {usuarioData.nivel}</div>
                <div><strong>Empresa ID:</strong> {usuarioData.empresa_id}</div>
              </div>
            ) : (
              <p className="text-gray-500">Dados não disponíveis</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações da Empresa</h3>
            {empresaData ? (
              <div className="space-y-2">
                <div><strong>Nome:</strong> {empresaData.nome}</div>
                <div><strong>Plano:</strong> {empresaData.plano}</div>
                <div><strong>ID:</strong> {empresaData.id}</div>
              </div>
            ) : (
              <p className="text-gray-500">Dados não disponíveis</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Debug Info</h3>
          <div className="text-sm text-blue-700">
            <div>Renderizações: {renderCount}</div>
            <div>Loading: {loading ? 'Sim' : 'Não'}</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
            <div>Status: {isLoopDetected ? '🚨 LOOP!' : renderCount > 20 ? '⚠️ ATENÇÃO' : '✅ NORMAL'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
