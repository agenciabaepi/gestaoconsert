'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MenuLayout from '@/components/MenuLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface CatalogoItem {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  ativo: boolean;
  updated_at: string | null;
  imagem_url?: string | null;
}

interface CatalogoCategoria {
  id: string;
  empresa_id: string;
  nome: string;
  ordem: number | null;
  ativo: boolean | null;
}

export default function CatalogoPage() {
  const { empresaData, usuarioData } = useAuth();
  const empresaId = empresaData?.id;
  const [habilitado, setHabilitado] = useState<boolean>(true);
  const [itens, setItens] = useState<CatalogoItem[]>([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modo] = useState<'cards' | 'tabela'>('tabela');
  const [form, setForm] = useState<{ imagemFile: File | null; imagemPreview: string | null; titulo: string; preco: string; descricao: string; categoriaNome: string }>(
    { imagemFile: null, imagemPreview: null, titulo: '', preco: '', descricao: '', categoriaNome: '' }
  );
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [categoriasDb, setCategoriasDb] = useState<CatalogoCategoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [editForm, setEditForm] = useState<{ imagemFile: File | null; imagemPreview: string | null; titulo: string; preco: string; descricao: string; categoriaNome: string }>(
    { imagemFile: null, imagemPreview: null, titulo: '', preco: '', descricao: '', categoriaNome: '' }
  );
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    // Timeout para evitar travamento infinito
    const timeoutId = setTimeout(() => {
      setError('Tempo limite excedido. Tente recarregar a página.');
      setLoading(false);
    }, 15000); // 15 segundos

    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // buscar toggle
        const { data: conf, error: confError } = await supabase
          .from('configuracoes_empresa')
          .select('catalogo_habilitado')
          .eq('empresa_id', empresaId)
          .single();
        
        if (confError) {
          console.warn('Erro ao buscar configuração:', confError);
        } else if (conf && typeof conf.catalogo_habilitado === 'boolean') {
          setHabilitado(conf.catalogo_habilitado);
        }

        // buscar itens
        const { data: itensData, error: itensError } = await supabase
          .from('catalogo_itens')
          .select('id, empresa_id, titulo, descricao, preco, categoria, ativo, updated_at, imagem_url')
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .order('categoria', { ascending: true })
          .order('titulo', { ascending: true });
        
        if (itensError) {
          console.error('Erro ao buscar itens:', itensError);
          setError(`Erro ao carregar itens: ${itensError.message}`);
        } else {
          setItens((itensData || []) as CatalogoItem[]);
          }

        // buscar categorias do catálogo
        const { data: cats, error: catsError } = await supabase
          .from('catalogo_categorias')
          .select('id, empresa_id, nome, ordem, ativo')
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .order('ordem', { ascending: true })
          .order('nome', { ascending: true });
        
        if (catsError) {
          console.warn('Erro ao buscar categorias:', catsError);
        } else {
          setCategoriasDb((cats || []) as CatalogoCategoria[]);
          }
        
        clearTimeout(timeoutId);
        setLoading(false);
        
      } catch (error) {
        console.error('Erro geral no carregamento:', error);
        setError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    })();

    return () => clearTimeout(timeoutId);
  }, [empresaId]);

  const categorias = useMemo(() => {
    const fromDb = categoriasDb.map(c => c.nome?.trim()).filter(Boolean) as string[];
    const fromItems = (itens || []).map(i => (i.categoria || '').trim()).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromItems]));
  }, [itens, categoriasDb]);
  const filtrados = useMemo(() => {
    return (itens || []).filter(i => {
      const mBusca = !busca || i.titulo.toLowerCase().includes(busca.toLowerCase()) || (i.descricao || '').toLowerCase().includes(busca.toLowerCase());
      const mCat = !categoria || (i.categoria || '') === categoria;
      return mBusca && mCat;
    });
  }, [itens, busca, categoria]);

  const agrupadosPorCategoria = useMemo(() => {
    const groups = new Map<string, CatalogoItem[]>();
    filtrados.forEach((i) => {
      const key = (i.categoria || 'Outros').trim() || 'Outros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    // Ordenar por nome de categoria e por título
    return Array.from(groups.entries())
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([cat, arr]) => [cat, arr.sort((x,y) => (x.titulo||'').localeCompare(y.titulo||''))] as [string, CatalogoItem[]]);
  }, [filtrados]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

  const podeGerenciar = (usuarioData?.nivel || '').toLowerCase() === 'admin';

  const onSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return setForm(prev => ({ ...prev, imagemFile: null, imagemPreview: null }));
    const url = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, imagemFile: file, imagemPreview: url }));
  };

  const salvarItem = async () => {
    if (!empresaId) return;
    if (!form.titulo || !form.preco) return;
    setSalvandoItem(true);
    try {
      let imagemUrl: string | null = null;
      if (form.imagemFile) {
        const path = `empresa-${empresaId}/${Date.now()}_${form.imagemFile.name}`;
        const { error: upErr } = await supabase.storage.from('catalogo').upload(path, form.imagemFile);
        if (upErr) throw new Error('Falha no upload da imagem (crie o bucket "catalogo" no Supabase).');
        const { data } = supabase.storage.from('catalogo').getPublicUrl(path);
        imagemUrl = data.publicUrl;
      }
      const precoNumber = Number(String(form.preco).replace(',', '.')) || 0;
      const payload: any = {
        empresa_id: empresaId,
        titulo: form.titulo,
        descricao: form.descricao || null,
        preco: precoNumber,
        categoria: form.categoriaNome || null,
        imagem_url: imagemUrl,
        ativo: true
      };
      const { data, error } = await supabase
        .from('catalogo_itens')
        .insert(payload)
        .select('id, empresa_id, titulo, descricao, preco, categoria, ativo, updated_at, imagem_url')
        .single();
      if (error) throw error;
      setItens(prev => [ ...(prev || []), data as any ]);
      setForm({ imagemFile: null, imagemPreview: null, titulo: '', preco: '', descricao: '', categoriaNome: '' });
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar item');
    } finally {
      setSalvandoItem(false);
    }
  };

  const adicionarCategoria = async () => {
    if (!empresaId) return;
    const nome = (novaCategoria || '').trim();
    if (!nome) return;
    setSalvandoCategoria(true);
    try {
      const payload = { empresa_id: empresaId, nome, ativo: true } as any;
      const { data, error } = await supabase
        .from('catalogo_categorias')
        .insert(payload)
        .select('id, empresa_id, nome, ordem, ativo')
        .single();
      if (error) throw error;
      setCategoriasDb(prev => [...prev, data as any]);
      setNovaCategoria('');
    } catch (e: any) {
      alert(e?.message || 'Erro ao adicionar categoria');
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const onSelectEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return setEditForm(prev => ({ ...prev, imagemFile: null, imagemPreview: null }));
    const url = URL.createObjectURL(file);
    setEditForm(prev => ({ ...prev, imagemFile: file, imagemPreview: url }));
  };

  function storagePathFromUrl(publicUrl?: string | null): string | null {
    if (!publicUrl) return null;
    const idx = publicUrl.indexOf('/catalogo/');
    if (idx === -1) return null;
    return publicUrl.substring(idx + '/catalogo/'.length);
  }

  const iniciarEdicao = (item: CatalogoItem) => {
    setEditingItem(item);
    setEditForm({
      imagemFile: null,
      imagemPreview: null,
      titulo: item.titulo || '',
      preco: String(item.preco || ''),
      descricao: item.descricao || '',
      categoriaNome: item.categoria || ''
    });
  };

  const salvarEdicao = async () => {
    if (!empresaId || !editingItem) return;
    setSalvandoEdicao(true);
    try {
      let imagemUrl: string | undefined = undefined;
      if (editForm.imagemFile) {
        // Upload nova e remover antiga
        const path = `empresa-${empresaId}/${Date.now()}_${editForm.imagemFile.name}`;
        const { error: upErr } = await supabase.storage.from('catalogo').upload(path, editForm.imagemFile, { upsert: false });
        if (upErr) throw new Error('Falha no upload da imagem');
        const { data } = supabase.storage.from('catalogo').getPublicUrl(path);
        imagemUrl = data.publicUrl;
        // remover antiga
        const oldPath = storagePathFromUrl((editingItem as any).imagem_url);
        if (oldPath) {
          await supabase.storage.from('catalogo').remove([oldPath]);
        }
      }
      const precoNumber = Number(String(editForm.preco).replace(',', '.')) || 0;
      const payload: any = {
        titulo: editForm.titulo,
        descricao: editForm.descricao || null,
        preco: precoNumber,
        categoria: editForm.categoriaNome || null,
      };
      if (typeof imagemUrl === 'string') payload.imagem_url = imagemUrl;
      const { error } = await supabase
        .from('catalogo_itens')
        .update(payload)
        .eq('id', editingItem.id)
        .eq('empresa_id', empresaId);
      if (error) throw error;
      // Atualiza lista local
      setItens(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
      setEditingItem(null);
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar edição');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const excluirItem = async (item: CatalogoItem) => {
    if (!empresaId) return;
    const ok = window.confirm('Deseja realmente excluir este item do catálogo?');
    if (!ok) return;
    try {
      const { error } = await supabase
        .from('catalogo_itens')
        .delete()
        .eq('id', item.id)
        .eq('empresa_id', empresaId);
      if (error) throw error;
      const oldPath = storagePathFromUrl((item as any).imagem_url);
      if (oldPath) {
        await supabase.storage.from('catalogo').remove([oldPath]);
      }
      setItens(prev => prev.filter(i => i.id !== item.id));
    } catch (e: any) {
      alert(e?.message || 'Erro ao excluir');
    }
  };

  if (!empresaId) {
    return <div className="p-6 text-gray-500">Carregando...</div>;
  }

  if (loading) {
    return (
      <MenuLayout>
        <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1FE6E] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando catálogo...</p>
              <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
            </div>
          </div>
        </div>
      </MenuLayout>
    );
  }

  if (error) {
    return (
      <MenuLayout>
        <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-[#D1FE6E] text-black rounded-lg hover:bg-[#B8E55A] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
        <div className="p-6 lg:p-8 print:p-6 bg-gray-50 min-h-screen">
          {/* Header Melhorado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
                  <p className="text-gray-600 mt-1">Gerencie e visualize os valores dos serviços da sua empresa de forma organizada</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  onClick={() => {
                    // Garantir que os dados estão no localStorage antes de abrir
                    if (empresaData) {
                      localStorage.setItem('empresaData', JSON.stringify(empresaData));
                    }
                    if (usuarioData) {
                      localStorage.setItem('usuarioData', JSON.stringify(usuarioData));
                    }
                    window.open('/catalogo/imprimir', '_blank');
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir / PDF
                </button>
              </div>
            </div>

            {!habilitado && (
              <div className="mt-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  O catálogo está desabilitado nas configurações da empresa.
                </div>
              </div>
            )}
          </div>

          {/* Formulário de Adição Melhorado (somente admin) */}
          {podeGerenciar && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-[#D1FE6E] to-[#B8E55A] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Adicionar Novo Serviço</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informações básicas */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Serviço *</label>
                    <input 
                      value={form.titulo} 
                      onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors" 
                      placeholder="Ex.: Formatação completa do sistema" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">R$</span>
                        <input 
                          value={form.preco} 
                          onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))} 
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors" 
                          placeholder="120,00" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                      <select 
                        value={form.categoriaNome} 
                        onChange={e => setForm(prev => ({ ...prev, categoriaNome: e.target.value }))} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categorias.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea 
                      value={form.descricao} 
                      onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors" 
                      rows={3}
                      placeholder="Descreva os detalhes do serviço (opcional)" 
                    />
                  </div>
                </div>

                {/* Upload de imagem e categorias */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Serviço</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {form.imagemPreview ? (
                        <div className="space-y-4">
                          <img src={form.imagemPreview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                          <p className="text-sm text-gray-500">Clique para alterar a imagem</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500">Clique para selecionar uma imagem</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={onSelectImage} className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  </div>

                  {/* Gestão de Categorias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Categorias Existentes</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {categorias.map(c => (
                        <span key={c} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        value={novaCategoria} 
                        onChange={e => setNovaCategoria(e.target.value)} 
                        placeholder="Nome da nova categoria" 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors" 
                      />
                      <button 
                        onClick={adicionarCategoria} 
                        disabled={salvandoCategoria || !novaCategoria.trim()} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-300"
                      >
                        {salvandoCategoria ? 'Salvando...' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={salvarItem} 
                  disabled={salvandoItem || !form.titulo.trim() || !form.preco.trim()} 
                  className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {salvandoItem ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Adicionar Serviço
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Filtros Melhorados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filtros e Busca</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Serviço</label>
                <div className="relative">
                  <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Digite o nome do serviço..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Categoria</label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition-colors"
                >
                  <option value="">📋 Todas as categorias</option>
                  {categorias.map(c => (
                    <option key={c} value={c}>📁 {c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resultados</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">
                      {itens.length} {itens.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cabeçalho para impressão */}
          <div className="hidden print:block print-container">
            <div className="print-header">
              <div>
                <div className="empresa">{empresaData?.nome || 'Consert Assistência Técnica'}</div>
                <div className="subtitle">Catálogo de Serviços</div>
                {empresaData?.cnpj && (
                  <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2pt' }}>
                    CNPJ: {empresaData.cnpj}
                  </div>
                )}
                {empresaData?.endereco && (
                  <div style={{ fontSize: '9pt', color: '#6b7280' }}>
                    {empresaData.endereco}
                  </div>
                )}
                {empresaData?.telefone && (
                  <div style={{ fontSize: '9pt', color: '#6b7280' }}>
                    Telefone: {empresaData.telefone}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {empresaData?.logo_url && (
                  <img src={empresaData.logo_url} alt="Logo" className="print-logo" />
                )}
                <div style={{ fontSize: '10pt', color: '#6b7280', textAlign: 'right' }}>
                  <div>Gerado em: {new Date().toLocaleDateString('pt-BR')}</div>
                  <div>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
            {/* Bloco estilo menu para impressão */}
            <div className="menu-grid">
              {agrupadosPorCategoria.map(([cat, arr]) => (
                <section key={`m-${cat}`} className="menu-section">
                  <div className="menu-section-title">{cat}</div>
                  {arr.map((i) => (
                    <div key={`mi-${i.id}`} className="menu-item">
                      <div className="menu-item-name">{i.titulo}</div>
                      <div className="menu-item-fill"></div>
                      <div className="menu-item-price">{formatCurrency(i.preco)}</div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm catalogo-box screen-only">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Itens cadastrados</div>
              <div className="text-xs text-gray-500">{filtrados.length} itens</div>
            </div>
            <table className="min-w-full catalogo-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Imagem</th>
                  <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Categoria</th>
                  <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Serviço</th>
                  <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Descrição</th>
                  <th className="text-right text-xs font-medium text-gray-600 px-3 py-2 border-b">Preço</th>
                  {podeGerenciar && (<th className="no-print text-right text-xs font-medium text-gray-600 px-3 py-2 border-b">Ações</th>)}
                </tr>
              </thead>
              <tbody>
                {agrupadosPorCategoria.map(([cat, arr]) => (
                  <React.Fragment key={`group-${cat}`}>
                    <tr className="catalogo-cat-row">
                      <td className="px-3 py-2 text-sm text-gray-900" colSpan={podeGerenciar ? 6 : 5}>{cat}</td>
                    </tr>
                    {arr.map(i => (
                      <tr key={i.id} className="border-b align-top">
                    <td className="px-3 py-2">
                      {i.imagem_url ? (
                        <img src={i.imagem_url} alt={i.titulo} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded" />)
                      }
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{i.categoria || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{i.titulo}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 whitespace-pre-wrap">{i.descricao || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 text-right whitespace-nowrap">{formatCurrency(i.preco)}</td>
                    {podeGerenciar && (
                      <td className="no-print px-3 py-2 text-right whitespace-nowrap">
                        <button onClick={() => iniciarEdicao(i)} className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 mr-2">Editar</button>
                        <button onClick={() => excluirItem(i)} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
                      </td>
                    )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={podeGerenciar ? 6 : 5} className="px-3 py-4 text-center text-gray-500">Nenhum item encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal de edição */}
          {editingItem && (
            <div className="no-print fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Editar item</div>
                  <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Imagem</div>
                      <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400">
                        {editForm.imagemPreview ? (
                          <img src={editForm.imagemPreview} alt="preview" className="w-full h-28 object-cover rounded" />
                        ) : ((editingItem as any).imagem_url ? (
                          <img src={(editingItem as any).imagem_url} alt={editingItem.titulo} className="w-full h-28 object-cover rounded" />
                        ) : (
                          <div className="text-gray-400 text-sm">Clique para selecionar</div>
                        ))}
                        <input type="file" accept="image/*" onChange={onSelectEditImage} className="mt-2 text-xs" />
                      </div>
                    </label>
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Nome do serviço</div>
                      <input value={editForm.titulo} onChange={e => setEditForm(prev => ({ ...prev, titulo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Preço</div>
                      <input value={editForm.preco} onChange={e => setEditForm(prev => ({ ...prev, preco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Categoria</div>
                      <select value={editForm.categoriaNome} onChange={e => setEditForm(prev => ({ ...prev, categoriaNome: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Sem categoria</option>
                        {categorias.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block md:col-span-5">
                      <div className="text-xs text-gray-600 mb-1">Descrição</div>
                      <textarea value={editForm.descricao} onChange={e => setEditForm(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]" />
                    </label>
                  </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-2">
                  <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Cancelar</button>
                  <button onClick={salvarEdicao} disabled={salvandoEdicao} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 disabled:opacity-50">{salvandoEdicao ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </MenuLayout>
  );
}

