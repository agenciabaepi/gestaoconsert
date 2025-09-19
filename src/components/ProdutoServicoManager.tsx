'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiDollarSign, FiPackage, FiTool } from 'react-icons/fi';

interface Item {
  id?: string;
  nome: string;
  preco: number;
  quantidade: number;
  total: number;
  isNew?: boolean;
}

interface ProdutoServicoManagerProps {
  tipo: 'servico' | 'produto';
  itens: Item[];
  onItensChange: (itens: Item[]) => void;
  readonly?: boolean;
}

interface ProdutoServico {
  id: string;
  nome: string;
  preco: number;
  tipo: 'produto' | 'servico';
}

export default function ProdutoServicoManager({ 
  tipo, 
  itens, 
  onItensChange, 
  readonly = false 
}: ProdutoServicoManagerProps) {
  const { usuarioData } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para novo item
  const [novoItem, setNovoItem] = useState<Item>({
    nome: '',
    preco: 0,
    quantidade: 1,
    total: 0
  });

  const icon = tipo === 'servico' ? <FiTool size={20} /> : <FiPackage size={20} />;
  const title = tipo === 'servico' ? 'Serviços' : 'Produtos/Peças';
  const color = tipo === 'servico' ? 'green' : 'blue';

  // Filtrar produtos/serviços baseado na busca
  const filteredItems = produtosServicos.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (usuarioData?.empresa_id) {
      fetchProdutosServicos();
    }
  }, [usuarioData, tipo]);

  const fetchProdutosServicos = async () => {
    if (!usuarioData?.empresa_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos_servicos')
        .select('id, nome, preco, tipo')
        .eq('empresa_id', usuarioData.empresa_id)
        .eq('tipo', tipo)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar items:', error);
      } else {
        setProdutosServicos(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarItem = (item: ProdutoServico | null = null) => {
    const novoItemFinal: Item = item ? {
      id: item.id,
      nome: item.nome,
      preco: item.preco,
      quantidade: 1,
      total: item.preco
    } : {
      ...novoItem,
      total: novoItem.preco * novoItem.quantidade
    };

    const novosItens = [...itens, novoItemFinal];
    onItensChange(novosItens);
    
    setNovoItem({ nome: '', preco: 0, quantidade: 1, total: 0 });
    setShowAddForm(false);
  };

  const editarItem = (index: number, campo: keyof Item, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    if (campo === 'preco' || campo === 'quantidade') {
      novosItens[index].total = novosItens[index].preco * novosItens[index].quantidade;
    }
    
    onItensChange(novosItens);
  };

  const removerItem = async (index: number) => {
    const confirmed = await confirm({
      title: 'Remover Item',
      message: `Deseja remover "${itens[index].nome}"?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      const novosItens = itens.filter((_, i) => i !== index);
      onItensChange(novosItens);
    }
  };

  const cadastrarNovoItem = async () => {
    if (!novoItem.nome.trim()) {
      addToast('error', 'Nome é obrigatório');
      return;
    }
    
    if (!usuarioData?.empresa_id) {
      addToast('error', 'Erro: empresa não identificada');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('produtos_servicos')
        .insert({
          nome: novoItem.nome.trim(),
          preco: novoItem.preco,
          tipo: tipo,
          empresa_id: usuarioData.empresa_id
        })
        .select()
        .single();

      if (error) {
        addToast('error', 'Erro ao cadastrar item');
        return;
      }

      // Adicionar à lista local
      setProdutosServicos(prev => [...prev, data]);
      
      // Adicionar ao pedido
      adicionarItem(data);
      
      addToast('success', `${tipo === 'servico' ? 'Serviço' : 'Produto'} cadastrado e adicionado!`);
      
    } catch (error) {
      addToast('error', 'Erro ao salvar');
    }
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const preco = typeof item.preco === 'number' ? item.preco : parseFloat(String(item.preco));
      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : parseInt(String(item.quantidade));
      const totalItem = item.total ?? ((isNaN(preco) ? 0 : preco) * (isNaN(quantidade) ? 0 : quantidade));
      return total + (isNaN(totalItem) ? 0 : totalItem);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    const safe = typeof value === 'number' && !isNaN(value) ? value : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safe);
  };

  if (readonly && itens.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${color}-100 rounded-lg`}>
            <div className={`text-${color}-600`}>{icon}</div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        
        {!readonly && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors`}
          >
            <FiPlus size={16} />
            Adicionar
          </button>
        )}
      </div>

      {/* Lista de itens */}
      <div className="space-y-3 mb-4">
        {itens.map((item, index) => {
          const preco = typeof item.preco === 'number' ? item.preco : parseFloat(String(item.preco));
          const quantidade = typeof item.quantidade === 'number' ? item.quantidade : parseInt(String(item.quantidade));
          const totalItem = item.total ?? ((isNaN(preco) ? 0 : preco) * (isNaN(quantidade) ? 0 : quantidade));
          return (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              {editingIndex === index && !readonly ? (
                <input
                  type="text"
                  value={item.nome}
                  onChange={(e) => editarItem(index, 'nome', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  onBlur={() => setEditingIndex(null)}
                  autoFocus
                />
              ) : (
                <div 
                  className="font-medium text-gray-900 cursor-pointer"
                  onClick={() => !readonly && setEditingIndex(index)}
                >
                  {item.nome}
                </div>
              )}
            </div>
            
            <div className="w-20">
              {!readonly ? (
                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => editarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center"
                />
              ) : (
                <span className="text-sm text-gray-600">{item.quantidade}x</span>
              )}
            </div>
            
            <div className="w-24">
              {!readonly ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.preco}
                  onChange={(e) => editarItem(index, 'preco', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                />
              ) : (
                <span className="text-sm text-gray-600">{formatCurrency(item.preco)}</span>
              )}
            </div>
            
            <div className="w-24 text-right">
              <span className="font-semibold text-gray-900">
                {formatCurrency(totalItem)}
              </span>
            </div>
            
            {!readonly && (
              <button
                onClick={() => removerItem(index)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
          );
        })}
      </div>

      {/* Formulário de adicionar */}
      {showAddForm && !readonly && (
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium text-gray-900">Adicionar {tipo === 'servico' ? 'Serviço' : 'Produto'}</h4>
          
          {/* Buscar existente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar {tipo === 'servico' ? 'serviço' : 'produto'} existente
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Digite para buscar ${tipo === 'servico' ? 'serviços' : 'produtos'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {searchTerm && filteredItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredItems.slice(0, 10).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        adicionarItem(item);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium">{item.nome}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(item.preco)}</span>
                    </button>
                  ))}
                  {filteredItems.length > 10 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      +{filteredItems.length - 10} mais resultados...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Criar novo */}
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Ou criar novo:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome do item"
                value={novoItem.nome}
                onChange={(e) => setNovoItem(prev => ({ ...prev, nome: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={novoItem.preco}
                onChange={(e) => setNovoItem(prev => ({ 
                  ...prev, 
                  preco: parseFloat(e.target.value) || 0,
                  total: (parseFloat(e.target.value) || 0) * prev.quantidade
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                min="1"
                placeholder="Qtd"
                value={novoItem.quantidade}
                onChange={(e) => setNovoItem(prev => ({ 
                  ...prev, 
                  quantidade: parseInt(e.target.value) || 1,
                  total: prev.preco * (parseInt(e.target.value) || 1)
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={cadastrarNovoItem}
                className={`flex items-center gap-2 px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors`}
              >
                <FiPlus size={16} />
                Cadastrar e Adicionar
              </button>
              <button
                onClick={() => adicionarItem()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Só Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNovoItem({ nome: '', preco: 0, quantidade: 1, total: 0 });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      {itens.length > 0 && (
        <div className="border-t pt-4 flex justify-between items-center">
          <span className="font-medium text-gray-900">
            Total {title}: {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(calcularTotal())}
          </span>
        </div>
      )}
    </div>
  );
}
