'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Páginas que não precisam de autenticação
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se for rota pública, renderizar diretamente
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se for rota protegida, usar ProtectedRoute e MainLayout
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
}
