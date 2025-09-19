'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  Upload
} from 'lucide-react';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dados mockados para demonstração
  const companies = [
    {
      id: 1,
      name: 'Tech Solutions LTDA',
      cnpj: '12.345.678/0001-90',
      email: 'contato@techsolutions.com',
      plan: 'Premium',
      status: 'active',
      users: 45,
      createdAt: '2024-01-15',
      lastActivity: '2024-01-20',
      revenue: 2500.00,
    },
    {
      id: 2,
      name: 'Digital Marketing Pro',
      cnpj: '98.765.432/0001-10',
      email: 'admin@digitalmarketing.com',
      plan: 'Standard',
      status: 'active',
      users: 23,
      createdAt: '2024-01-14',
      lastActivity: '2024-01-19',
      revenue: 1200.00,
    },
    {
      id: 3,
      name: 'Consultoria Empresarial',
      cnpj: '11.222.333/0001-44',
      email: 'contato@consultoria.com',
      plan: 'Basic',
      status: 'inactive',
      users: 12,
      createdAt: '2024-01-13',
      lastActivity: '2024-01-18',
      revenue: 500.00,
    },
    {
      id: 4,
      name: 'Serviços Gerais',
      cnpj: '55.666.777/0001-88',
      email: 'info@servicosgerais.com',
      plan: 'Premium',
      status: 'active',
      users: 67,
      createdAt: '2024-01-12',
      lastActivity: '2024-01-20',
      revenue: 3200.00,
    },
    {
      id: 5,
      name: 'Inovação Digital',
      cnpj: '99.888.777/0001-66',
      email: 'contato@inovacaodigital.com',
      plan: 'Standard',
      status: 'pending',
      users: 34,
      createdAt: '2024-01-11',
      lastActivity: '2024-01-17',
      revenue: 0.00,
    },
  ];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.cnpj.includes(searchTerm) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativa</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Premium':
        return <Badge variant="default">Premium</Badge>;
      case 'Standard':
        return <Badge variant="secondary">Standard</Badge>;
      case 'Basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie todas as empresas cadastradas no sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <Building2 className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Empresas Ativas</p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">
                  {companies.filter(c => c.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Empresas Inativas</p>
                <p className="text-xl lg:text-2xl font-bold text-red-600">
                  {companies.filter(c => c.status === 'inactive').length}
                </p>
              </div>
              <XCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                  {companies.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Filter className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
                <option value="pending">Pendentes</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Usuários</TableHead>
                  <TableHead className="hidden lg:table-cell">Receita</TableHead>
                  <TableHead className="hidden xl:table-cell">Última Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.email}</div>
                        <div className="sm:hidden text-xs text-gray-400 mt-1">{company.cnpj}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-sm">{company.cnpj}</TableCell>
                    <TableCell className="hidden md:table-cell">{getPlanBadge(company.plan)}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-center">{company.users}</TableCell>
                    <TableCell className="hidden lg:table-cell font-medium">
                      R$ {company.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                      {new Date(company.lastActivity).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
