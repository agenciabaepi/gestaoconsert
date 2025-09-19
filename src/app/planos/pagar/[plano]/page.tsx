'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PixQRCode from '@/components/PixQRCode';

type PlanoInfo = {
  id: 'basico' | 'pro' | 'avancado';
  nome: string;
  descricao: string;
  valor: number;
};

const PLANOS: Record<string, PlanoInfo> = {
  unico: {
    id: 'unico',
    nome: 'Acesso Completo',
    descricao: 'Todos os recursos do sistema liberados',
    valor: 1.0,
  },
};

export default function PagarPlanoPage() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const mock = search?.get('mock') === '1';
  const planoParam = (params?.plano as string) || 'unico';
  const plano = PLANOS[planoParam] || PLANOS.unico;

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Fundo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(209, 254, 110, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(209, 254, 110, 0.08) 1px, transparent 1px)` ,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Cabeçalho */}
      <header className="relative z-10 px-6 py-6 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <button className="hover:text-white" onClick={() => router.push('/')}>Início</button>
            <span className="opacity-60">/</span>
            <button className="hover:text-white" onClick={() => router.push('/planos')}>Planos</button>
            <span className="opacity-60">/</span>
            <span className="text-white">Pagamento</span>
          </div>
          <button className="text-white/80 hover:text-white text-sm" onClick={() => router.push('/planos')}>Voltar aos planos</button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 px-4 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo do plano */}
          <div className="bg-white/90 rounded-2xl shadow-xl p-6 border border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Pagamento do Plano</h1>
            <p className="text-gray-600 text-sm mb-4">Confirme seus dados e pague com PIX</p>

            <div className="rounded-xl border p-5 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{plano.nome}</div>
                  <div className="text-sm text-gray-600 max-w-md">{plano.descricao}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-700 font-extrabold text-2xl">R$ {plano.valor.toFixed(2).replace('.', ',')}</div>
                  <div className="text-[11px] text-gray-500">mensal</div>
                </div>
              </div>
              <ul className="mt-4 text-sm text-gray-700 space-y-2">
                <li>✓ Acesso completo ao painel</li>
                <li>✓ Suporte prioritário por WhatsApp</li>
                <li>✓ Cancelamento a qualquer momento</li>
              </ul>
            </div>

            <div className="text-xs text-gray-500">
              Ao continuar, você concorda com os termos de uso e política de privacidade. O plano será ativado após a confirmação do pagamento.
            </div>
          </div>

          {/* Área de pagamento */}
          <div className="bg-white/95 rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Pagamento via PIX</h2>
            <p className="text-sm text-gray-600 mb-4">Rápido, seguro e sem taxas</p>

            <div className="rounded-xl border p-5">
              {ready && (
                <PixQRCode
                  valor={plano.valor}
                  descricao={`Plano ${plano.nome}`}
                  planoSlug={plano.id}
                  mock={mock}
                />
              )}
            </div>

            <div className="mt-4 text-[12px] text-gray-500">
              Pagamento processado com segurança pelo Mercado Pago. Após efetuar o pagamento, a ativação ocorre automaticamente em poucos instantes.
            </div>

            <button
              className="mt-6 w-full py-2 rounded-md border text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/planos')}
            >
              Voltar aos planos
            </button>

            {mock && (
              <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
                Modo simulação ativo. Acrescente ?mock=1 na URL para testar localmente.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} ConsertOS • Suporte: suporte@consert.com.br
      </footer>
    </div>
  );
}


