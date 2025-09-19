'use client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import Image from 'next/image';
import logobranco from '@/assets/imagens/logobranco.png';
import logopreto from '@/assets/imagens/logopreto.png';
import {
  FiHome,
  FiUsers,
  FiBox,
  FiTool,
  FiDollarSign,
  FiFileText,
  FiLogOut,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiMenu,
  FiX,
  FiGrid,
  FiTruck,
  FiStar,
} from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import { supabase, forceLogout } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import LogoutScreen from '@/components/LogoutScreen';
import { useWhatsAppNotification } from '@/hooks/useWhatsAppNotification';

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { signOut, usuarioData, empresaData } = useAuth();
  const { addToast } = useToast();

  const [userName, setUserName] = useState<string>('');
  const [userLevel, setUserLevel] = useState<string>('');
  const [menuExpandido, setMenuExpandido] = useState<boolean | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showFinanceiroSub, setShowFinanceiroSub] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [financeiroExpanded, setFinanceiroExpanded] = useState(false);
  const [equipamentosExpanded, setEquipamentosExpanded] = useState(false);
  const [contatosExpanded, setContatosExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState<boolean | null>(null);
  const [catalogoHabilitado, setCatalogoHabilitado] = useState<boolean>(false);

  // Ativar notificações WhatsApp automáticas
  useWhatsAppNotification();

  // Debug: Verificar se empresaData está sendo carregado
  useEffect(() => {
    console.log('🔍 MenuLayout: empresaData mudou:', empresaData);
    if (empresaData?.id) {
      console.log('🔍 MenuLayout: Empresa ID carregado:', empresaData.id);
    } else {
      console.log('🔍 MenuLayout: Empresa ID NÃO carregado ainda');
    }
  }, [empresaData]);

  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = (user.user_metadata as { full_name?: string })?.full_name || user.email || '';
        setUserName(name);
        // fetch user level
        const { data: profile } = await supabase
          .from('usuarios')
          .select('nivel')
          .eq('auth_user_id', user.id)
          .single();
        if (profile?.nivel) {
          setUserLevel(profile.nivel);
        }
      }
    })();
  }, []);

  // Buscar configuração do catálogo quando a empresa estiver carregada
  useEffect(() => {
    (async () => {
      try {
        if (!empresaData?.id) return;
        const { data } = await supabase
          .from('configuracoes_empresa')
          .select('catalogo_habilitado')
          .eq('empresa_id', empresaData.id)
          .single();
        if (data && typeof data.catalogo_habilitado === 'boolean') {
          setCatalogoHabilitado(data.catalogo_habilitado);
        }
      } catch {}
    })();
  }, [empresaData?.id]);

  useEffect(() => {
    const stored = localStorage.getItem('menuExpandido') === 'true';
    setMenuExpandido(stored);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('menuRecolhido') === 'true';
    setMenuRecolhido(stored);
  }, []);

  // Inicializar estados de expansão
  useEffect(() => {
    // Expandir automaticamente se estiver na página de categorias
    if (pathname === '/equipamentos/categorias') {
      setEquipamentosExpanded(true);
    }
    // Expandir automaticamente se estiver nas páginas de contatos
    if (pathname === '/clientes' || pathname === '/fornecedores') {
      setContatosExpanded(true);
    }
  }, [pathname]);



  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuExpandido && !target.closest('.menu-dropdown')) {
        setMenuExpandido(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuExpandido]);

  // Remover menuExpandido, hoverTimeout, handleMouseEnter, handleMouseLeave, e toda lógica relacionada
  // Sidebar sempre expandida

  // Função para checar permissão
  const podeVer = (area: string) => {
    // Técnicos sempre podem ver dashboard
    if (area === 'dashboard' && usuarioData?.nivel === 'tecnico') {
      return true;
    }
    return usuarioData?.nivel === 'admin' || usuarioData?.permissoes?.includes(area);
  };

  const toggleMenu = () => {
    const newState = !menuRecolhido;
    setMenuRecolhido(newState);
    localStorage.setItem('menuRecolhido', newState.toString());
  };

  if (menuExpandido === null || menuRecolhido === null) return null;
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar Desktop */}
      <aside className={`${menuRecolhido ? 'w-16' : 'w-64'} bg-black border-r border-white/20 flex flex-col py-8 ${menuRecolhido ? 'px-2' : 'px-4'} h-screen fixed top-0 left-0 z-40 hidden md:flex transition-all duration-300 overflow-y-auto no-print`}>
        {/* Logo branco centralizado */}
        <div className="flex flex-col items-center mb-6">
          {menuRecolhido ? (
            <div className="w-10 h-10 bg-[#D1FE6E] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">C</span>
            </div>
          ) : (
            <Image src={logobranco} alt="Consert Logo" className="h-12 w-auto object-contain" />
          )}
        </div>
        {/* Busca */}
        {!menuRecolhido && (
          <div className="flex items-center gap-2 mb-8">
            <FiSearch className="text-white/60" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar no menu..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition"
            />
          </div>
        )}
        {/* Menu */}
        <nav className="flex flex-col gap-2 flex-1">
          {/* Dashboard - Mostrar dashboard do técnico se for técnico, senão dashboard admin */}
          {(podeVer('dashboard') || usuarioData?.nivel === 'tecnico' || usuarioData?.nivel === 'atendente') && (
            usuarioData?.nivel === 'tecnico' ? (
              <SidebarButton path="/dashboard-tecnico" icon={<FiHome size={20} />} label="Dashboard" isActive={pathname === '/dashboard-tecnico'} menuRecolhido={menuRecolhido} />
            ) : usuarioData?.nivel === 'atendente' ? (
              <SidebarButton path="/dashboard-atendente" icon={<FiHome size={20} />} label="Dashboard" isActive={pathname === '/dashboard-atendente'} menuRecolhido={menuRecolhido} />
            ) : (
              <SidebarButton path="/dashboard" icon={<FiHome size={20} />} label="Dashboard" isActive={pathname === '/dashboard'} menuRecolhido={menuRecolhido} />
            )
          )}
          {podeVer('lembretes') && (
            <SidebarButton path="/lembretes" icon={<FiFileText size={20} />} label="Lembretes" isActive={pathname === '/lembretes'} menuRecolhido={menuRecolhido} />
          )}
          {podeVer('ordens') && (
            <SidebarButton path="/ordens" icon={<FiFileText size={20} />} label="Ordens de Serviço" isActive={pathname === '/ordens'} menuRecolhido={menuRecolhido} />
          )}
          {podeVer('caixa') && (
            <SidebarButton path="/caixa" icon={<FiDollarSign size={20} />} label="Caixa" isActive={pathname === '/caixa'} menuRecolhido={menuRecolhido} />
          )}
          {podeVer('clientes') && (
            <>
              <div 
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10
                  ${menuRecolhido ? 'justify-center' : 'justify-between'}`}
                onClick={() => setContatosExpanded(!contatosExpanded)}
                style={{ minHeight: 48 }}
                title="Contatos"
              >
                <div className="flex items-center">
                  <FiUsers size={20} />
                  {!menuRecolhido && <span className="ml-3">Contatos</span>}
                </div>
                {!menuRecolhido && (
                  <FiChevronDown 
                    size={16} 
                    className={`transition-transform ${contatosExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              
              {contatosExpanded && !menuRecolhido && (
                <div className="ml-6 flex flex-col gap-1 mt-1">
                  <SidebarButton path="/clientes" icon={<FiUsers size={18} />} label="Clientes" isActive={pathname === '/clientes'} menuRecolhido={menuRecolhido} />
                  {podeVer('fornecedores') && (
                    <SidebarButton path="/fornecedores" icon={<FiTruck size={18} />} label="Fornecedores" isActive={pathname === '/fornecedores'} menuRecolhido={menuRecolhido} />
                  )}
                </div>
              )}
            </>
          )}
          {podeVer('equipamentos') && (
            <>
              <div 
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10
                  ${menuRecolhido ? 'justify-center' : 'justify-between'}`}
                onClick={() => setEquipamentosExpanded(!equipamentosExpanded)}
                style={{ minHeight: 48 }}
                title="Produtos/Serviços"
              >
                <div className="flex items-center">
                  <FiBox size={20} />
                  {!menuRecolhido && <span className="ml-3">Produtos/Serviços</span>}
                </div>
                {!menuRecolhido && (
                  <FiChevronDown 
                    size={16} 
                    className={`transition-transform ${equipamentosExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              
              {equipamentosExpanded && !menuRecolhido && (
                <div className="ml-6 flex flex-col gap-1 mt-1">
                  <SidebarButton path="/equipamentos" icon={<FiBox size={18} />} label="Produtos" isActive={pathname === '/equipamentos'} menuRecolhido={menuRecolhido} />
                  <SidebarButton path="/equipamentos/categorias" icon={<FiGrid size={18} />} label="Categorias" isActive={pathname === '/equipamentos/categorias'} menuRecolhido={menuRecolhido} />
                  {catalogoHabilitado && (
                    <SidebarButton path="/catalogo" icon={<FiStar size={18} />} label="Catálogo" isActive={pathname === '/catalogo'} menuRecolhido={menuRecolhido} />
                  )}
                </div>
              )}
            </>
          )}
          {podeVer('financeiro') && (
            <>
              <div 
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10
                  ${menuRecolhido ? 'justify-center' : 'justify-between'}`}
                onClick={() => setFinanceiroExpanded(!financeiroExpanded)}
                style={{ minHeight: 48 }}
                title="Financeiro"
              >
                <div className="flex items-center">
                  <FiDollarSign size={20} />
                  {!menuRecolhido && <span className="ml-3">Financeiro</span>}
                </div>
                {!menuRecolhido && (
                  <FiChevronDown 
                    size={16} 
                    className={`transition-transform ${financeiroExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              
              {financeiroExpanded && !menuRecolhido && (
                <div className="ml-6 flex flex-col gap-1 mt-1">
                  {podeVer('vendas') && (
                    <SidebarButton path="/financeiro/vendas" icon={<FiFileText size={18} />} label="Vendas" isActive={pathname === '/financeiro/vendas'} menuRecolhido={menuRecolhido} />
                  )}
                  {podeVer('movimentacao-caixa') && (
                    <SidebarButton path="/movimentacao-caixa" icon={<FiDollarSign size={18} />} label="Movimentações Caixa" isActive={pathname === '/movimentacao-caixa'} menuRecolhido={menuRecolhido} />
                  )}
                  {podeVer('contas-a-pagar') && (
                    <SidebarButton path="/financeiro/contas-a-pagar" icon={<FiFileText size={18} />} label="Contas a Pagar" isActive={pathname === '/financeiro/contas-a-pagar'} menuRecolhido={menuRecolhido} />
                  )}
                </div>
              )}
            </>
          )}
          {podeVer('bancada') && (
            <SidebarButton path="/bancada" icon={<FiTool size={20} />} label="Bancada" isActive={pathname === '/bancada'} menuRecolhido={menuRecolhido} />
          )}
          {usuarioData?.nivel === 'tecnico' && (
            <SidebarButton path="/comissoes" icon={<FiDollarSign size={20} />} label="Comissões" isActive={pathname === '/comissoes'} menuRecolhido={menuRecolhido} />
          )}
          {podeVer('termos') && (
            <SidebarButton path="#" icon={<FiFileText size={20} />} label="Termos" isActive={pathname === '/termos'} menuRecolhido={menuRecolhido} />
          )}
          <SidebarButton path="/perfil" icon={<FiUsers size={20} />} label="Meu Perfil" isActive={pathname === '/perfil'} menuRecolhido={menuRecolhido} />
          {podeVer('configuracoes') && usuarioData?.nivel !== 'atendente' && (
            <SidebarButton path="/configuracoes" icon={<FiTool size={20} />} label="Configurações" isActive={pathname === '/configuracoes'} menuRecolhido={menuRecolhido} />
          )}
          <SidebarButton path="#logout" icon={<FiLogOut size={20} />} label="Sair" isActive={false} menuRecolhido={menuRecolhido} data-logout="true" onClick={async () => {
            console.log('🔴 Botão Sair clicado!');
            setIsLoggingOut(true);
<<<<<<< HEAD
            try {
              await signOut((msg) => addToast('error', `Erro ao sair: ${msg}`));
              // Redirecionar diretamente para a landing page sem passar por páginas protegidas
              window.location.href = '/';
            } catch (error) {
              addToast('error', 'Erro inesperado ao sair.');
              console.error('Erro ao fazer logout:', error);
            } finally {
              setIsLoggingOut(false);
            }
=======
            
            // Aguardar um momento para mostrar a tela de "Saindo..." bonita
            setTimeout(async () => {
              try {
                console.log('🔴 Executando logout forçado...');
                
                // 1. Pegar tokens atuais antes de limpar
                const { data: { session } } = await supabase.auth.getSession();
                const access_token = session?.access_token;
                const refresh_token = session?.refresh_token;
                
                // 2. Limpar estado local imediatamente
                localStorage.clear();
                sessionStorage.clear();
                console.log('🔴 Estado local limpo');
                
                // 3. Fazer logout do Supabase
                console.log('🔴 Fazendo logout do Supabase...');
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.log('⚠️ Erro no logout Supabase:', error.message);
                } else {
                  console.log('✅ Logout Supabase realizado');
                }
                
                // 4. FORÇAR LOGOUT NO BACKEND (NOVA FUNCIONALIDADE)
                if (access_token && session?.user?.id) {
                  try {
                    console.log('🔴 Forçando logout no backend...');
                    console.log('🔴 User ID:', session.user.id);
                    console.log('🔴 Access Token:', access_token ? 'SIM' : 'NÃO');
                    
                    const response = await fetch('/api/auth/force-logout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        access_token, 
                        refresh_token, 
                        user_id: session.user.id 
                      })
                    });
                    
                    console.log('🔴 Resposta da API:', response.status, response.statusText);
                    
                    if (response.ok) {
                      const result = await response.json();
                      console.log('✅ Logout forçado no backend realizado:', result);
                    } else {
                      const error = await response.text();
                      console.log('⚠️ Erro no logout forçado do backend:', error);
                    }
                  } catch (apiError) {
                    console.log('⚠️ Erro ao chamar API de logout forçado:', apiError);
                  }
                } else {
                  console.log('⚠️ Não foi possível obter access_token ou user_id');
                  console.log('🔴 Access Token:', access_token ? 'SIM' : 'NÃO');
                  console.log('🔴 User ID:', session?.user?.id);
                }
                
                // 5. Limpeza final
                localStorage.clear();
                sessionStorage.clear();
                
                // 6. Redirecionar para login
                console.log('🔄 Redirecionando para login...');
                window.location.href = '/login';
                
              } catch (error) {
                console.error('❌ Erro no logout:', error);
                // Mesmo com erro, forçar redirecionamento
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }
            }, 1500);
>>>>>>> stable-version
          }} />
        </nav>
        {!menuRecolhido && (
          <div className="mt-auto text-center text-xs text-[#D1FE6E] pb-2">
            v1.0.0
          </div>
        )}
      </aside>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex no-print">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          {/* Drawer */}
          <aside className="relative w-64 bg-black border-r border-white/20 flex flex-col py-8 px-4 min-h-screen animate-slide-in">
            <button className="absolute top-4 right-4 text-white" onClick={() => setMobileMenuOpen(false)}>
              <FiX size={28} />
            </button>
            <div className="flex flex-col items-center mb-8">
              <Image src={logobranco} alt="Consert Logo" className="h-12 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <FiSearch className="text-white/60" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar no menu..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E] focus:border-[#D1FE6E] transition"
              />
            </div>
            <nav className="flex flex-col gap-1">
              {/* Dashboard - Mostrar dashboard específico baseado no nível do usuário */}
              {(podeVer('dashboard') || usuarioData?.nivel === 'tecnico' || usuarioData?.nivel === 'atendente') && (
                usuarioData?.nivel === 'tecnico' ? (
                  <SidebarButton path="/dashboard-tecnico" icon={<FiHome size={20} />} label="Dashboard" />
                ) : usuarioData?.nivel === 'atendente' ? (
                  <SidebarButton path="/dashboard-atendente" icon={<FiHome size={20} />} label="Dashboard" />
                ) : (
                  <SidebarButton path="/dashboard" icon={<FiHome size={20} />} label="Dashboard" />
                )
              )}
              {podeVer('lembretes') && (
                <SidebarButton path="/lembretes" icon={<FiFileText size={20} />} label="Lembretes" />
              )}
              {podeVer('ordens') && (
                <SidebarButton path="/ordens" icon={<FiFileText size={20} />} label="Ordens de Serviço" />
              )}
              {podeVer('caixa') && (
                <SidebarButton path="/caixa" icon={<FiDollarSign size={20} />} label="Caixa" />
              )}
              {podeVer('clientes') && (
                <>
                  <div 
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10"
                    onClick={() => setContatosExpanded(!contatosExpanded)}
                    style={{ minHeight: 48 }}
                  >
                    <div className="flex items-center gap-3">
                      <FiUsers size={20} />
                      <span>Contatos</span>
                    </div>
                    <FiChevronDown 
                      size={16} 
                      className={`transition-transform ${contatosExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {contatosExpanded && (
                    <div className="ml-6 flex flex-col gap-1 mt-1">
                      <SidebarButton path="/clientes" icon={<FiUsers size={18} />} label="Clientes" />
                      {podeVer('fornecedores') && (
                        <SidebarButton path="/fornecedores" icon={<FiTruck size={18} />} label="Fornecedores" />
                      )}
                    </div>
                  )}
                </>
              )}
                            {podeVer('equipamentos') && (
                <>
                  <div 
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10"
                    onClick={() => setEquipamentosExpanded(!equipamentosExpanded)}
                    style={{ minHeight: 48 }}
                  >
                    <div className="flex items-center gap-3">
                      <FiBox size={20} />
                      <span>Produtos/Serviços</span>
                    </div>
                    <FiChevronDown 
                      size={16} 
                      className={`transition-transform ${equipamentosExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {equipamentosExpanded && (
                    <div className="ml-6 flex flex-col gap-1 mt-1">
                      <SidebarButton path="/equipamentos" icon={<FiBox size={18} />} label="Produtos" />
                      <SidebarButton path="/equipamentos/categorias" icon={<FiGrid size={18} />} label="Categorias" />
                  {catalogoHabilitado && (
                    <SidebarButton path="/catalogo" icon={<FiStar size={18} />} label="Catálogo" />
                  )}
                    </div>
                  )}
                </>
              )}
              {podeVer('financeiro') && (
                <>
                  <div 
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition font-medium text-base text-white hover:bg-white/10"
                    onClick={() => setFinanceiroExpanded(!financeiroExpanded)}
                    style={{ minHeight: 48 }}
                  >
                    <div className="flex items-center gap-3">
                      <FiDollarSign size={20} />
                      <span>Financeiro</span>
                    </div>
                    <FiChevronDown 
                      size={16} 
                      className={`transition-transform ${financeiroExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                  
                  {financeiroExpanded && (
                    <div className="ml-6 flex flex-col gap-1 mt-1">
                      {podeVer('vendas') && (
                        <SidebarButton path="/financeiro/vendas" icon={<FiFileText size={18} />} label="Vendas" />
                      )}
                      {podeVer('movimentacao-caixa') && (
                        <SidebarButton path="/financeiro/movimentacoes-caixa" icon={<FiDollarSign size={18} />} label="Movimentações Caixa" />
                      )}
                      {podeVer('contas-a-pagar') && (
                        <SidebarButton path="/financeiro/contas-a-pagar" icon={<FiFileText size={18} />} label="Contas a Pagar" />
                      )}
                    </div>
                  )}
                </>
              )}
              {podeVer('bancada') && (
                <SidebarButton path="/bancada" icon={<FiTool size={20} />} label="Bancada" />
              )}
              {usuarioData?.nivel === 'tecnico' && (
                <SidebarButton path="/comissoes" icon={<FiDollarSign size={20} />} label="Comissões" />
              )}
              {podeVer('termos') && (
                <SidebarButton path="#" icon={<FiFileText size={20} />} label="Termos" />
              )}
              <SidebarButton path="/perfil" icon={<FiUsers size={20} />} label="Meu Perfil" />
              {podeVer('configuracoes') && usuarioData?.nivel !== 'atendente' && (
                <SidebarButton path="/configuracoes" icon={<FiTool size={20} />} label="Configurações" />
              )}
<<<<<<< HEAD
              <SidebarButton path="#logout" icon={<FiLogOut size={20} />} label="Sair" isActive={false} onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await signOut((msg) => addToast('error', `Erro ao sair: ${msg}`));
                  // Redirecionar diretamente para a landing page sem passar por páginas protegidas
                  window.location.href = '/';
                } catch (error) {
                  addToast('error', 'Erro inesperado ao sair.');
                  console.error('Erro ao fazer logout:', error);
                } finally {
                  setIsLoggingOut(false);
                }
              }} />
=======
              <SidebarButton 
                path="#logout" 
                icon={<FiLogOut size={20} />} 
                label="Sair" 
                isActive={false} 
                menuRecolhido={menuRecolhido}
                onClick={async () => {
                  console.log('🔴 Botão Sair clicado!');
                  setIsLoggingOut(true);
                  
                  // Aguardar um momento para mostrar a tela de "Saindo..." bonita
                  setTimeout(async () => {
                    try {
                      console.log('🔴 Executando logout forçado...');
                      
                      // 1. Pegar tokens atuais antes de limpar
                      const { data: { session } } = await supabase.auth.getSession();
                      const access_token = session?.access_token;
                      const refresh_token = session?.refresh_token;
                      
                      // 2. Limpar estado local imediatamente
                      localStorage.clear();
                      sessionStorage.clear();
                      console.log('🔴 Estado local limpo');
                      
                      // 3. Fazer logout do Supabase
                      console.log('🔴 Fazendo logout do Supabase...');
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        console.log('⚠️ Erro no logout Supabase:', error.message);
                      } else {
                        console.log('✅ Logout Supabase realizado');
                      }
                      
                      // 4. FORÇAR LOGOUT NO BACKEND (NOVA FUNCIONALIDADE)
                      if (access_token && session?.user?.id) {
                        try {
                          console.log('🔴 Forçando logout no backend...');
                          console.log('🔴 User ID:', session.user.id);
                          console.log('🔴 Access Token:', access_token ? 'SIM' : 'NÃO');
                          
                          const response = await fetch('/api/auth/force-logout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              access_token, 
                              refresh_token, 
                              user_id: session.user.id 
                            })
                          });
                          
                          console.log('🔴 Resposta da API:', response.status, response.statusText);
                          
                          if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Logout forçado no backend realizado:', result);
                          } else {
                            const error = await response.text();
                            console.log('⚠️ Erro no logout forçado do backend:', error);
                          }
                        } catch (apiError) {
                          console.log('⚠️ Erro ao chamar API de logout forçado:', apiError);
                        }
                      } else {
                        console.log('⚠️ Não foi possível obter access_token ou user_id');
                        console.log('🔴 Access Token:', access_token ? 'SIM' : 'NÃO');
                        console.log('🔴 User ID:', session?.user?.id);
                      }
                      
                      // 5. Limpeza final
                      localStorage.clear();
                      sessionStorage.clear();
                      
                      // 6. Redirecionar para login
                      console.log('🔄 Redirecionando para login...');
                      window.location.href = '/login';
                      
                    } catch (error) {
                      console.error('❌ Erro no logout:', error);
                      // Mesmo com erro, forçar redirecionamento
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }
                  }, 1500);
                }} 
              />
>>>>>>> stable-version
            </nav>
            <div className="mt-auto text-center text-xs text-[#D1FE6E] pb-4">
              v1.0.0
            </div>
          </aside>
        </div>
      )}
      {/* Main area with header and content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${menuRecolhido ? 'ml-16' : 'ml-64'}`}>
        {/* TopHeader */}
        <header className="w-full h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-30 no-print">
          {/* Botão menu mobile */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-700">
              <FiMenu size={28} />
            </button>
          </div>
          {/* Botão hambúrguer desktop */}
          <div className="hidden md:flex items-center">
            <button
              onClick={toggleMenu}
              className="text-zinc-700 hover:text-[#D1FE6E] transition-colors duration-200 p-2 rounded-lg hover:bg-zinc-100"
              title={menuRecolhido ? "Expandir menu" : "Recolher menu"}
            >
              {menuRecolhido ? (
                // Ícone hambúrguer
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                // Ícone seta esquerda
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <SubscriptionStatus />
            <div className="flex items-center gap-2 bg-zinc-100 rounded-lg px-3 py-2">
              <FiSearch className="text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent text-zinc-700 text-sm focus:outline-none w-32 md:w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              {usuarioData?.foto_url ? (
                <img
                  src={usuarioData.foto_url}
                  alt="Foto de perfil"
                  className="rounded-full border-2 border-lime-400 object-cover w-8 h-8"
                />
              ) : (
                <div className="rounded-full border-2 border-lime-400 bg-lime-200 w-8 h-8 flex items-center justify-center">
                  <span className="text-base font-bold text-lime-700">
                    {usuarioData?.nome?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="text-zinc-700 text-sm font-medium">{usuarioData?.nome || userName}</span>
            </div>
            <div className="relative">
              <FiBell
                className="text-zinc-500 hover:text-lime-500 cursor-pointer transition-colors"
                size={20}
                onClick={() => setShowNotifications(!showNotifications)}
              />
              {showNotifications && (
                <div className="absolute right-0 top-8 w-72 z-50">
                  <div className="bg-white text-black rounded-xl shadow-xl p-4 border border-black/10">
                    <h4 className="font-semibold text-sm mb-2">Notificações</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="border-b border-gray-200 pb-1">🔧 Ordem #324 foi aprovada.</li>
                      <li className="border-b border-gray-200 pb-1">📦 Novo produto cadastrado.</li>
                      <li>💰 Entrada no financeiro registrada.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Conteúdo principal */}
        <main className="flex-1 p-4 md:p-8 w-full max-w-full">
          {children}
        </main>
      </div>
      
      {/* Tela de Logout */}
      {isLoggingOut && <LogoutScreen />}
    </div>
  );
}

function SidebarButton({ path, icon, label, isActive, onClick, menuRecolhido }: { path: string; icon: React.ReactNode; label: string; isActive: boolean; onClick?: () => void; menuRecolhido: boolean }) {
  return (
    <button
      onClick={onClick || (() => window.location.href = path)}
      className={`flex items-center w-full px-3 py-2 rounded-lg transition font-medium text-base
        ${menuRecolhido ? 'justify-center' : 'justify-start'}
        ${isActive ? 'bg-[#D1FE6E] text-black' : 'hover:bg-white/10 text-white'}`}
      style={{ minHeight: 48 }}
      title={label}
    >
      {icon}
      {!menuRecolhido && <span className="ml-3 whitespace-nowrap">{label}</span>}
    </button>
  );
}

// Função de upload de foto
async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file || !usuarioData?.id) return;
  const filePath = `user-${usuarioData.id}/${file.name}`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (!error) {
    const url = supabase.storage.from('avatars').getPublicUrl(filePath).publicUrl;
    await supabase.from('usuarios').update({ foto_url: url }).eq('id', usuarioData.id);
    // Atualize o contexto do usuário se necessário
    addToast('success', 'Foto atualizada!');
    setShowProfileModal(false);
    window.location.reload(); // Força atualização do avatar
  } else {
    addToast('error', 'Erro ao fazer upload da foto.');
  }
}