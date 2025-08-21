'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MenuLayout from '@/components/MenuLayout';
import ProtectedArea from '@/components/ProtectedArea';
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

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      // buscar toggle
      const { data: conf } = await supabase
        .from('configuracoes_empresa')
        .select('catalogo_habilitado')
        .eq('empresa_id', empresaId)
        .single();
      if (conf && typeof conf.catalogo_habilitado === 'boolean') setHabilitado(conf.catalogo_habilitado);

      // buscar itens
      const { data } = await supabase
        .from('catalogo_itens')
        .select('id, empresa_id, titulo, descricao, preco, categoria, ativo, updated_at, imagem_url')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('titulo', { ascending: true });
      setItens((data || []) as CatalogoItem[]);

      // buscar categorias do catálogo
      const { data: cats } = await supabase
        .from('catalogo_categorias')
        .select('id, empresa_id, nome, ordem, ativo')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });
      setCategoriasDb((cats || []) as CatalogoCategoria[]);
    })();
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

  return (
    <ProtectedArea area="ordens">
      <MenuLayout>
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
              <p className="text-gray-600">Visualize e imprima os valores dos serviços da sua empresa.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900" onClick={() => window.print()}>
                Imprimir / PDF
              </button>
            </div>
          </div>

          {!habilitado && (
            <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 print:hidden">
              O catálogo está desabilitado nas configurações da empresa.
            </div>
          )}

          {/* Gestão rápida do catálogo (somente admin) */}
          {podeGerenciar && (
            <div className="mb-6 rounded-xl border border-gray-200 p-4 bg-white print:hidden">
              <div className="font-medium text-gray-900 mb-3">Adicionar item ao catálogo</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <label className="block">
                  <div className="text-xs text-gray-600 mb-1">Imagem</div>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400">
                    {form.imagemPreview ? (
                      <img src={form.imagemPreview} alt="preview" className="w-full h-28 object-cover rounded" />
                    ) : (
                      <div className="text-gray-400 text-sm">Clique para selecionar</div>
                    )}
                    <input type="file" accept="image/*" onChange={onSelectImage} className="mt-2 text-xs" />
                  </div>
                </label>
                <label className="block">
                  <div className="text-xs text-gray-600 mb-1">Nome do serviço</div>
                  <input value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex.: Formatação completa" />
                </label>
                <label className="block">
                  <div className="text-xs text-gray-600 mb-1">Preço</div>
                  <input value={form.preco} onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex.: 120,00" />
                </label>
                <label className="block">
                  <div className="text-xs text-gray-600 mb-1">Categoria</div>
                  <select value={form.categoriaNome} onChange={e => setForm(prev => ({ ...prev, categoriaNome: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Sem categoria</option>
                    {categorias.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <div className="text-xs text-gray-600 mb-1">Descrição</div>
                  <textarea value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[42px]" placeholder="Opcional" />
                </label>
              </div>
              <div className="mt-3 text-right">
                <button onClick={salvarItem} disabled={salvandoItem} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 disabled:opacity-50">
                  {salvandoItem ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Categorias</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categorias.map(c => (
                    <span key={c} className="px-2 py-1 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-700">{c}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Nova categoria" className="px-3 py-2 border border-gray-300 rounded-lg flex-1" />
                  <button onClick={adicionarCategoria} disabled={salvandoCategoria} className="px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">{salvandoCategoria ? 'Salvando...' : 'Adicionar categoria'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-3 items-center mb-6 print:hidden">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar serviço..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cabeçalho para impressão */}
          <div className="hidden print:block print-container">
            <div className="print-header">
              <div>
                <div className="empresa">{empresaData?.nome}</div>
                <div className="subtitle">Catálogo de Serviços</div>
              </div>
              <div className="flex items-center gap-4">
                {empresaData?.logo_url && (
                  <img src={empresaData.logo_url} alt="Logo" className="print-logo" />
                )}
                <div className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</div>
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
    </ProtectedArea>
  );
}


