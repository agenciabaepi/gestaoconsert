import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { FiDollarSign, FiInfo } from 'react-icons/fi';

interface AbrirCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (valorAbertura: number, observacoes?: string) => Promise<void>;
  loading?: boolean;
  valorTrocoSugerido?: number;
  obrigatorio?: boolean; // Não permite fechar sem abrir caixa
}

export const AbrirCaixaModal: React.FC<AbrirCaixaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  valorTrocoSugerido = 0,
  obrigatorio = false
}) => {
  const [valorAbertura, setValorAbertura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (valorTrocoSugerido > 0) {
      setValorAbertura(valorTrocoSugerido.toString());
    }
  }, [valorTrocoSugerido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const valor = parseFloat(valorAbertura.replace(',', '.'));
    
    if (isNaN(valor) || valor < 0) {
      setErro('Valor de abertura deve ser um número válido');
      return;
    }

    try {
      await onConfirm(valor, observacoes || undefined);
      setValorAbertura('');
      setObservacoes('');
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao abrir caixa');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog onClose={obrigatorio ? () => {} : onClose}>
      <div className="p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-full">
            <FiDollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {obrigatorio ? 'Caixa Fechado' : 'Abrir Caixa'}
            </h2>
            <p className="text-sm text-gray-500">
              {obrigatorio ? 'É necessário abrir o caixa para continuar' : 'Informe o valor inicial do caixa'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {valorTrocoSugerido > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Troco do turno anterior: <strong>R$ {valorTrocoSugerido.toFixed(2)}</strong>
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Este valor foi sugerido automaticamente baseado no fechamento anterior
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor de Abertura *
            </label>
            <Input
              type="text"
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              placeholder="0,00"
              required
              className="text-right"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a abertura do caixa (opcional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
              disabled={loading}
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {!obrigatorio && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              className={obrigatorio ? "w-full" : "flex-1"}
              disabled={loading}
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}; 