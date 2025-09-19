'use client';

import TrialLimitGuard from './TrialLimitGuard';

// Exemplo de como usar o TrialLimitGuard em páginas de criação
export default function TrialLimitExample() {
  return (
    <div className="space-y-6">
      {/* Exemplo para criação de clientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Cliente</h3>
        <TrialLimitGuard tipo="clientes">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Adicionar Cliente
          </button>
        </TrialLimitGuard>
      </div>

      {/* Exemplo para criação de produtos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Produto</h3>
        <TrialLimitGuard tipo="produtos">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Adicionar Produto
          </button>
        </TrialLimitGuard>
      </div>

      {/* Exemplo para criação de serviços */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Serviço</h3>
        <TrialLimitGuard tipo="servicos">
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            Adicionar Serviço
          </button>
        </TrialLimitGuard>
      </div>

      {/* Exemplo para criação de ordens */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Nova OS</h3>
        <TrialLimitGuard tipo="ordens">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Criar OS
          </button>
        </TrialLimitGuard>
      </div>

      {/* Exemplo para criação de fornecedores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Fornecedor</h3>
        <TrialLimitGuard tipo="fornecedores">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Adicionar Fornecedor
          </button>
        </TrialLimitGuard>
      </div>

      {/* Exemplo para criação de usuários */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Usuário</h3>
        <TrialLimitGuard tipo="usuarios">
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
            Adicionar Usuário
          </button>
        </TrialLimitGuard>
      </div>
    </div>
  );
} 