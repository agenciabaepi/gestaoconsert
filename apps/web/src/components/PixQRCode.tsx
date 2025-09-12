'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiCheckCircle, FiAlertCircle, FiClock, FiShare2 } from 'react-icons/fi';
import QRCode from 'qrcode';
import logoMP from '@/assets/imagens/logomercadopago.png';
import logoPIX from '@/assets/imagens/logopix.png';
import { supabase as supabaseBrowser } from '@/lib/supabaseClient';

interface PixQRCodeProps {
  valor: number;
  descricao?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  mock?: boolean;
  planoSlug?: 'basico' | 'pro' | 'avancado' | string;
}

export default function PixQRCode({ valor, descricao, onSuccess, onError, mock, planoSlug }: PixQRCodeProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{
    qr_code?: string;
    qr_code_base64?: string;
    payment_id?: string;
    pagamento_id?: string;
    status?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [manualChecking, setManualChecking] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  // Carrega canvas-confetti via CDN somente quando necessário
  async function loadConfetti(): Promise<void> {
    if (typeof window === 'undefined') return;
    if ((window as any).confetti) return;
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  async function triggerConfetti() {
    if (celebrated) return;
    setCelebrated(true);
    try {
      await loadConfetti();
      const confetti = (window as any).confetti;
      if (confetti) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 90, origin: { y: 0.7 } }), 300);
      }
    } catch {}
  }

  const gerarPIX = async () => {
    setLoading(true);
    setError(null);
    setQrCodeData(null);

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      // Timeout de 10s para evitar travar em sandbox
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/pagamentos/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        } as HeadersInit,
        body: JSON.stringify({
          valor: valor,
          descricao: descricao || `Pagamento - R$ ${valor.toFixed(2)}`,
          mock: !!mock,
          plano_slug: planoSlug || null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const details = data?.details ? ` - ${JSON.stringify(data.details)}` : '';
        const msg = data?.error || data?.code || 'Erro ao gerar PIX';
        throw new Error(`${msg}${details}`);
      }

                    if (data.success) {
                // Se não temos QR Code do Mercado Pago, não podemos gerar um válido
                // Vamos apenas salvar os dados da preferência
                setQrCodeData({
                  qr_code: data.qr_code,
                  qr_code_base64: data.qr_code_base64,
                  payment_id: data.payment_id,
                  pagamento_id: data.pagamento_id,
                  status: data.status,
                });
                // Timer simples de validade visual (5 min)
                setExpiresIn(5 * 60);
                
                // Chama onSuccess se tiver QR Code
                if (data.qr_code || data.qr_code_base64) {
                  onSuccess?.();
                }
      } else {
        throw new Error('Erro ao gerar PIX');
      }
    } catch (err) {
      // Fallback automático para modo simulado se timeout/abort ou falha de rede
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (isAbort || (err instanceof TypeError)) {
        try {
          const { data: { session } } = await supabaseBrowser.auth.getSession();
          const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
          const resMock = await fetch('/api/pagamentos/criar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader } as HeadersInit,
            body: JSON.stringify({ valor, descricao: descricao || `Pagamento - R$ ${valor.toFixed(2)}`, mock: true }),
          });
          const dataMock = await resMock.json();
          if (resMock.ok && dataMock?.success) {
            setQrCodeData({
              qr_code: dataMock.qr_code,
              qr_code_base64: dataMock.qr_code_base64,
              payment_id: dataMock.payment_id,
              pagamento_id: dataMock.pagamento_id,
              status: dataMock.status,
            });
            setExpiresIn(5 * 60);
            onSuccess?.();
            setError('');
            return;
          }
        } catch (_) {}
      }
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copiarQRCode = () => {
    if (qrCodeData?.qr_code) {
      navigator.clipboard.writeText(qrCodeData.qr_code);
      // Você pode adicionar um toast aqui
    }
  };

  const compartilhar = async () => {
    if (!qrCodeData?.qr_code) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PIX ConsertOS', text: 'Código PIX para pagamento do plano', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(qrCodeData.qr_code);
        alert('Código PIX copiado. Compartilhe no seu app preferido.');
      }
    } catch (_) {}
  };

  const verificarAgora = async () => {
    if (!qrCodeData?.pagamento_id && !qrCodeData?.payment_id) return;
    setManualChecking(true);
    try {
      const authHeader = {} as Record<string, string>;
      const params = new URLSearchParams();
      if (qrCodeData?.pagamento_id) params.set('pagamento_id', qrCodeData.pagamento_id);
      if (qrCodeData?.payment_id) params.set('payment_id', qrCodeData.payment_id);
      // Usar rota interna do admin para não depender de sessão do cliente
      const res = await fetch(`/api/admin-saas/pagamentos/status?${params.toString()}`, { cache: 'no-store', headers: { ...authHeader } });
      const json = await res.json();
      if (res.ok && json?.status) {
        setQrCodeData(prev => prev ? { ...prev, status: json.status } : prev);
        if (json.status === 'approved') {
          triggerConfetti();
          setTimeout(() => (window.location.href = '/dashboard'), 10000);
        }
      }
    } catch (_) {
    } finally {
      setManualChecking(false);
    }
  };

  const simularAprovacao = async () => {
    if (!mock) return;
    if (!qrCodeData?.pagamento_id && !qrCodeData?.payment_id) return;
    try {
      const params = new URLSearchParams();
      if (qrCodeData?.pagamento_id) params.set('pagamento_id', qrCodeData.pagamento_id);
      if (qrCodeData?.payment_id) params.set('payment_id', qrCodeData.payment_id);
      params.set('mock_approve', '1');
      const res = await fetch(`/api/admin-saas/pagamentos/status?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.status) {
        setQrCodeData(prev => prev ? { ...prev, status: json.status } : prev);
        if (json.status === 'approved') {
          setTimeout(() => (window.location.href = '/dashboard'), 1200);
        }
      }
    } catch (_) {}
  };

  // Contagem regressiva visual
  useEffect(() => {
    if (expiresIn === null) return;
    if (expiresIn <= 0) return;
    const id = setInterval(() => setExpiresIn((s) => (s ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, [expiresIn]);

  // Polling leve para status do pagamento
  useEffect(() => {
    if (!qrCodeData?.pagamento_id && !qrCodeData?.payment_id) return;
    let stopped = false;
    const poll = async () => {
      try {
        const authHeader = {} as Record<string, string>;
        const params = new URLSearchParams();
        if (qrCodeData?.pagamento_id) params.set('pagamento_id', qrCodeData.pagamento_id);
        if (qrCodeData?.payment_id) params.set('payment_id', qrCodeData.payment_id);
        // Usa rota interna do admin que consulta MP e sincroniza
        const res = await fetch(`/api/admin-saas/pagamentos/status?${params.toString()}`, { cache: 'no-store', headers: { ...authHeader } });
        const json = await res.json();
        if (res.ok && json?.status) {
          setQrCodeData(prev => prev ? { ...prev, status: json.status } : prev);
          if (json.status === 'approved') {
            triggerConfetti();
            // pequeno delay para UX e permitir atualização de backend
            setTimeout(() => {
              if (!stopped) window.location.href = '/dashboard';
            }, 10000);
          }
        } else if (res.status === 401) {
          // para evitar loop quando sessão não é reconhecida
          stopped = true;
        }
      } catch (_) {}
    };
    const id = setInterval(poll, 4000);
    poll();
    return () => { stopped = true; clearInterval(id); };
  }, [qrCodeData?.pagamento_id, qrCodeData?.payment_id]);

  const StatusBadge = () => {
    const status = qrCodeData?.status;
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
          <FiCheckCircle /> Aprovado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
          <FiAlertCircle /> Falhou
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
        <FiClock /> Aguardando pagamento
      </span>
    );
  };

  if (qrCodeData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
          <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pagamento via PIX
          </h3>
          <p className="text-gray-600">
            Valor: R$ {valor.toFixed(2).replace('.', ',')}
          </p>
            {typeof expiresIn === 'number' && (
              <p className="text-xs text-gray-500 mt-1">Expira em {Math.floor(expiresIn/60)}:{String(expiresIn%60).padStart(2,'0')}</p>
            )}
          <div className="mt-2"><StatusBadge /></div>
        </div>

        {(qrCodeData.qr_code_base64 || qrCodeData.qr_code) ? (
          <div className="text-center mb-4">
            <div className="bg-gray-100 p-4 rounded-lg inline-block">
              {qrCodeData.qr_code_base64 ? (
                <Image
                  src={`data:image/png;base64,${qrCodeData.qr_code_base64}`}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              ) : qrCodeData.qr_code ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">QR Code disponível</p>
                  <p className="text-xs text-gray-500">
                    Use o código PIX abaixo
                  </p>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Escaneie o QR Code com seu app bancário
            </p>
          </div>
        ) : (
          <div className="text-center mb-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">QR Code não disponível</p>
              <p className="text-xs text-gray-500">
                Aguarde alguns segundos...
              </p>
            </div>
          </div>
        )}



        {qrCodeData.qr_code && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código PIX (copie e cole no seu app bancário):
            </label>
            <div className="flex">
              <input
                type="text"
                value={qrCodeData.qr_code}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
              />
              <button
                onClick={copiarQRCode}
                className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 text-sm"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 text-xs text-gray-500">
          Passo a passo:
          <ol className="list-decimal ml-5 mt-1 space-y-1">
            <li>Abra seu aplicativo bancário</li>
            <li>Escolha a opção PIX</li>
            <li>Escaneie o QR Code ou cole o código</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setQrCodeData(null)}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Voltar
          </button>
          {qrCodeData.qr_code && (
            <button
              onClick={copiarQRCode}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
            >
              Copiar código PIX
            </button>
          )}
          <button
            onClick={compartilhar}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-white border rounded-md hover:bg-gray-50"
          >
            <FiShare2 /> Compartilhar
          </button>
        </div>

        <div className="mt-2">
          <button
            onClick={verificarAgora}
            disabled={manualChecking}
            className="w-full text-sm px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {manualChecking ? 'Verificando…' : 'Já paguei: verificar agora'}
          </button>
        </div>

        {mock && (
          <div className="mt-2">
            <button
              onClick={simularAprovacao}
              className="w-full text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              Simular pagamento aprovado (mock)
            </button>
          </div>
        )}

        {qrCodeData.status === 'approved' && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <FiCheckCircle /> Pagamento aprovado!
            </div>
            <ul className="mt-2 text-xs text-green-700 space-y-1">
              <li>✓ Recebendo confirmação…</li>
              <li>✓ Ativando plano…</li>
              <li>✓ Redirecionando…</li>
            </ul>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>Dica:</strong> Após fazer o pagamento, aguarde alguns segundos para a confirmação automática.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 opacity-80">
          <Image src={logoPIX} alt="PIX" width={60} height={18} />
          <span className="text-gray-400">•</span>
          <Image src={logoMP} alt="Mercado Pago" width={120} height={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pagamento via PIX
        </h3>
        <p className="text-gray-600">
          Valor: R$ {valor.toFixed(2).replace('.', ',')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={gerarPIX}
          disabled={loading}
          className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Gerando PIX...' : 'Gerar PIX'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Pagamento processado com segurança pelo Mercado Pago
        </p>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 opacity-80">
        <Image src={logoPIX} alt="PIX" width={60} height={18} />
        <span className="text-gray-300">•</span>
        <Image src={logoMP} alt="Mercado Pago" width={120} height={20} />
      </div>
    </div>
  );
} 