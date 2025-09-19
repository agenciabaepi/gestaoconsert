'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Users,
  CreditCard,
  Mail,
  Globe,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'Gestão Consert Admin',
    appUrl: 'https://admin.gestaoconsert.com',
    contactEmail: 'suporte@gestaoconsert.com',
    defaultLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordExpiration: 90,
  });

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings:`, { generalSettings, notificationSettings, securitySettings });
    alert(`Configurações de ${section} salvas com sucesso!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativo</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getIconForTab = (tab: string) => {
    switch (tab) {
      case 'general':
        return <SettingsIcon className="w-4 h-4 text-gray-600" />;
      case 'notifications':
        return <Bell className="w-4 h-4 text-gray-600" />;
      case 'security':
        return <Lock className="w-4 h-4 text-gray-600" />;
      case 'users':
        return <Users className="w-4 h-4 text-gray-600" />;
      case 'billing':
        return <CreditCard className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie configurações gerais e parâmetros do sistema</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => handleSave(activeTab)}>
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Navegação */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Navegação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="flex flex-col">
              <Button
                variant="ghost"
                className={`justify-start rounded-none px-6 py-3 ${activeTab === 'general' ? 'bg-gray-100 text-green-700' : 'text-gray-700'}`}
                onClick={() => setActiveTab('general')}
              >
                <SettingsIcon className="w-4 h-4 mr-2" /> Geral
              </Button>
              <Button
                variant="ghost"
                className={`justify-start rounded-none px-6 py-3 ${activeTab === 'notifications' ? 'bg-gray-100 text-green-700' : 'text-gray-700'}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="w-4 h-4 mr-2" /> Notificações
              </Button>
              <Button
                variant="ghost"
                className={`justify-start rounded-none px-6 py-3 ${activeTab === 'security' ? 'bg-gray-100 text-green-700' : 'text-gray-700'}`}
                onClick={() => setActiveTab('security')}
              >
                <Lock className="w-4 h-4 mr-2" /> Segurança
              </Button>
              <Button
                variant="ghost"
                className={`justify-start rounded-none px-6 py-3 ${activeTab === 'users' ? 'bg-gray-100 text-green-700' : 'text-gray-700'}`}
                onClick={() => setActiveTab('users')}
              >
                <Users className="w-4 h-4 mr-2" /> Usuários e Permissões
              </Button>
              <Button
                variant="ghost"
                className={`justify-start rounded-none px-6 py-3 ${activeTab === 'billing' ? 'bg-gray-100 text-green-700' : 'text-gray-700'}`}
                onClick={() => setActiveTab('billing')}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Faturamento
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Conteúdo da Seção */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getIconForTab(activeTab)}
              {activeTab === 'general' && 'Configurações Gerais'}
              {activeTab === 'notifications' && 'Configurações de Notificação'}
              {activeTab === 'security' && 'Configurações de Segurança'}
              {activeTab === 'users' && 'Gerenciamento de Usuários'}
              {activeTab === 'billing' && 'Configurações de Faturamento'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="appName" className="block text-sm font-medium text-gray-700">Nome do Aplicativo</label>
                  <Input
                    id="appName"
                    name="appName"
                    value={generalSettings.appName}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="appUrl" className="block text-sm font-medium text-gray-700">URL do Aplicativo</label>
                  <Input
                    id="appUrl"
                    name="appUrl"
                    value={generalSettings.appUrl}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email de Contato</label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">Idioma Padrão</label>
                  <select
                    id="defaultLanguage"
                    name="defaultLanguage"
                    value={generalSettings.defaultLanguage}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Fuso Horário</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={generalSettings.timezone}
                    onChange={handleGeneralChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">Notificações por Email</label>
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="smsNotifications" className="text-sm font-medium text-gray-700">Notificações por SMS</label>
                  <input
                    id="smsNotifications"
                    name="smsNotifications"
                    type="checkbox"
                    checked={notificationSettings.smsNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">Notificações Push</label>
                  <input
                    id="pushNotifications"
                    name="pushNotifications"
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="twoFactorAuth" className="text-sm font-medium text-gray-700">Autenticação de Dois Fatores (2FA)</label>
                  <input
                    id="twoFactorAuth"
                    name="twoFactorAuth"
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={handleSecurityChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="passwordExpiration" className="block text-sm font-medium text-gray-700">Expiração de Senha (dias)</label>
                  <Input
                    id="passwordExpiration"
                    name="passwordExpiration"
                    type="number"
                    value={securitySettings.passwordExpiration}
                    onChange={handleSecurityChange}
                    className="mt-1 block w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Gerencie usuários e suas permissões aqui.</p>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar Novo Usuário
                </Button>
                {/* Exemplo de lista de usuários (simplificado) */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">João Silva</p>
                        <p className="text-sm text-gray-500">Admin</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Gerencie suas informações de faturamento e planos de assinatura.</p>
                <Button className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Ver Histórico de Pagamentos
                </Button>
                <Card>
                  <CardContent className="p-4">
                    <p className="font-medium">Plano Atual: Premium</p>
                    <p className="text-sm text-gray-500">Próxima Fatura: 15/03/2025</p>
                    <Button variant="outline" className="mt-3">Mudar Plano</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}