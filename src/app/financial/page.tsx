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
import { SafeNumber } from '@/components/SafeNumber';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Search, 
  Filter, 
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dados mockados para demonstração
  const financialData = {
    totalRevenue: 45680,
    monthlyRevenue: 12350,
    pendingPayments: 8,
    averageTicket: 320.50,
    mrr: 12350,
    arr: 148200,
    churnRate: 2.3,
  };

  const payments = [
    {
      id: 1,
      company: 'Tech Solutions LTDA',
      invoice: 'INV-001',
      amount: 2500.00,
      plan: 'Premium',
      status: 'paid',
      method: 'PIX',
      dueDate: '2024-01-14',
      paymentDate: '2024-01-14',
    },
    {
      id: 2,
      company: 'Digital Marketing Pro',
      invoice: 'INV-002',
      amount: 1200.00,
      plan: 'Standard',
      status: 'pending',
      method: 'Cartão',
      dueDate: '2024-01-15',
      paymentDate: null,
    },
    {
      id: 3,
      company: 'Consultoria Empresarial',
      invoice: 'INV-003',
      amount: 500.00,
      plan: 'Basic',
      status: 'paid',
      method: 'Boleto',
      dueDate: '2024-01-13',
      paymentDate: '2024-01-13',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Pago</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Módulo Financeiro</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie pagamentos, receitas e relatórios financeiros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  <SafeNumber value={financialData.totalRevenue} format="currency" />
                </p>
              </div>
              <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-600">
                  <SafeNumber value={financialData.monthlyRevenue} format="currency" />
                </p>
              </div>
              <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                  {financialData.pendingPayments}
                </p>
              </div>
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-xl lg:text-2xl font-bold text-purple-600">
                  <SafeNumber value={financialData.averageTicket} format="currency" />
                </p>
              </div>
              <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <Button variant="default" size="sm">Pagamentos</Button>
            <Button variant="outline" size="sm">Relatórios</Button>
            <Button variant="outline" size="sm">Analytics</Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por empresa ou fatura..."
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
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="overdue">Vencidos</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">Fatura</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Método</TableHead>
                  <TableHead className="hidden xl:table-cell">Vencimento</TableHead>
                  <TableHead className="hidden xl:table-cell">Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{payment.company}</div>
                        <div className="sm:hidden text-xs text-gray-400 mt-1">
                          {payment.invoice} • <SafeNumber value={payment.amount} format="currency" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-sm">{payment.invoice}</TableCell>
                    <TableCell className="hidden md:table-cell font-medium">
                      <SafeNumber value={payment.amount} format="currency" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{getPlanBadge(payment.plan)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{payment.method}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
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