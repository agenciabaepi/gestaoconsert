'use client';

import React, { memo, useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { useRenderTracker } from '@/hooks/useRenderTracker';

interface UserProfileProps {
  menuRecolhido: boolean;
}

// Componente de perfil colapsado memoizado
const CollapsedProfile = memo(({ 
  onLogout 
}: {
  onLogout: () => void;
}) => (
  <div className="p-4 border-t border-gray-200 bg-white">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <FiUser className="w-4 h-4 text-white" />
      </div>
      <button
        onClick={onLogout}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Sair"
      >
        <FiLogOut className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  </div>
));

CollapsedProfile.displayName = 'CollapsedProfile';

// Componente de perfil expandido memoizado
const ExpandedProfile = memo(({ 
  usuarioData, 
  onLogout 
}: {
  usuarioData: any;
  onLogout: () => void;
}) => (
  <div className="p-4 border-t border-gray-200 bg-white">
    <div className="space-y-3">
      {/* Informações do Usuário */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <FiUser className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {usuarioData.nome}
          </p>
          <p className="text-xs text-gray-500">
            Nível {usuarioData.nivel}
          </p>
        </div>
      </div>

      {/* Ações do Usuário */}
      <div className="flex items-center gap-2">
        <Link
          href="/perfil"
          className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
        >
          <FiSettings className="w-4 h-4" />
          <span>Perfil</span>
        </Link>
        <button
          onClick={onLogout}
          className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-sm text-gray-600"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  </div>
));

ExpandedProfile.displayName = 'ExpandedProfile';

// Componente principal memoizado
const UserProfile = memo(({ menuRecolhido }: UserProfileProps) => {
  const { usuarioData, signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [signOut]);

  if (!usuarioData) {
    return null;
  }

  if (menuRecolhido) {
    return <CollapsedProfile onLogout={handleLogout} />;
  }

  return <ExpandedProfile usuarioData={usuarioData} onLogout={handleLogout} />;
});

UserProfile.displayName = 'UserProfile';
export default UserProfile;