'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { useRouter } from 'next/navigation';
import {
  FiCheckCircle,
  FiCircle,
  FiHome,
  FiUsers,
  FiArrowRight,
  FiX
} from 'react-icons/fi';

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'completed' | 'warning';
  action?: () => void;
  required: boolean;
  missingFields?: string[];
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { usuarioData, empresaData } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>([]);
  const [showTecnicoModal, setShowTecnicoModal] = useState(false);

  const checkOnboardingStatus = async () => {
    setLoading(true);
    
    try {
      const items: OnboardingItem[] = [];

      // 1. Dados da empresa - verificação de todos os campos obrigatórios
      const empresaFields = {
        logo: !!empresaData?.logo_url && empresaData.logo_url.trim() !== '',
        nome: !!empresaData?.nome && empresaData.nome.trim() !== '',
        endereco: !!empresaData?.endereco && empresaData.endereco.trim() !== '',
        cnpj: !!empresaData?.cnpj && empresaData.cnpj.trim() !== '',
        telefone: !!empresaData?.telefone && empresaData.telefone.trim() !== ''
      };
      
      const empresaStatus = Object.values(empresaFields).every(field => field) ? 'completed' : 'pending';
      const missingFields = Object.entries(empresaFields)
        .filter(([, value]) => !value)
        .map(([key]) => {
          // Mapear nomes mais amigáveis para os campos
          const fieldNames: { [key: string]: string } = {
            logo: 'Logo',
            nome: 'Nome da Empresa',
            endereco: 'Endereço',
            cnpj: 'CNPJ',
            telefone: 'Telefone'
          };
          return fieldNames[key] || key;
        });
      
      items.push({
        id: 'empresa',
        title: 'Dados da Empresa',
        description: 'Configure logo, nome, endereço, CNPJ e telefone',
        icon: <FiHome className="w-5 h-5" />,
        status: empresaStatus,
        action: () => {
          onClose(); // Fechar modal primeiro
          router.push('/configuracoes?tab=0'); // Aba de empresa
        },
        required: true,
        missingFields: missingFields
      });

      // 2. Cadastro de técnicos com timeout
      let tecnicosStatus: 'pending' | 'completed' | 'warning' = 'pending';
      try {
        const { data: tecnicos } = await Promise.race([
          supabase
            .from('usuarios')
            .select('id')
            .eq('nivel', 'tecnico')
            .eq('empresa_id', usuarioData?.empresa_id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        tecnicosStatus = tecnicos && tecnicos.length > 0 ? 'completed' : 'pending';
      } catch (error) {
        console.warn('⚠️ Timeout ao buscar técnicos:', error);
        tecnicosStatus = 'pending'; // Assume que não há técnicos em caso de timeout
      }
      
      items.push({
        id: 'tecnicos',
        title: 'Cadastro de Técnicos',
        description: 'Cadastre pelo menos um técnico para criar Ordens de Serviço',
        icon: <FiUsers className="w-5 h-5" />,
        status: tecnicosStatus,
        action: () => {
          onClose(); // Fechar modal primeiro
          router.push('/configuracoes?tab=1'); // Aba de usuários
        },
        required: true
      });

      setOnboardingItems(items);
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      addToast('error', 'Erro ao carregar status do onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Verificar status dos itens de onboarding
  useEffect(() => {
    if (isOpen) {
      checkOnboardingStatus();
    }
  }, [isOpen, usuarioData, empresaData]);

  const handleSkip = () => {
    addToast('info', 'Onboarding pulado. Você pode completar as configurações depois.');
    onClose();
    // Marcar como pulado para não aparecer novamente nesta sessão
    localStorage.setItem('onboarding_skipped', 'true');
  };

  const handleComplete = () => {
    // Verificar se todos os itens obrigatórios estão completos
    const requiredItems = onboardingItems.filter(item => item.required);
    const isComplete = requiredItems.every(item => item.status === 'completed');
    
    if (isComplete) {
      addToast('success', 'Onboarding concluído com sucesso!');
      onComplete();
      onClose();
    } else {
      const pendingRequired = requiredItems.filter(item => item.status !== 'completed').length;
      addToast('warning', `Complete ${pendingRequired} item(s) obrigatório(s) antes de concluir o onboarding.`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <FiCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <FiCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const requiredItems = onboardingItems.filter(item => item.required);
  const completedRequiredItems = requiredItems.filter(item => item.status === 'completed').length;
  const totalRequiredItems = requiredItems.length;
  const progress = totalRequiredItems > 0 ? (completedRequiredItems / totalRequiredItems) * 100 : 0;

  // ✅ VERIFICAÇÃO: Mostrar onboarding apenas para admins
  const isAdmin = usuarioData?.nivel === 'admin';
  
  // Se não for admin ou não estiver aberto, não mostrar o modal
  if (!isOpen || !isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao Sistema!</h2>
            <p className="text-gray-600 mt-1">Complete as configurações iniciais para começar</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progresso: {completedRequiredItems}/{totalRequiredItems} itens obrigatórios
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Verificando configurações...</p>
            </div>
          ) : (
            onboardingItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusColor(item.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm opacity-80">{item.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {item.action && (
                    <Button
                      onClick={item.action}
                      size="sm"
                      className={`${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {item.status === 'completed' ? 'Ver' : 'Configurar'}
                      <FiArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                {item.required && item.status !== 'completed' && (
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ⚠️ Este item é obrigatório para criar Ordens de Serviço
                    {item.missingFields && item.missingFields.length > 0 && (
                      <div className="mt-1 text-red-500">
                        Campos faltando: {item.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            Pular por agora
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleComplete}
              disabled={completedRequiredItems < totalRequiredItems}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Concluir Onboarding ({completedRequiredItems}/{totalRequiredItems})
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro de Técnico */}
      {showTecnicoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cadastrar Técnico
              </h3>
              <p className="text-gray-600 mb-6">
                Para criar Ordens de Serviço, você precisa cadastrar pelo menos um técnico.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowTecnicoModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowTecnicoModal(false);
                    onClose(); // Fechar modal de onboarding
                    router.push('/configuracoes?tab=1'); // Aba de usuários
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Cadastrar Técnico
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
