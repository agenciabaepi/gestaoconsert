'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiLogOut, FiUser, FiMenu } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { SubscriptionStatus } from './SubscriptionStatus';

interface HeaderTopProps {
  onToggleMenu?: () => void;
  showMenuButton?: boolean;
}

const HeaderTop: React.FC<HeaderTopProps> = ({ onToggleMenu, showMenuButton = false }) => {
  const { usuarioData, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Botão hambúrguer para mobile */}
      {showMenuButton && onToggleMenu && (
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 md:hidden"
          title="Abrir menu"
        >
          <FiMenu className="w-5 h-5 text-gray-700" />
        </button>
      )}
      
      {/* Espaçador para centralizar o conteúdo quando não há botão */}
      {!showMenuButton && <div />}
      
      {/* Informações do usuário e status do plano */}
      <div className="flex items-center space-x-4">
        {/* Status do Plano */}
        <SubscriptionStatus />
        
        <div className="flex items-center space-x-2">
          <FiUser className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {usuarioData?.nome || 'Usuário'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          {usuarioData?.nivel || 'Nível não definido'}
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors duration-150"
          title="Sair"
        >
          <FiLogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default HeaderTop;