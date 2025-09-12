import React, { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TurnoCaixa } from '@/hooks/useCaixa';
import { FiLock, FiAlertTriangle } from 'react-icons/fi';

interface FecharCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (valorFechamento: number, valorTroco: number, observacoes?: string) => Promise<void>;
  turno: TurnoCaixa;
  saldoEsperado: number;
  loading?: boolean;
}

export const FecharCaixaModal: React.FC<FecharCaixaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  turno,
  saldoEsperado,
  loading = false
}) => {
  const [valorFechamento, setValorFechamento] = useState('');
  const [valorTroco, setValorTroco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularDiferenca = () => {
    const valor = parseFloat(valorFechamento.replace(',', '.'));
    if (isNaN(valor)) return 0;
    return valor - saldoEsperado;
  };

  const getDiferencaStatus = () => {
    const diferenca = calcularDiferenca();
    if (diferenca === 0) return { color: 'text-green-600', text: 'Caixa confere' };
    if (diferenca > 0) return { color: 'text-blue-600', text: 'Sobra' };
    return { color: 'text-red-600', text: 'Falta' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const valor = parseFloat(valorFechamento.replace(',', '.'));
    const troco = parseFloat(valorTroco.replace(',', '.')) || 0;
    
    if (isNaN(valor) || valor < 0) {
      setErro('Valor de fechamento deve ser um número válido');
      return;
    }

    if (troco < 0) {
      setErro('Valor de troco deve ser positivo');
      return;
    }

    if (troco > valor) {
      setErro('Valor de troco não pode ser maior que o valor em caixa');
      return;
    }

    try {
      await onConfirm(valor, troco, observacoes || undefined);
      setValorFechamento('');
      setValorTroco('');
      setObservacoes('');
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao fechar caixa');
    }
  };

  if (!isOpen) return null;

  const diferenca = calcularDiferenca();
  const status = getDiferencaStatus();

  return (
    <Dialog onClose={onClose}>
      <div className="p-6 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <FiLock className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Fechar Caixa</h2>
            <p className="text-sm text-gray-500">Confira os valores antes de fechar</p>
          </div>
        </div>

        {/* Resumo do Turno */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Resumo do Turno</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Valor de Abertura:</span>
              <span className="font-medium">{formatCurrency(turno.valor_abertura)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total de Vendas:</span>
              <span className="font-medium text-green-600">{formatCurrency(turno.valor_vendas)}</span>
            </div>
            <div className="flex justify-between">
              <span>Suprimentos:</span>
              <span className="font-medium text-blue-600">{formatCurrency(turno.valor_suprimentos)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sangrias:</span>
              <span className="font-medium text-red-600">-{formatCurrency(turno.valor_sangrias)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Saldo Esperado:</span>
              <span>{formatCurrency(saldoEsperado)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor em Caixa *
            </label>
            <Input
              type="text"
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              placeholder="0,00"
              required
              className="text-right"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Conte o dinheiro físico no caixa
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor para Troco do Próximo Dia
            </label>
            <Input
              type="text"
              value={valorTroco}
              onChange={(e) => setValorTroco(e.target.value)}
              placeholder="0,00"
              className="text-right"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor que ficará para abertura do próximo turno
            </p>
          </div>

          {valorFechamento && (
            <div className={`bg-gray-50 rounded-lg p-3 ${diferenca !== 0 ? 'border-l-4 ' + (diferenca > 0 ? 'border-blue-500' : 'border-red-500') : ''}`}>
              <div className="flex items-center gap-2">
                {diferenca !== 0 && <FiAlertTriangle className="w-4 h-4" />}
                <span className="text-sm font-medium">Diferença:</span>
                <span className={`font-bold ${status.color}`}>
                  {diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}
                </span>
                <span className={`text-xs ${status.color}`}>({status.text})</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o fechamento do caixa (opcional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}; 