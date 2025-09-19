'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Mail, 
  Database,
  Server,
  Bell,
  Key,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Gestão Consert',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    debugMode: false,
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'admin@gestaoconsert.com',
    smtpPassword: '********',
    
    // Database Settings
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'gestaoconsert',
    dbUser: 'postgres',
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    twoFactorEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'database', label: 'Banco de Dados', icon: Database },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'server', label: 'Servidor', icon: Server },
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Simular salvamento
    console.log('Configurações salvas:', settings);
  };

  const systemStatus = {
    database: 'online',
    email: 'online',
    storage: 'online',
    api: 'online',
    uptime: '99.8%',
    lastBackup: '2024-01-20 02:00:00',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'warning':
        return <Badge variant="warning">Atenção</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
            <p className="text-gray-600">Gerencie configurações gerais e parâmetros do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Resetar
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status do Banco</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(systemStatus.database)}
                    {getStatusBadge(systemStatus.database)}
                  </div>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status do Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(systemStatus.email)}
                    {getStatusBadge(systemStatus.email)}
                  </div>
                </div>
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-xl font-bold text-green-600">{systemStatus.uptime}</p>
                </div>
                <Server className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Configurações</CardTitle>
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Sistema
                      </label>
                      <Input
                        value={settings.systemName}
                        onChange={(e) => handleSettingChange('systemName', e.target.value)}
                        placeholder="Nome do sistema"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Versão do Sistema
                      </label>
                      <Input
                        value={settings.systemVersion}
                        onChange={(e) => handleSettingChange('systemVersion', e.target.value)}
                        placeholder="Versão"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Modo de Manutenção</h4>
                        <p className="text-sm text-gray-500">Ativar para manutenção do sistema</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Modo Debug</h4>
                        <p className="text-sm text-gray-500">Ativar logs detalhados</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Host
                      </label>
                      <Input
                        value={settings.smtpHost}
                        onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Port
                      </label>
                      <Input
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP User
                      </label>
                      <Input
                        value={settings.smtpUser}
                        onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Password
                      </label>
                      <Input
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                        placeholder="********"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline">Testar Conexão</Button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout da Sessão (minutos)
                      </label>
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Tentativas de Login
                      </label>
                      <Input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho Mínimo da Senha
                      </label>
                      <Input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                        placeholder="8"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Autenticação 2FA</h4>
                        <p className="text-sm text-gray-500">Ativar autenticação de dois fatores</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.twoFactorEnabled}
                        onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                      <p className="text-sm text-gray-500">Enviar notificações por email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações por SMS</h4>
                      <p className="text-sm text-gray-500">Enviar notificações por SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações Push</h4>
                      <p className="text-sm text-gray-500">Enviar notificações push</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Host do Banco
                      </label>
                      <Input
                        value={settings.dbHost}
                        onChange={(e) => handleSettingChange('dbHost', e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Porta do Banco
                      </label>
                      <Input
                        type="number"
                        value={settings.dbPort}
                        onChange={(e) => handleSettingChange('dbPort', parseInt(e.target.value))}
                        placeholder="5432"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Banco
                      </label>
                      <Input
                        value={settings.dbName}
                        onChange={(e) => handleSettingChange('dbName', e.target.value)}
                        placeholder="gestaoconsert"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuário do Banco
                      </label>
                      <Input
                        value={settings.dbUser}
                        onChange={(e) => handleSettingChange('dbUser', e.target.value)}
                        placeholder="postgres"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Testar Conexão</Button>
                  <Button variant="outline">Backup Manual</Button>
                </div>
              </div>
            )}

            {activeTab === 'server' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Servidor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sistema Operacional:</span>
                          <span className="text-sm font-medium">Linux Ubuntu 20.04</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Versão do Node:</span>
                          <span className="text-sm font-medium">v18.17.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Versão do Next.js:</span>
                          <span className="text-sm font-medium">15.3.2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Último Backup:</span>
                          <span className="text-sm font-medium">{systemStatus.lastBackup}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ações do Servidor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reiniciar Serviços
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Database className="w-4 h-4 mr-2" />
                          Otimizar Banco
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Globe className="w-4 h-4 mr-2" />
                          Limpar Cache
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Key className="w-4 h-4 mr-2" />
                          Regenerar Chaves
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
