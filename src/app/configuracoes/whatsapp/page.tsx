'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedArea from '@/components/ProtectedArea';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface WhatsAppSession {
  id?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  numero_whatsapp: string;
  nome_contato: string;
  qr_code: string | null;
  ultima_conexao: string | null;
}

export default function WhatsAppPage() {
  const { empresaData } = useAuth();
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (empresaData?.id) {
      carregarSessao();
    }
  }, [empresaData]);

  useEffect(() => {
    // Polling para verificar status da conexão
    if (session?.status === 'connecting') {
      const interval = setInterval(() => {
        verificarStatus();
      }, 3000); // Verificar a cada 3 segundos
      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [session?.status]);

  const carregarSessao = async () => {
    try {
      console.log('🔔 WhatsApp: Carregando sessão para empresa:', empresaData?.id);
      
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('empresa_id', empresaData?.id)
        .single();

      console.log('🔔 WhatsApp: Dados do Supabase:', { data, error });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const sessionData = data || {
        status: 'disconnected',
        numero_whatsapp: '',
        nome_contato: '',
        qr_code: null,
        ultima_conexao: null
      };

      console.log('🔔 WhatsApp: Definindo sessão:', sessionData);
      setSession(sessionData);
    } catch (error) {
      console.error('❌ WhatsApp: Erro ao carregar sessão:', error);
      toast.error('Erro ao carregar dados do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const conectarWhatsApp = async () => {
    if (!empresaData?.id) return;

    setConnecting(true);
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao conectar WhatsApp');
      }

      const result = await response.json();
      console.log('🔔 WhatsApp: Resposta da conexão:', result);

      // Atualizar a sessão com os dados da resposta
      if (result.success) {
        // Buscar dados atualizados do banco
        await carregarSessao();
        toast.success('QR Code gerado! Escaneie com seu WhatsApp');
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const verificarStatus = async () => {
    if (!empresaData?.id) return;

    try {
      const response = await fetch(`/api/whatsapp/connect?empresa_id=${empresaData.id}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.session) {
          setSession(result.session);
          
          if (result.session.status === 'connected') {
            toast.success('WhatsApp conectado com sucesso!');
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const desconectarWhatsApp = async () => {
    if (!empresaData?.id) return;

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao desconectar WhatsApp');
      }

      toast.success('WhatsApp desconectado com sucesso!');
      carregarSessao();
    } catch (error) {
      console.error('❌ WhatsApp: Erro ao desconectar:', error);
      toast.error('Erro ao desconectar WhatsApp');
    }
  };

  const enviarMensagemTeste = async () => {
    if (!empresaData?.id) return;

    try {
      toast.loading('Enviando mensagem de teste...');
      
      const response = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaData.id,
          tecnico_id: '5671d602-42e6-4103-953a-a2fffac04585', // ID do Lucas Oliveira
          aparelho_info: {
            marca: 'TESTE',
            modelo: 'Sistema',
            cliente_nome: 'Teste de Sistema',
            problema: 'Verificação de funcionamento',
            os_id: 'TESTE-001'
          }
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem de teste');
      }

      const result = await response.json();
      console.log('✅ WhatsApp: Mensagem de teste enviada:', result);
      toast.success('Mensagem de teste enviada com sucesso!');
      
    } catch (error) {
      toast.dismiss();
      console.error('❌ WhatsApp: Erro ao enviar mensagem de teste:', error);
      toast.error('Erro ao enviar mensagem de teste: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  console.log('🔔 WhatsApp: Renderizando interface, estado atual:', {
    loading,
    session,
    empresaData: empresaData?.id
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ProtectedArea area="configuracoes">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Conectar WhatsApp
              </h1>
              <p className="text-lg text-gray-600">
                Conecte o WhatsApp da sua empresa para enviar mensagens automáticas
              </p>
            </div>

            {/* Status da Conexão */}
            <div className="mb-8">
              <div className={`p-4 rounded-lg border ${
                session?.status === 'connected' ? 'bg-green-50 border-green-200' :
                session?.status === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
                session?.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Status da Conexão
                    </h3>
                    <p className={`text-sm ${
                      session?.status === 'connected' ? 'text-green-700' :
                      session?.status === 'connecting' ? 'text-yellow-700' :
                      session?.status === 'error' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {session?.status === 'connected' ? '✅ Conectado' :
                       session?.status === 'connecting' ? '🔄 Conectando...' :
                       session?.status === 'error' ? '❌ Erro na conexão' :
                       '❌ Desconectado'}
                    </p>
                  </div>
                  
                  {session?.status === 'connected' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Número: {session.numero_whatsapp}
                      </p>
                      <p className="text-sm text-gray-600">
                        Nome: {session.nome_contato}
                      </p>
                      {session.ultima_conexao && (
                        <p className="text-xs text-gray-500">
                          Conectado em: {new Date(session.ultima_conexao).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code */}
            {session?.status === 'connecting' && session.qr_code && (
              <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Escaneie o QR Code
                </h3>
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <Image
                    src={session.qr_code}
                    alt="QR Code WhatsApp"
                    width={300}
                    height={300}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Abra o WhatsApp no seu celular → Menu → WhatsApp Web → Escaneie o código
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session?.status === 'disconnected' && (
                <button
                  onClick={conectarWhatsApp}
                  disabled={connecting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {connecting ? 'Conectando...' : '🔗 Conectar WhatsApp'}
                </button>
              )}

              {session?.status === 'connecting' && (
                <button
                  onClick={verificarStatus}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🔄 Verificar Status
                </button>
              )}

              {session?.status === 'connected' && (
                <button
                  onClick={desconectarWhatsApp}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  ❌ Desconectar WhatsApp
                </button>
              )}

              {session?.status === 'error' && (
                <button
                  onClick={conectarWhatsApp}
                  disabled={connecting}
                  className="px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium"
                >
                  🔄 Tentar Novamente
                </button>
              )}

              {session?.status === 'connected' && (
                <button
                  onClick={enviarMensagemTeste}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  💬 Enviar Mensagem de Teste
                </button>
              )}
            </div>

            {/* Informações */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                📱 Como Funciona
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Clique em "Conectar WhatsApp"</li>
                <li>Um QR Code será gerado na tela</li>
                <li>Abra o WhatsApp no seu celular</li>
                <li>Vá em Menu → WhatsApp Web</li>
                <li>Escaneie o QR Code</li>
                <li>Pronto! Seu WhatsApp estará conectado</li>
              </ol>
              <p className="mt-3 text-sm text-blue-700">
                <strong>Importante:</strong> Mantenha o celular conectado à internet para manter a conexão ativa.
              </p>
            </div>

            {/* Funcionalidades */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                🚀 Funcionalidades
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Envio automático de mensagens quando uma nova OS for cadastrada</li>
                <li>Notificações para técnicos sobre novos aparelhos</li>
                <li>Log completo de todas as mensagens enviadas</li>
                <li>Conexão segura e criptografada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedArea>
  );
}
