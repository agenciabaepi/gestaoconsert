"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import MenuLayout from '@/components/MenuLayout';
import { FiPlus, FiEdit, FiTrash2, FiChevronDown, FiChevronRight, FiFolder, FiTag, FiGrid } from 'react-icons/fi';

interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id: string;
  created_at: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  grupo_id: string;
  empresa_id: string;
  created_at: string;
  grupo?: {
    nome: string;
  };
}

interface Subcategoria {
  id: string;
  nome: string;
  descricao?: string;
  categoria_id: string;
  empresa_id: string;
  created_at: string;
  categoria?: {
    nome: string;
  };
}

export default function CategoriasPage() {
  const { usuarioData } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  // Estados
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modais
  const [modalGrupo, setModalGrupo] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalSubcategoria, setModalSubcategoria] = useState(false);

  // Estados para formulários
  const [formGrupo, setFormGrupo] = useState({ nome: '', descricao: '' });
  const [formCategoria, setFormCategoria] = useState({ nome: '', descricao: '', grupo_id: '' });
  const [formSubcategoria, setFormSubcategoria] = useState({ nome: '', descricao: '', categoria_id: '' });

  // Estados para edição
  const [editandoGrupo, setEditandoGrupo] = useState<Grupo | null>(null);
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null);
  const [editandoSubcategoria, setEditandoSubcategoria] = useState<Subcategoria | null>(null);

  // Estados para expansão
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());

  // Carregar dados
  useEffect(() => {
    if (usuarioData?.empresa_id) {
      carregarDados();
    }
  }, [usuarioData]);

  // Verificar se as tabelas existem
  useEffect(() => {
    const verificarTabelas = async () => {
      try {
        // Tentar carregar dados para verificar se as tabelas existem
        await carregarDados();
      } catch (error) {
        console.error('Erro ao verificar tabelas:', error);
        addToast('error', 'As tabelas de categorias ainda não foram criadas. Execute o SQL no Supabase primeiro.');
      }
    };

    if (usuarioData?.empresa_id) {
      verificarTabelas();
    }
  }, [usuarioData]);

  const carregarDados = async () => {
    // Verificação de null adicionada
    if (!usuarioData?.empresa_id) {
      console.error('Dados do usuário não disponíveis');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Carregar grupos
      const { data: gruposData } = await supabase
        .from('grupos_produtos')
        .select('*')
        .eq('empresa_id', usuarioData.empresa_id)
        .order('nome');

      // Carregar categorias
      const { data: categoriasData } = await supabase
        .from('categorias_produtos')
        .select(`
          *,
          grupo:grupos_produtos(nome)
        `)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('nome');

      // Carregar subcategorias
      const { data: subcategoriasData } = await supabase
        .from('subcategorias_produtos')
        .select(`
          *,
          categoria:categorias_produtos(nome)
        `)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('nome');

      setGrupos(gruposData || []);
      setCategorias(categoriasData || []);
      setSubcategorias(subcategoriasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      addToast('error', 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  // Funções para grupos
  const salvarGrupo = async () => {
    if (!formGrupo.nome.trim()) {
      addToast('error', 'Nome do grupo é obrigatório');
      return;
    }

    // Verificação de null adicionada
    if (!usuarioData?.empresa_id) {
      addToast('error', 'Dados do usuário não disponíveis');
      return;
    }

    try {
      if (editandoGrupo) {
        await supabase
          .from('grupos_produtos')
          .update({
            nome: formGrupo.nome,
            descricao: formGrupo.descricao
          })
          .eq('id', editandoGrupo.id);
        addToast('success', 'Grupo atualizado com sucesso!');
      } else {
        await supabase
          .from('grupos_produtos')
          .insert({
            nome: formGrupo.nome,
            descricao: formGrupo.descricao,
            empresa_id: usuarioData.empresa_id
          });
        addToast('success', 'Grupo criado com sucesso!');
      }

      setModalGrupo(false);
      setFormGrupo({ nome: '', descricao: '' });
      setEditandoGrupo(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      addToast('error', 'Erro ao salvar grupo');
    }
  };

  const excluirGrupo = async (grupo: Grupo) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o grupo "${grupo.nome}"? Esta ação também excluirá todas as categorias e subcategorias relacionadas.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await supabase
        .from('grupos_produtos')
        .delete()
        .eq('id', grupo.id);
      
      addToast('success', 'Grupo excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      addToast('error', 'Erro ao excluir grupo');
    }
  };

  // Funções para categorias
  const salvarCategoria = async () => {
    if (!formCategoria.nome.trim() || !formCategoria.grupo_id) {
      addToast('error', 'Nome e grupo são obrigatórios');
      return;
    }

    // Verificação de null adicionada
    if (!usuarioData?.empresa_id) {
      addToast('error', 'Dados do usuário não disponíveis');
      return;
    }

    try {
      if (editandoCategoria) {
        await supabase
          .from('categorias_produtos')
          .update({
            nome: formCategoria.nome,
            descricao: formCategoria.descricao,
            grupo_id: formCategoria.grupo_id
          })
          .eq('id', editandoCategoria.id);
        addToast('success', 'Categoria atualizada com sucesso!');
      } else {
        await supabase
          .from('categorias_produtos')
          .insert({
            nome: formCategoria.nome,
            descricao: formCategoria.descricao,
            grupo_id: formCategoria.grupo_id,
            empresa_id: usuarioData.empresa_id
          });
        addToast('success', 'Categoria criada com sucesso!');
      }

      setModalCategoria(false);
      setFormCategoria({ nome: '', descricao: '', grupo_id: '' });
      setEditandoCategoria(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      addToast('error', 'Erro ao salvar categoria');
    }
  };

  const excluirCategoria = async (categoria: Categoria) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a categoria "${categoria.nome}"? Esta ação também excluirá todas as subcategorias relacionadas.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await supabase
        .from('categorias_produtos')
        .delete()
        .eq('id', categoria.id);
      
      addToast('success', 'Categoria excluída com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      addToast('error', 'Erro ao excluir categoria');
    }
  };

  // Funções para subcategorias
  const salvarSubcategoria = async () => {
    if (!formSubcategoria.nome.trim() || !formSubcategoria.categoria_id) {
      addToast('error', 'Nome e categoria são obrigatórios');
      return;
    }

    // Verificação de null adicionada
    if (!usuarioData?.empresa_id) {
      addToast('error', 'Dados do usuário não disponíveis');
      return;
    }

    try {
      if (editandoSubcategoria) {
        await supabase
          .from('subcategorias_produtos')
          .update({
            nome: formSubcategoria.nome,
            descricao: formSubcategoria.descricao,
            categoria_id: formSubcategoria.categoria_id
          })
          .eq('id', editandoSubcategoria.id);
        addToast('success', 'Subcategoria atualizada com sucesso!');
      } else {
        await supabase
          .from('subcategorias_produtos')
          .insert({
            nome: formSubcategoria.nome,
            descricao: formSubcategoria.descricao,
            categoria_id: formSubcategoria.categoria_id,
            empresa_id: usuarioData.empresa_id
          });
        addToast('success', 'Subcategoria criada com sucesso!');
      }

      setModalSubcategoria(false);
      setFormSubcategoria({ nome: '', descricao: '', categoria_id: '' });
      setEditandoSubcategoria(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      addToast('error', 'Erro ao salvar subcategoria');
    }
  };

  const excluirSubcategoria = async (subcategoria: Subcategoria) => {
    const confirmed = await confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a subcategoria "${subcategoria.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await supabase
        .from('subcategorias_produtos')
        .delete()
        .eq('id', subcategoria.id);
      
      addToast('success', 'Subcategoria excluída com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      addToast('error', 'Erro ao excluir subcategoria');
    }
  };

  // Funções auxiliares
  const toggleGrupo = (grupoId: string) => {
    const novosExpandidos = new Set(gruposExpandidos);
    if (novosExpandidos.has(grupoId)) {
      novosExpandidos.delete(grupoId);
    } else {
      novosExpandidos.add(grupoId);
    }
    setGruposExpandidos(novosExpandidos);
  };

  const toggleCategoria = (categoriaId: string) => {
    const novosExpandidos = new Set(categoriasExpandidas);
    if (novosExpandidos.has(categoriaId)) {
      novosExpandidos.delete(categoriaId);
    } else {
      novosExpandidos.add(categoriaId);
    }
    setCategoriasExpandidas(novosExpandidos);
  };

  const abrirModalGrupo = (grupo?: Grupo) => {
    if (grupo) {
      setEditandoGrupo(grupo);
      setFormGrupo({ nome: grupo.nome, descricao: grupo.descricao || '' });
    } else {
      setEditandoGrupo(null);
      setFormGrupo({ nome: '', descricao: '' });
    }
    setModalGrupo(true);
  };

  const abrirModalCategoria = (categoria?: Categoria) => {
    if (categoria) {
      setEditandoCategoria(categoria);
      setFormCategoria({ 
        nome: categoria.nome, 
        descricao: categoria.descricao || '', 
        grupo_id: categoria.grupo_id 
      });
    } else {
      setEditandoCategoria(null);
      setFormCategoria({ nome: '', descricao: '', grupo_id: '' });
    }
    setModalCategoria(true);
  };

  const abrirModalSubcategoria = (subcategoria?: Subcategoria) => {
    if (subcategoria) {
      setEditandoSubcategoria(subcategoria);
      setFormSubcategoria({ 
        nome: subcategoria.nome, 
        descricao: subcategoria.descricao || '', 
        categoria_id: subcategoria.categoria_id 
      });
    } else {
      setEditandoSubcategoria(null);
      setFormSubcategoria({ nome: '', descricao: '', categoria_id: '' });
    }
    setModalSubcategoria(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <MenuLayout>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorias de Produtos</h1>
            <p className="text-gray-600">Gerencie grupos, categorias e subcategorias dos seus produtos</p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-4 mb-6">
            <Button onClick={() => abrirModalGrupo()} className="flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Novo Grupo
            </Button>
            <Button onClick={() => abrirModalCategoria()} variant="secondary" className="flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Nova Categoria
            </Button>
            <Button onClick={() => abrirModalSubcategoria()} variant="outline" className="flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Nova Subcategoria
            </Button>
          </div>

          {/* Lista hierárquica */}
          <div className="bg-white rounded-lg shadow-lg border">
            {grupos.map(grupo => {
              const categoriasDoGrupo = categorias.filter(cat => cat.grupo_id === grupo.id);
              const isExpanded = gruposExpandidos.has(grupo.id);

              return (
                <div key={grupo.id} className="border-b border-gray-200 last:border-b-0">
                  {/* Grupo */}
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleGrupo(grupo.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                      </button>
                      <FiFolder className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{grupo.nome}</h3>
                        {grupo.descricao && (
                          <p className="text-sm text-gray-600">{grupo.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModalCategoria()}
                        className="text-xs"
                      >
                        <FiPlus className="w-3 h-3 mr-1" />
                        Categoria
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModalGrupo(grupo)}
                      >
                        <FiEdit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => excluirGrupo(grupo)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Categorias do grupo */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {categoriasDoGrupo.map(categoria => {
                        const subcategoriasDaCategoria = subcategorias.filter(sub => sub.categoria_id === categoria.id);

                        const isCategoriaExpanded = categoriasExpandidas.has(categoria.id);

                        return (
                          <div key={categoria.id} className="border-b border-gray-200 last:border-b-0">
                            <div className="flex items-center justify-between p-4 pl-12">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCategoria(categoria.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  {isCategoriaExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                                </button>
                                <FiTag className="w-4 h-4 text-green-500" />
                                <div>
                                  <h4 className="font-medium text-gray-800">{categoria.nome}</h4>
                                  {categoria.descricao && (
                                    <p className="text-sm text-gray-600">{categoria.descricao}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalSubcategoria()}
                                  className="text-xs"
                                >
                                  <FiPlus className="w-3 h-3 mr-1" />
                                  Subcategoria
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalCategoria(categoria)}
                                >
                                  <FiEdit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => excluirCategoria(categoria)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Subcategorias da categoria */}
                            {isCategoriaExpanded && subcategoriasDaCategoria.length > 0 && (
                              <div className="bg-white border-t border-gray-200">
                                {subcategoriasDaCategoria.map(subcategoria => (
                                  <div key={subcategoria.id} className="flex items-center justify-between p-4 pl-20 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-3">
                                      <FiGrid className="w-4 h-4 text-purple-500" />
                                      <div>
                                        <h5 className="font-medium text-gray-700">{subcategoria.nome}</h5>
                                        {subcategoria.descricao && (
                                          <p className="text-sm text-gray-500">{subcategoria.descricao}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => abrirModalSubcategoria(subcategoria)}
                                      >
                                        <FiEdit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => excluirSubcategoria(subcategoria)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <FiTrash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {grupos.length === 0 && (
              <div className="text-center py-12">
                <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo criado</h3>
                <p className="text-gray-600 mb-4">Comece criando um grupo para organizar seus produtos</p>
                <Button onClick={() => abrirModalGrupo()}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </div>
            )}
          </div>
        </div>
      </MenuLayout>

      {/* Modais fora do MenuLayout */}
      {/* Modal Grupo */}
      {modalGrupo && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editandoGrupo ? 'Editar Grupo' : 'Novo Grupo'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input
                  value={formGrupo.nome}
                  onChange={(e) => setFormGrupo({ ...formGrupo, nome: e.target.value })}
                  placeholder="Nome do grupo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={formGrupo.descricao}
                  onChange={(e) => setFormGrupo({ ...formGrupo, descricao: e.target.value })}
                  placeholder="Descrição do grupo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={salvarGrupo} className="flex-1">
                {editandoGrupo ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setModalGrupo(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoria */}
      {modalCategoria && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editandoCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <select
                  value={formCategoria.grupo_id}
                  onChange={(e) => setFormCategoria({ ...formCategoria, grupo_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um grupo</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input
                  value={formCategoria.nome}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={formCategoria.descricao}
                  onChange={(e) => setFormCategoria({ ...formCategoria, descricao: e.target.value })}
                  placeholder="Descrição da categoria"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={salvarCategoria} className="flex-1">
                {editandoCategoria ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setModalCategoria(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subcategoria */}
      {modalSubcategoria && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editandoSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formSubcategoria.categoria_id}
                  onChange={(e) => setFormSubcategoria({ ...formSubcategoria, categoria_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input
                  value={formSubcategoria.nome}
                  onChange={(e) => setFormSubcategoria({ ...formSubcategoria, nome: e.target.value })}
                  placeholder="Nome da subcategoria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={formSubcategoria.descricao}
                  onChange={(e) => setFormSubcategoria({ ...formSubcategoria, descricao: e.target.value })}
                  placeholder="Descrição da subcategoria"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={salvarSubcategoria} className="flex-1">
                {editandoSubcategoria ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setModalSubcategoria(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}