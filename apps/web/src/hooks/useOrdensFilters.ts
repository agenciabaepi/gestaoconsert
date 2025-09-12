import { useState, useMemo, useCallback } from 'react';
import { OrdemTransformada } from './useOrdens';

interface UseOrdensFiltersReturn {
  // Estados dos filtros
  searchTerm: string;
  statusFilter: string;
  aparelhoFilter: string;
  tecnicoFilter: string;
  tipoFilter: string;
  activeTab: string;
  currentPage: number;
  itemsPerPage: number;
  
  // Setters
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setAparelhoFilter: (aparelho: string) => void;
  setTecnicoFilter: (tecnico: string) => void;
  setTipoFilter: (tipo: string) => void;
  setActiveTab: (tab: string) => void;
  setCurrentPage: (page: number) => void;
  
  // Dados filtrados
  ordensFiltered: OrdemTransformada[];
  totalPages: number;
  paginatedOrdens: OrdemTransformada[];
  
  // Contadores para abas
  contadores: {
    todas: number;
    abertas: number;
    analise: number;
    aprovadas: number;
    concluidas: number;
    entregues: number;
    retornos: number;
  };
  
  // Funções utilitárias
  clearFilters: () => void;
  resetPagination: () => void;
}

export const useOrdensFilters = (ordens: OrdemTransformada[]): UseOrdensFiltersReturn => {
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aparelhoFilter, setAparelhoFilter] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Função para filtrar por aba
  const filterByTab = useCallback((ordens: OrdemTransformada[], tab: string) => {
    switch (tab) {
      case 'abertas':
        return ordens.filter(os => 
          os.statusOS?.toLowerCase().includes('aberta') || 
          os.statusOS?.toLowerCase().includes('aguardando')
        );
      case 'analise':
        return ordens.filter(os => 
          os.statusOS?.toLowerCase().includes('análise') ||
          os.statusOS?.toLowerCase().includes('analise') ||
          os.statusTecnico?.toLowerCase().includes('análise') ||
          os.statusTecnico?.toLowerCase().includes('analise')
        );
      case 'aprovadas':
        return ordens.filter(os => 
          os.statusOS?.toLowerCase().includes('aprovad') ||
          os.statusTecnico?.toLowerCase().includes('aprovad')
        );
      case 'concluidas':
        return ordens.filter(os => 
          os.statusOS?.toLowerCase().includes('concluíd') ||
          os.statusOS?.toLowerCase().includes('concluido') ||
          os.statusOS?.toLowerCase().includes('finaliz')
        );
      case 'entregues':
        return ordens.filter(os => 
          os.statusOS?.toLowerCase().includes('entreg')
        );
      case 'retornos':
        return ordens.filter(os => 
          os.tipo?.toLowerCase() === 'retorno'
        );
      default:
        return ordens;
    }
  }, []);

  // Ordens filtradas
  const ordensFiltered = useMemo(() => {
    let filtered = [...ordens];

    // Filtro por aba
    filtered = filterByTab(filtered, activeTab);

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(os => 
        os.numeroOS?.toLowerCase().includes(term) ||
        os.cliente?.toLowerCase().includes(term) ||
        os.telefone?.toLowerCase().includes(term) ||
        os.marca?.toLowerCase().includes(term) ||
        os.modelo?.toLowerCase().includes(term) ||
        os.categoria?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter(os => 
        os.statusOS?.toLowerCase().includes(statusFilter.toLowerCase()) ||
        os.statusTecnico?.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    // Filtro por aparelho
    if (aparelhoFilter) {
      filtered = filtered.filter(os => 
        os.categoria?.toLowerCase().includes(aparelhoFilter.toLowerCase()) ||
        os.marca?.toLowerCase().includes(aparelhoFilter.toLowerCase()) ||
        os.modelo?.toLowerCase().includes(aparelhoFilter.toLowerCase())
      );
    }

    // Filtro por técnico
    if (tecnicoFilter) {
      filtered = filtered.filter(os => 
        os.tecnico?.toLowerCase().includes(tecnicoFilter.toLowerCase())
      );
    }

    // Filtro por tipo
    if (tipoFilter) {
      filtered = filtered.filter(os => 
        os.tipo?.toLowerCase().includes(tipoFilter.toLowerCase())
      );
    }

    return filtered;
  }, [ordens, activeTab, searchTerm, statusFilter, aparelhoFilter, tecnicoFilter, tipoFilter, filterByTab]);

  // Contadores para abas
  const contadores = useMemo(() => {
    return {
      todas: ordens.length,
      abertas: filterByTab(ordens, 'abertas').length,
      analise: filterByTab(ordens, 'analise').length,
      aprovadas: filterByTab(ordens, 'aprovadas').length,
      concluidas: filterByTab(ordens, 'concluidas').length,
      entregues: filterByTab(ordens, 'entregues').length,
      retornos: filterByTab(ordens, 'retornos').length
    };
  }, [ordens, filterByTab]);

  // Paginação
  const totalPages = Math.ceil(ordensFiltered.length / itemsPerPage);
  const paginatedOrdens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return ordensFiltered.slice(startIndex, endIndex);
  }, [ordensFiltered, currentPage, itemsPerPage]);

  // Funções utilitárias
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setAparelhoFilter('');
    setTecnicoFilter('');
    setTipoFilter('');
    setActiveTab('todas');
    setCurrentPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset da paginação quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, aparelhoFilter, tecnicoFilter, tipoFilter, activeTab]);

  return {
    // Estados dos filtros
    searchTerm,
    statusFilter,
    aparelhoFilter,
    tecnicoFilter,
    tipoFilter,
    activeTab,
    currentPage,
    itemsPerPage,
    
    // Setters
    setSearchTerm,
    setStatusFilter,
    setAparelhoFilter,
    setTecnicoFilter,
    setTipoFilter,
    setActiveTab,
    setCurrentPage,
    
    // Dados filtrados
    ordensFiltered,
    totalPages,
    paginatedOrdens,
    
    // Contadores
    contadores,
    
    // Funções utilitárias
    clearFilters,
    resetPagination
  };
};