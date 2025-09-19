'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full z-50 transition-transform duration-300',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      )}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Header */}
        <Header 
          onMenuToggle={toggleMobileMenu}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
