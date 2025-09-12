'use client';

import React from 'react';
import { FiCheck, FiX, FiTool } from 'react-icons/fi';

interface NotificacaoFixa {
  id: string;
  mensagem: string;
  os_id: string;
  created_at: string;
}

interface NotificacoesFixasProps {
  notificacoes: NotificacaoFixa[];
  onMarcarAvisado: (id: string) => void;
}

export default function NotificacoesFixas({ notificacoes, onMarcarAvisado }: NotificacoesFixasProps) {
  if (notificacoes.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notificacoes.map((notificacao) => (
        <div
          key={notificacao.id}
          className="bg-green-50 border-2 border-green-300 rounded-lg p-4 shadow-xl animate-pulse"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FiTool className="h-6 w-6 text-green-600 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">
                ⚠️ ATENÇÃO: Reparo Concluído!
              </p>
              <p className="text-sm text-green-700 mt-2">
                {notificacao.mensagem}
              </p>
              <p className="text-xs text-green-600 mt-2">
                <strong>Data:</strong> {new Date(notificacao.created_at).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-green-600 mt-1">
                <strong>Status:</strong> Aguardando aviso ao cliente
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => onMarcarAvisado(notificacao.id)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                title="Marcar cliente como avisado"
              >
                <FiCheck className="h-4 w-4 mr-2" />
                Cliente Avisado
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
