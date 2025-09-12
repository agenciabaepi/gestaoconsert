"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import MenuLayout from '@/components/MenuLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
}

export default function FornecedoresPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  });

  // Carregar fornecedores
  const carregarFornecedores = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      const { data: usuarioData, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        addToast('error', 'Erro ao buscar dados do usuário');
        return;
      }

      if (!usuarioData?.empresa_id) {
        addToast('error', 'Empresa não encontrada. Verifique se você está associado a uma empresa.');
        return;
      }

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('empresa_id', usuarioData.empresa_id)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar fornecedores:', error);
        addToast('error', 'Erro ao carregar fornecedores');
        return;
      }

      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      addToast('error', 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se tabela existe
  useEffect(() => {
    const verificarTabela = async () => {
      try {
        const { error } = await supabase
          .from('fornecedores')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Erro ao verificar tabela fornecedores:', error);
          if (error.code === '42P01') {
            addToast('error', 'Tabela de fornecedores não encontrada. Execute o SQL de criação primeiro.');
          } else {
            addToast('error', `Erro ao verificar tabela: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        addToast('error', 'Erro ao verificar tabela de fornecedores');
      }
    };

    verificarTabela();
  }, [addToast]);

  useEffect(() => {
    if (user) {
      carregarFornecedores();
    }
  }, [user]);

  // Filtrar fornecedores
  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para adicionar/editar
  const abrirModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor);
      setFormData({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj || '',
        telefone: fornecedor.telefone || '',
        celular: fornecedor.celular || '',
        email: fornecedor.email || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        cep: fornecedor.cep || '',
        observacoes: fornecedor.observacoes || ''
      });
    } else {
      setEditingFornecedor(null);
      setFormData({
        nome: '',
        cnpj: '',
        telefone: '',
        celular: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: ''
      });
    }
    setShowModal(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setShowModal(false);
    setEditingFornecedor(null);
    setFormData({
      nome: '',
      cnpj: '',
      telefone: '',
      celular: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: ''
    });
  };

  // Salvar fornecedor
  const salvarFornecedor = async () => {
    if (!formData.nome.trim()) {
      addToast('error', 'Nome do fornecedor é obrigatório');
      return;
    }

    try {
      if (!user?.id) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!usuarioData?.empresa_id) {
        addToast('error', 'Empresa não encontrada. Verifique se você está associado a uma empresa.');
        return;
      }

      const payload = {
        ...formData,
        empresa_id: usuarioData.empresa_id
      };

      if (editingFornecedor) {
        // Atualizar
        const { error } = await supabase
          .from('fornecedores')
          .update(payload)
          .eq('id', editingFornecedor.id);

        if (error) {
          console.error('Erro ao atualizar fornecedor:', error);
          addToast('error', 'Erro ao atualizar fornecedor');
          return;
        }

        addToast('success', 'Fornecedor atualizado com sucesso!');
      } else {
        // Criar novo
        const { error } = await supabase
          .from('fornecedores')
          .insert(payload);

        if (error) {
          console.error('Erro ao criar fornecedor:', error);
          addToast('error', 'Erro ao criar fornecedor');
          return;
        }

        addToast('success', 'Fornecedor criado com sucesso!');
      }

      fecharModal();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      addToast('error', 'Erro ao salvar fornecedor');
    }
  };

  // Excluir fornecedor
  const excluirFornecedor = async (fornecedor: Fornecedor) => {
    const confirmed = await confirm({
      title: 'Excluir Fornecedor',
      message: `Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedor.id);

      if (error) {
        console.error('Erro ao excluir fornecedor:', error);
        addToast('error', 'Erro ao excluir fornecedor');
        return;
      }

      addToast('success', 'Fornecedor excluído com sucesso!');
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      addToast('error', 'Erro ao excluir fornecedor');
    }
  };

  // Alternar status ativo/inativo
  const alternarStatus = async (fornecedor: Fornecedor) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ ativo: !fornecedor.ativo })
        .eq('id', fornecedor.id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        addToast('error', 'Erro ao alterar status');
        return;
      }

      addToast('success', `Fornecedor ${fornecedor.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      addToast('error', 'Erro ao alterar status');
    }
  };

  return (
    <MenuLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <Button onClick={() => abrirModal()}>
            <FiPlus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de fornecedores */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/UF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <tr key={fornecedor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fornecedor.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {fornecedor.cnpj || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div>{fornecedor.telefone || '-'}</div>
                          <div className="text-xs text-gray-400">{fornecedor.celular || '-'}</div>
                          <div className="text-xs text-gray-400">{fornecedor.email || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {fornecedor.cidade && fornecedor.estado 
                            ? `${fornecedor.cidade}/${fornecedor.estado}`
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          fornecedor.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => alternarStatus(fornecedor)}
                            className={`px-3 py-1 text-xs rounded ${
                              fornecedor.ativo
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {fornecedor.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => abrirModal(fornecedor)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirFornecedor(fornecedor)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {fornecedoresFiltrados.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum fornecedor encontrado para a busca.' : 'Nenhum fornecedor cadastrado.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar Fornecedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <Input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <Input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <Input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular
                  </label>
                  <Input
                    type="text"
                    value={formData.celular}
                    onChange={(e) => setFormData({...formData, celular: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <Input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <Input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Endereço completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <Input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <Input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Observações adicionais"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={fecharModal}
                >
                  Cancelar
                </Button>
                <Button onClick={salvarFornecedor}>
                  {editingFornecedor ? 'Atualizar' : 'Criar'} Fornecedor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MenuLayout>
  );
}