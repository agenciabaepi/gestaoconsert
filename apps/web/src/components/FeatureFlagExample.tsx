'use client';

import { useAuth } from '@/context/AuthContext';
import { podeUsarFuncionalidade, isUsuarioTeste } from '@/config/featureFlags';

export default function FeatureFlagExample() {
  const { usuarioData } = useAuth();

  // Verificar se o usuário é um usuário de teste
  const usuarioTeste = isUsuarioTeste(usuarioData);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🔬 Exemplo de Feature Flags</h2>
      
      {/* Status do usuário */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Status do Usuário</h3>
        <div className="space-y-2">
          <p><strong>Nome:</strong> {usuarioData?.nome || 'N/A'}</p>
          <p><strong>Nível:</strong> {usuarioData?.nivel || 'N/A'}</p>
          <p><strong>Usuário de Teste:</strong> {usuarioTeste ? '✅ Sim' : '❌ Não'}</p>
          {usuarioTeste && (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-800 font-medium">🎉 <strong>ACESSO TOTAL!</strong></p>
              <p className="text-green-700 text-sm">Você tem acesso a todas as funcionalidades do sistema + funcionalidades em desenvolvimento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Funcionalidades disponíveis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Funcionalidades Disponíveis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Conversas WhatsApp */}
          <div className={`p-4 rounded-lg border-2 ${
            podeUsarFuncionalidade(usuarioData, "conversas_whatsapp") 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-2">💬 Conversas WhatsApp</h4>
            <p className="text-sm text-gray-600 mb-2">
              Sistema de conversas integrado com WhatsApp
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                podeUsarFuncionalidade(usuarioData, "conversas_whatsapp")
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {podeUsarFuncionalidade(usuarioData, "conversas_whatsapp") ? 'Disponível' : 'Indisponível'}
              </span>
              {podeUsarFuncionalidade(usuarioData, "conversas_whatsapp") && (
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition">
                  Acessar
                </button>
              )}
            </div>
          </div>

          {/* Relatório Novo */}
          <div className={`p-4 rounded-lg border-2 ${
            podeUsarFuncionalidade(usuarioData, "relatorio_novo") 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-2">📊 Relatório Novo</h4>
            <p className="text-sm text-gray-600 mb-2">
              Sistema de relatórios avançado com gráficos
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                podeUsarFuncionalidade(usuarioData, "relatorio_novo")
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {podeUsarFuncionalidade(usuarioData, "relatorio_novo") ? 'Disponível' : 'Indisponível'}
              </span>
              {podeUsarFuncionalidade(usuarioData, "relatorio_novo") && (
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition">
                  Acessar
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Avançado */}
          <div className={`p-4 rounded-lg border-2 ${
            podeUsarFuncionalidade(usuarioData, "dashboard_avancado") 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-2">📈 Dashboard Avançado</h4>
            <p className="text-sm text-gray-600 mb-2">
              Dashboard com métricas avançadas e KPIs
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                podeUsarFuncionalidade(usuarioData, "dashboard_avancado")
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {podeUsarFuncionalidade(usuarioData, "dashboard_avancado") ? 'Disponível' : 'Indisponível'}
              </span>
              {podeUsarFuncionalidade(usuarioData, "dashboard_avancado") && (
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition">
                  Acessar
                </button>
              )}
            </div>
          </div>

          {/* Analytics Empresa */}
          <div className={`p-4 rounded-lg border-2 ${
            podeUsarFuncionalidade(usuarioData, "analytics_empresa") 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <h4 className="font-semibold mb-2">📊 Analytics Empresa</h4>
            <p className="text-sm text-gray-600 mb-2">
              Análises avançadas de performance da empresa
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                podeUsarFuncionalidade(usuarioData, "analytics_empresa")
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {podeUsarFuncionalidade(usuarioData, "analytics_empresa") ? 'Disponível' : 'Indisponível'}
              </span>
              {podeUsarFuncionalidade(usuarioData, "analytics_empresa") && (
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition">
                  Acessar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Como usar */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">💡 Como Usar</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>isUsuarioTeste(usuario)</strong> - Verifica se o usuário é de teste</p>
          <p>• <strong>podeUsarFuncionalidade(usuario, "nome_funcionalidade")</strong> - Verifica se pode usar uma funcionalidade específica</p>
          <p>• As funcionalidades só aparecem para usuários com nível "usuarioteste"</p>
          <p>• Para adicionar novas funcionalidades, edite o arquivo <code>src/config/featureFlags.ts</code></p>
        </div>
      </div>
    </div>
  );
}
