'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function CatalogoConfigPage() {
  const { empresaData } = useAuth();
  const [habilitado, setHabilitado] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  // Cadastro e listagem foram movidos para /catalogo

  useEffect(() => {
    if (!empresaData?.id) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('configuracoes_empresa')
          .select('catalogo_habilitado')
          .eq('empresa_id', empresaData.id)
          .single();
        if (data && typeof data.catalogo_habilitado === 'boolean') setHabilitado(data.catalogo_habilitado);
      } finally {
        setLoading(false);
      }
    })();
  }, [empresaData?.id]);

  const salvar = async () => {
    if (!empresaData?.id) return;
    setSaving(true);
    try {
      const payload = { empresa_id: empresaData.id, catalogo_habilitado: habilitado } as any;
      const { error } = await supabase.from('configuracoes_empresa').upsert(payload, { onConflict: 'empresa_id' });
      if (error) throw error;
    } finally {
      setSaving(false);
    }
  };

  // Handlers do cadastro removidos aqui

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Catálogo</h2>
        <p className="text-gray-600 text-sm">Habilite a página pública de catálogo e configure como deseja exibir seus serviços.</p>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Habilitar Catálogo Público</div>
            <div className="text-sm text-gray-600">Exibe a página <span className="font-mono">/catalogo</span> com os serviços e preços da empresa.</div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only" checked={habilitado} onChange={(e) => setHabilitado(e.target.checked)} />
            <span className={`w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 transition ${habilitado ? '!bg-green-500' : ''}`}>
              <span className={`bg-white w-4 h-4 rounded-full shadow transform transition ${habilitado ? 'translate-x-4' : ''}`}></span>
            </span>
          </label>
        </div>
        <div className="mt-3 text-right">
          <button className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 disabled:opacity-50" disabled={saving || loading} onClick={salvar}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Gestão removida: use a página /catalogo para cadastrar e listar itens */}

      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        <div className="font-medium text-gray-900 mb-1">Atalho</div>
        <p className="text-sm text-gray-600 mb-3">Abra a página de catálogo para visualizar como seus clientes verão os serviços.</p>
        <a href="/catalogo" className="inline-flex px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Abrir Catálogo</a>
      </div>
    </div>
  );
}


