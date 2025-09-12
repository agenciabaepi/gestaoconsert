'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CatalogoPDF } from '@/components/CatalogoPDF';
import { useAuth } from '@/context/AuthContext';

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

export default function ImprimirCatalogoPage() {
  const { empresaData, loading: authLoading } = useAuth();
  const [itens, setItens] = useState<CatalogoItem[]>([]);
  const [PDFViewer, setPDFViewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosEmpresaCompletos, setDadosEmpresaCompletos] = useState<any>(null);

  useEffect(() => {
    async function fetchItens() {
      // Aguardar o AuthContext carregar
      if (authLoading) {
        return;
      }

      let empresaId = empresaData?.id;
      let empresaInfo = empresaData;

      console.log('Empresa ID:', empresaId || 'N/A');

      // Se não tiver dados do context, tentar localStorage
      if (!empresaId) {
        try {
          const localEmpresaData = localStorage.getItem('empresaData');
          const localUsuarioData = localStorage.getItem('usuarioData');
          
          if (localEmpresaData) {
            const parsedEmpresaData = JSON.parse(localEmpresaData);
            empresaId = parsedEmpresaData.id;
            empresaInfo = parsedEmpresaData;
            } else if (localUsuarioData) {
            const parsedUsuarioData = JSON.parse(localUsuarioData);
            empresaId = parsedUsuarioData.empresa_id;
            }
        } catch (e) {
          console.error('Erro ao processar localStorage:', e);
        }
      }

      // Se ainda não tiver, tentar buscar da sessão atual do Supabase
      if (!empresaId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('empresa_id, empresas(*)')
              .eq('auth_user_id', session.user.id)
              .single();
            
            if (userData?.empresa_id) {
              empresaId = userData.empresa_id;
              empresaInfo = userData.empresas;
              }
          }
        } catch (e) {
          console.error('Erro ao buscar dados da sessão:', e);
        }
      }

      if (!empresaId) {
        setError('Dados da empresa não encontrados. Verifique se você está logado.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('catalogo_itens')
        .select('id, empresa_id, titulo, descricao, preco, categoria, ativo, updated_at, imagem_url')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('titulo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar itens do catálogo:', error);
        setError(`Erro ao buscar catálogo: ${error.message}`);
        setLoading(false);
        return;
      }

      setItens(data || []);
      
      // Buscar dados completos da empresa
      if (empresaId) {
        try {
          const { data: empresaCompleta } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();
          
          if (empresaCompleta) {
            setDadosEmpresaCompletos(empresaCompleta);
          }
        } catch (e) {
          console.error('Erro ao buscar dados completos da empresa:', e);
        }
      }
      
      setLoading(false);
    }

    fetchItens();
  }, [empresaData?.id, authLoading]);

  useEffect(() => {
    import('@react-pdf/renderer').then((mod) => {
      setPDFViewer(() => mod.PDFViewer);
    });
  }, []);

  // Agrupar itens por categoria
  const agrupadosPorCategoria = itens.reduce((acc, item) => {
    const categoria = item.categoria || 'Sem categoria';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, CatalogoItem[]>);

  const agrupadosArray = Object.entries(agrupadosPorCategoria);

  // Loading do Auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1FE6E] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1FE6E] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar o catálogo</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.close()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Fechar
            </button>
            <button 
              onClick={() => window.location.href = '/catalogo'}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
            >
              Ir para o Catálogo
            </button>
          </div>
          
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Debug Info (Para desenvolvedores)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
              <p>AuthLoading: {authLoading ? 'true' : 'false'}</p>
              <p>EmpresaData: {empresaData ? 'presente' : 'ausente'}</p>
              <p>LocalStorage: {localStorage.getItem('empresaData') ? 'presente' : 'ausente'}</p>
            </div>
          </details>
        </div>
      </div>
    );
  }

  if (!PDFViewer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1FE6E] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando visualizador PDF...</p>
        </div>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Catálogo vazio</h2>
          <p className="text-yellow-600 mb-4">Não há itens cadastrados no catálogo para imprimir.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Usar dados completos da empresa que foram buscados
  const dadosEmpresa = dadosEmpresaCompletos || empresaData || {
    nome: 'Consert Assistência Técnica',
    cnpj: '00.000.000/0000-00',
    endereco: 'Endereço da empresa',
    telefone: '(00) 00000-0000',
    email: 'email@empresa.com'
  };

  return (
    <PDFViewer style={{ width: '100vw', height: '100vh' }}>
        <CatalogoPDF 
          empresaData={dadosEmpresa}
          itens={itens}
          agrupadosPorCategoria={agrupadosArray}
        />
      </PDFViewer>
  );
}
