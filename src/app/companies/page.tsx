'use client';

import React, { useState } from 'react';
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
import { useEmpresas } from '@/hooks/useApi';
import { SafeNumber } from '@/components/SafeNumber';
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
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: empresasData, loading, error, refetch } = useEmpresas({
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const companies = empresasData?.items || [];
  const totalCompanies = empresasData?.total || 0;
  const totalPages = empresasData?.totalPages || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativa</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'trial':
        return <Badge variant="outline">Trial</Badge>;
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
        return <Badge variant="outline">{plan || 'N/A'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
            <p className="text-sm text-gray-600 mt-1">Gerencie todas as empresas cadastradas no sistema</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando empresas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
            <p className="text-sm text-gray-600 mt-1">Gerencie todas as empresas cadastradas no sistema</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar empresas</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">
                      <SafeNumber value={totalCompanies} />
                    </p>
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
                      <SafeNumber value={companies.filter(c => c.status === 'active').length} />
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
                      <SafeNumber value={companies.filter(c => c.status === 'inactive').length} />
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
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Em Trial</p>
                    <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                      <SafeNumber value={companies.filter(c => c.status === 'trial').length} />
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
                    {companies.map((company: any) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{company.nome}</div>
                            <div className="text-sm text-gray-500">{company.email}</div>
                            <div className="sm:hidden text-xs text-gray-400 mt-1">{company.cnpj}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">{company.cnpj}</TableCell>
                        <TableCell className="hidden md:table-cell">{getPlanBadge(company.plano_nome)}</TableCell>
                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center">{company.usuarios_count || 0}</TableCell>
                        <TableCell className="hidden lg:table-cell font-medium">
                          <SafeNumber value={company.ultimo_pagamento?.valor || 0} format="currency" />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                          {company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : 'N/A'}
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
