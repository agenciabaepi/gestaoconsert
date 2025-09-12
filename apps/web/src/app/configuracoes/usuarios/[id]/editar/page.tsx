'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiShield,
  FiSave,
  FiX,
  FiCheck
} from 'react-icons/fi';
import { 
  User, 
  Users, 
  FileText, 
  Settings, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Database,
  BarChart3,
  ClipboardList,
  Wrench,
  CreditCard,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Truck,
  Grid,
  Star
} from 'lucide-react';

// Sistema de permissões em cascata
const PERMISSOES_CASCATA = {
  // Módulos principais (independentes)
  principais: [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Visão geral do sistema' },
    { key: 'lembretes', label: 'Lembretes', icon: Bell, description: 'Gerenciar lembretes e notificações' },
    { key: 'ordens', label: 'Ordens de Serviço', icon: FileText, description: 'Gestão de ordens de serviço' },
    { key: 'bancada', label: 'Bancada', icon: Wrench, description: 'Controle de bancada técnica' },
    { key: 'caixa', label: 'Caixa/PDV', icon: CreditCard, description: 'Sistema de caixa e vendas' },
    { key: 'termos', label: 'Termos', icon: FileText, description: 'Termos de garantia' },
  ],
  
  // Módulo Financeiro (com sub-permissões)
  financeiro: {
    key: 'financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    description: 'Controle financeiro completo',
    subPermissoes: [
      { key: 'vendas', label: 'Vendas', icon: ShoppingCart, description: 'Gestão de vendas' },
      { key: 'movimentacao-caixa', label: 'Movimentações Caixa', icon: DollarSign, description: 'Controle de movimentações' },
      { key: 'contas-a-pagar', label: 'Contas a Pagar', icon: FileText, description: 'Gestão de contas' },
    ]
  },
  
  // Módulo Contatos (com sub-permissões)
  contatos: {
    key: 'clientes',
    label: 'Contatos',
    icon: Users,
    description: 'Gestão de contatos e relacionamentos',
    subPermissoes: [
      { key: 'fornecedores', label: 'Fornecedores', icon: Truck, description: 'Gestão de fornecedores' },
    ]
  },
  
  // Módulo Produtos (com sub-permissões)
  produtos: {
    key: 'equipamentos',
    label: 'Produtos/Serviços',
    icon: Database,
    description: 'Inventário e catálogo',
    subPermissoes: [
      { key: 'categorias', label: 'Categorias', icon: Grid, description: 'Organização por categorias' },
      { key: 'catalogo', label: 'Catálogo', icon: Star, description: 'Catálogo público' },
    ]
  },
  
  // Módulos avançados (independentes)
  avancadas: [
    { key: 'configuracoes', label: 'Configurações', icon: Settings, description: 'Configurações do sistema' },
    { key: 'relatorios', label: 'Relatórios', icon: BarChart3, description: 'Relatórios e análises' },
    { key: 'usuarios', label: 'Usuários', icon: Users, description: 'Gestão de usuários' },
    { key: 'backup', label: 'Backup', icon: Database, description: 'Backup e restauração' },
    { key: 'logs', label: 'Logs do Sistema', icon: FileText, description: 'Registros de atividades' },
    { key: 'api', label: 'API', icon: Settings, description: 'Configurações de API' }
  ]
};

// Lista plana para compatibilidade (mantida para não quebrar código existente)
const PERMISSOES_SISTEMA = [
  ...PERMISSOES_CASCATA.principais,
  PERMISSOES_CASCATA.financeiro,
  ...PERMISSOES_CASCATA.financeiro.subPermissoes,
  PERMISSOES_CASCATA.contatos,
  ...PERMISSOES_CASCATA.contatos.subPermissoes,
  PERMISSOES_CASCATA.produtos,
  ...PERMISSOES_CASCATA.produtos.subPermissoes,
  ...PERMISSOES_CASCATA.avancadas
];

function EditarUsuarioPageInner() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { session } = useAuth();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    usuario: '',
    senha: '',
    cpf: '',
    whatsapp: '',
    nivel: '',
    permissoes: [] as string[],
    auth_user_id: '',
  });

  // Estados de validação
  const [emailValido, setEmailValido] = useState(true);
  const [cpfValido, setCpfValido] = useState(true);
  const [usuarioValido, setUsuarioValido] = useState(true);

  // Função para validar CPF
  const validarCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    if (/^(\d)\1+$/.test(cpfLimpo)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto < 2 ? 0 : resto;
    
    return cpfLimpo.charAt(9) === dv1.toString() && cpfLimpo.charAt(10) === dv2.toString();
  };

  // Função para validar email
  const validarEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar usuário único (excluindo o usuário atual)
  const validarUsuarioUnico = async (usuario: string) => {
    if (!usuario.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('usuario', usuario.trim().toLowerCase())
        .neq('id', userId)
        .single();
      
      return !data; // Retorna true se não existir (válido)
    } catch {
      return true; // Se não encontrar, é válido
    }
  };

  // Função para validar email único (excluindo o usuário atual)
  const validarEmailUnico = async (email: string) => {
    if (!email.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .neq('id', userId)
        .single();
      
      return !data; // Retorna true se não existir (válido)
    } catch {
      return true; // Se não encontrar, é válido
    }
  };

  // Função para validar CPF único (excluindo o usuário atual)
  const validarCPFUnico = async (cpf: string) => {
    if (!cpf.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('cpf', cpf.replace(/\D/g, ''))
        .neq('id', userId)
        .single();
      
      return !data; // Retorna true se não existir (válido)
    } catch {
      return true; // Se não encontrar, é válido
    }
  };

  // Validação em tempo real
  useEffect(() => {
    if (form.email) {
      setEmailValido(validarEmail(form.email));
    }
  }, [form.email]);

  useEffect(() => {
    if (form.cpf) {
      const cpfValido = validarCPF(form.cpf);
      
      // Se o CPF for válido, verificar se já existe no banco
      if (cpfValido && form.cpf.trim()) {
        validarCPFUnico(form.cpf).then((cpfUnico) => {
          setCpfValido(cpfUnico); // true se único, false se duplicado
        });
      } else {
        setCpfValido(cpfValido); // false se formato inválido
      }
    } else {
      setCpfValido(true); // CPF vazio é válido
    }
  }, [form.cpf]);

  useEffect(() => {
    if (form.usuario) {
      validarUsuarioUnico(form.usuario).then(setUsuarioValido);
    }
  }, [form.usuario, userId]);

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) {
        return;
      }
      
      setLoading(true);
      
      try {
        // Buscar dados do usuário
        const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
          .select(`
            nome, 
            email, 
            usuario, 
            cpf, 
            whatsapp, 
            nivel, 
            permissoes, 
            auth_user_id,
            empresa_id
          `)
        .eq('id', userId)
          .single();

        if (usuarioError) {
          console.error('❌ Erro ao buscar usuário:', usuarioError);
          addToast('error', `Erro ao carregar dados do usuário: ${usuarioError.message || 'Erro desconhecido'}`);
          setLoading(false);
          return;
        }

        if (!usuarioData) {
          addToast('error', 'Usuário não encontrado');
          setLoading(false);
          return;
        }

        // Buscar dados da empresa para validação
        if (usuarioData.empresa_id) {
          const { data: empresaData, error: empresaError } = await supabase
            .from('empresas')
            .select('nome')
            .eq('id', usuarioData.empresa_id)
            .single();

          if (empresaError) {
            console.error('⚠️ Erro ao buscar empresa:', empresaError);
          } else {
            }
        }

        // Verificar se campos obrigatórios existem
        if (!usuarioData.nome || !usuarioData.email || !usuarioData.usuario) {
          console.error('❌ Campos obrigatórios ausentes:', {
            nome: usuarioData.nome,
            email: usuarioData.email,
            usuario: usuarioData.usuario
          });
          addToast('error', 'Dados do usuário incompletos ou inválidos');
        setLoading(false);
        return;
      }

      setForm({
          nome: usuarioData.nome || '',
          email: usuarioData.email || '',
          usuario: usuarioData.usuario || '',
        senha: '',
          cpf: usuarioData.cpf || '',
          whatsapp: usuarioData.whatsapp || '',
          nivel: usuarioData.nivel || '',
          permissoes: Array.isArray(usuarioData.permissoes) ? usuarioData.permissoes : [],
          auth_user_id: usuarioData.auth_user_id || '',
        });

        // Removido toast de sucesso para evitar spam
      } catch (error) {
        console.error('💥 Erro inesperado ao carregar usuário:', error);
        addToast('error', `Erro inesperado ao carregar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
      setLoading(false);
      }
    };

    fetchUsuario();
  }, [userId, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Preencher permissões padrão ao trocar nível
    if (name === 'nivel') {
      let permissoesPadrao: string[] = [];
      if (value === 'tecnico') {
        permissoesPadrao = ['dashboard', 'ordens', 'clientes', 'bancada', 'equipamentos'];
      } else if (value === 'financeiro') {
        permissoesPadrao = ['dashboard', 'lembretes', 'clientes', 'ordens', 'equipamentos', 'financeiro', 'vendas', 'caixa'];
      } else if (value === 'atendente') {
        permissoesPadrao = ['dashboard', 'lembretes', 'clientes', 'ordens', 'equipamentos', 'caixa', 'produtos'];
      } else if (value === 'admin') {
        permissoesPadrao = PERMISSOES_SISTEMA.map(p => p.key);
      }
      
      // ✅ GARANTIR: Dashboard sempre presente nas permissões padrão
      if (!permissoesPadrao.includes('dashboard')) {
        permissoesPadrao.push('dashboard');
      }
      
      setForm((prev) => ({ ...prev, permissoes: permissoesPadrao }));
    }
  };

  // Função para gerenciar permissões em cascata
  const handlePermissaoChange = (key: string) => {
    // ✅ PROTEÇÃO: Dashboard é permissão fixa e obrigatória
    if (key === 'dashboard') {
      addToast('warning', 'Dashboard é uma permissão obrigatória e não pode ser removida');
      return;
    }

    setForm((prev) => {
      const novasPermissoes = [...prev.permissoes];
      const permissaoAtual = novasPermissoes.includes(key);
      
      if (permissaoAtual) {
        // Desmarcando permissão principal
        const permissaoRemovida = novasPermissoes.filter((p) => p !== key);
        
        // ✅ GARANTIR: Dashboard sempre presente
        if (!permissaoRemovida.includes('dashboard')) {
          permissaoRemovida.push('dashboard');
        }
        
        // Se for financeiro, remover também sub-permissões
        if (key === 'financeiro') {
          PERMISSOES_CASCATA.financeiro.subPermissoes.forEach(sub => {
            const index = permissaoRemovida.indexOf(sub.key);
            if (index > -1) permissaoRemovida.splice(index, 1);
          });
        }
        
        // Se for clientes, remover também sub-permissões
        if (key === 'clientes') {
          PERMISSOES_CASCATA.contatos.subPermissoes.forEach(sub => {
            const index = permissaoRemovida.indexOf(sub.key);
            if (index > -1) permissaoRemovida.splice(index, 1);
          });
        }
        
        // Se for equipamentos, remover também sub-permissões
        if (key === 'equipamentos') {
          PERMISSOES_CASCATA.produtos.subPermissoes.forEach(sub => {
            const index = permissaoRemovida.indexOf(sub.key);
            if (index > -1) permissaoRemovida.splice(index, 1);
          });
        }
        
        return { ...prev, permissoes: permissaoRemovida };
      } else {
        // Marcando permissão principal
        novasPermissoes.push(key);
        
        // ✅ GARANTIR: Dashboard sempre presente
        if (!novasPermissoes.includes('dashboard')) {
          novasPermissoes.push('dashboard');
        }
        
        // Se for financeiro, adicionar também sub-permissões
        if (key === 'financeiro') {
          PERMISSOES_CASCATA.financeiro.subPermissoes.forEach(sub => {
            if (!novasPermissoes.includes(sub.key)) {
              novasPermissoes.push(sub.key);
            }
          });
        }
        
        // Se for clientes, adicionar também sub-permissões
        if (key === 'clientes') {
          PERMISSOES_CASCATA.contatos.subPermissoes.forEach(sub => {
            if (!novasPermissoes.includes(sub.key)) {
              novasPermissoes.push(sub.key);
            }
          });
        }
        
        // Se for equipamentos, adicionar também sub-permissões
        if (key === 'equipamentos') {
          PERMISSOES_CASCATA.produtos.subPermissoes.forEach(sub => {
            if (!novasPermissoes.includes(sub.key)) {
              novasPermissoes.push(sub.key);
            }
          });
        }
        
        return { ...prev, permissoes: novasPermissoes };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações finais
    if (!emailValido) {
      addToast('error', 'E-mail inválido');
      return;
    }
    
    if (form.cpf && form.cpf.trim() && !cpfValido) {
      addToast('error', 'CPF inválido');
      return;
    }
    
    if (!usuarioValido) {
      addToast('error', 'Nome de usuário já existe');
      return;
    }

    // Validações de unicidade
    const emailUnico = await validarEmailUnico(form.email);
    const usuarioUnico = await validarUsuarioUnico(form.usuario);
    const cpfUnico = form.cpf && form.cpf.trim() ? await validarCPFUnico(form.cpf) : true;

    if (!emailUnico) {
      addToast('error', 'E-mail já cadastrado');
      return;
    }

    if (!usuarioUnico) {
      addToast('error', 'Nome de usuário já existe');
      return;
    }

    if (!cpfUnico) {
      addToast('error', 'CPF já cadastrado');
      return;
    }

    setSaving(true);
    
    try {
    const updateData: any = {
      id: userId,
      nome: form.nome,
      email: form.email,
      usuario: form.usuario.trim().toLowerCase(),
        cpf: form.cpf?.trim() || null, // ⭐ Envia null se CPF estiver vazio
      whatsapp: form.whatsapp,
      nivel: form.nivel,
      permissoes: form.permissoes,
      auth_user_id: form.auth_user_id,
    };
      
    if (form.senha) {
      updateData.senha = form.senha;
    }

    // Chama a API de edição
    const response = await fetch('/api/usuarios/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
      
    const result = await response.json();
      
    if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar alterações');
      }
      
      addToast('success', 'Usuário atualizado com sucesso!');
      router.push('/configuracoes?tab=1');
      
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      addToast('error', error instanceof Error ? error.message : 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const confirmar = await confirm({
      title: 'Cancelar Edição',
      message: 'Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.',
      confirmText: 'Sim, Cancelar',
      cancelText: 'Continuar Editando'
    });

    if (confirmar) {
      router.push('/configuracoes?tab=1');
    }
  };

  if (loading) {
    return (
      <MenuLayout>
        <main className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados do usuário...</p>
            </div>
          </div>
        </main>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
      <main className="p-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/configuracoes?tab=1')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                      Editar Usuário
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-1">
                      Atualize as informações e permissões do usuário
                    </p>
                  </div>
                </div>
              </div>
        </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações Básicas */}
              <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FiUser className="w-5 h-5" />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome Completo *
                    </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                      placeholder="Digite o nome completo"
                required
              />
            </div>

                  {/* Usuário */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome de Usuário *
                    </label>
                    <div className="relative">
              <input
                type="text"
                name="usuario"
                value={form.usuario}
                onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          usuarioValido 
                            ? 'border-gray-300 focus:ring-gray-900' 
                            : 'border-red-500 focus:ring-red-500'
                        }`}
                        placeholder="Digite o nome de usuário"
                required
              />
                      {form.usuario && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {usuarioValido ? (
                            <FiCheck className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiX className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {form.usuario && !usuarioValido && (
                      <p className="text-red-500 text-xs">Nome de usuário já existe</p>
                    )}
            </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      E-mail *
                    </label>
                    <div className="relative">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          emailValido 
                            ? 'border-gray-300 focus:ring-gray-900' 
                            : 'border-red-500 focus:ring-red-500'
                        }`}
                        placeholder="Digite o e-mail"
                required
              />
                      {form.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {emailValido ? (
                            <FiCheck className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiX className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {form.email && !emailValido && (
                      <p className="text-red-500 text-xs">E-mail inválido</p>
                    )}
            </div>

                  {/* Senha */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nova Senha
                    </label>
                    <div className="relative">
              <input
                        type={senhaVisivel ? 'text' : 'password'}
                name="senha"
                value={form.senha}
                onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 pr-12"
                        placeholder="Deixe em branco para não alterar"
                      />
                      <button
                        type="button"
                        onClick={() => setSenhaVisivel(!senhaVisivel)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {senhaVisivel ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
            </div>
                    <p className="text-xs text-gray-500">Deixe em branco para manter a senha atual</p>
            </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      CPF
                    </label>
                    <div className="relative">
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          cpfValido 
                            ? 'border-gray-300 focus:ring-gray-900' 
                            : 'border-red-500 focus:ring-red-500'
                        }`}
                        placeholder="000.000.000-00 (opcional)"
                      />
                      {form.cpf && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {cpfValido ? (
                            <FiCheck className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiX className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {form.cpf && !cpfValido && (
                      <p className="text-red-500 text-xs">
                        {form.cpf && validarCPF(form.cpf) ? 'CPF já cadastrado' : 'CPF inválido'}
                      </p>
                    )}
            </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      WhatsApp
                    </label>
              <input
                type="text"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                      placeholder="(00) 00000-0000"
              />
            </div>

                  {/* Nível */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nível de Acesso *
                    </label>
              <select
                name="nivel"
                value={form.nivel}
                onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                required
              >
                      <option value="">Selecione o nível...</option>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="atendente">Atendente</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
                </div>
              </div>

              {/* Permissões de Acesso */}
              <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissões de Acesso
                </h3>
                
                <div className="space-y-6">
                  {/* Módulos Principais */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Módulos Principais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PERMISSOES_CASCATA.principais.map((permissao) => {
                        const IconComponent = permissao.icon;
                        const isChecked = form.permissoes.includes(permissao.key);
                        const isDashboard = permissao.key === 'dashboard';
                        
                        return (
                          <label 
                            key={permissao.key} 
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                              isDashboard 
                                ? 'border-green-600 bg-green-50 cursor-not-allowed' 
                                : isChecked 
                                  ? 'border-gray-900 bg-gray-50 cursor-pointer' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDashboard}
                              onChange={() => handlePermissaoChange(permissao.key)}
                              className={`mt-1 w-4 h-4 rounded focus:ring-gray-900 ${
                                isDashboard 
                                  ? 'text-green-600 border-green-300 bg-green-100' 
                                  : 'text-gray-900 border-gray-300'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <IconComponent className={`w-4 h-4 ${isDashboard ? 'text-green-600' : 'text-gray-600'}`} />
                                <span className={`font-medium ${isDashboard ? 'text-green-900' : 'text-gray-900'}`}>
                                  {permissao.label}
                                  {isDashboard && <span className="text-xs text-green-600 font-medium ml-1">(Obrigatório)</span>}
                                </span>
                              </div>
                              <p className={`text-xs ${isDashboard ? 'text-green-700' : 'text-gray-600'}`}>
                                {permissao.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Módulo Financeiro com Sub-permissões */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Módulo Financeiro</h4>
                    <div className="space-y-3">
                      {/* Permissão Principal */}
                      <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        form.permissoes.includes('financeiro')
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={form.permissoes.includes('financeiro')}
                          onChange={() => handlePermissaoChange('financeiro')}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {PERMISSOES_CASCATA.financeiro.label}
                            </span>
                            <span className="text-xs text-blue-600 font-medium">(Principal)</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {PERMISSOES_CASCATA.financeiro.description}
                          </p>
                        </div>
                      </label>
                      
                      {/* Sub-permissões */}
                      {form.permissoes.includes('financeiro') && (
                        <div className="ml-8 space-y-2">
                          {PERMISSOES_CASCATA.financeiro.subPermissoes.map((subPermissao) => {
                            const IconComponent = subPermissao.icon;
                            const isChecked = form.permissoes.includes(subPermissao.key);
                            
                            return (
                              <label 
                                key={subPermissao.key} 
                                className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 ${
                                  isChecked 
                                    ? 'border-blue-400 bg-blue-25' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissaoChange(subPermissao.key)}
                                  className="mt-1 w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IconComponent className="w-3 h-3 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {subPermissao.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {subPermissao.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Módulo Contatos com Sub-permissões */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Módulo Contatos</h4>
                    <div className="space-y-3">
                      {/* Permissão Principal */}
                      <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        form.permissoes.includes('clientes')
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={form.permissoes.includes('clientes')}
                          onChange={() => handlePermissaoChange('clientes')}
                          className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900">
                              {PERMISSOES_CASCATA.contatos.label}
                            </span>
                            <span className="text-xs text-green-600 font-medium">(Principal)</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {PERMISSOES_CASCATA.contatos.description}
                          </p>
                        </div>
                      </label>
                      
                      {/* Sub-permissões */}
                      {form.permissoes.includes('clientes') && (
                        <div className="ml-8 space-y-2">
                          {PERMISSOES_CASCATA.contatos.subPermissoes.map((subPermissao) => {
                            const IconComponent = subPermissao.icon;
                            const isChecked = form.permissoes.includes(subPermissao.key);
                            
                            return (
                              <label 
                                key={subPermissao.key} 
                                className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 ${
                                  isChecked 
                                    ? 'border-green-400 bg-green-25' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissaoChange(subPermissao.key)}
                                  className="mt-1 w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IconComponent className="w-3 h-3 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {subPermissao.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {subPermissao.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Módulo Produtos com Sub-permissões */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Módulo Produtos/Serviços</h4>
                    <div className="space-y-3">
                      {/* Permissão Principal */}
                      <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        form.permissoes.includes('equipamentos')
                          ? 'border-purple-600 bg-purple-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={form.permissoes.includes('equipamentos')}
                          onChange={() => handlePermissaoChange('equipamentos')}
                          className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Database className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-gray-900">
                              {PERMISSOES_CASCATA.produtos.label}
                            </span>
                            <span className="text-xs text-purple-600 font-medium">(Principal)</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {PERMISSOES_CASCATA.produtos.description}
                          </p>
                        </div>
                      </label>
                      
                      {/* Sub-permissões */}
                      {form.permissoes.includes('equipamentos') && (
                        <div className="ml-8 space-y-2">
                          {PERMISSOES_CASCATA.produtos.subPermissoes.map((subPermissao) => {
                            const IconComponent = subPermissao.icon;
                            const isChecked = form.permissoes.includes(subPermissao.key);
                            
                            return (
                              <label 
                                key={subPermissao.key} 
                                className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 ${
                                  isChecked 
                                    ? 'border-purple-400 bg-purple-25' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissaoChange(subPermissao.key)}
                                  className="mt-1 w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IconComponent className="w-3 h-3 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {subPermissao.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {subPermissao.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Módulos Avançados */}
            <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Módulos Avançados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PERMISSOES_CASCATA.avancadas.map((permissao) => {
                        const IconComponent = permissao.icon;
                        const isChecked = form.permissoes.includes(permissao.key);
                        
                        return (
                          <label 
                            key={permissao.key} 
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isChecked 
                                ? 'border-gray-900 bg-gray-50' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                    <input
                      type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissaoChange(permissao.key)}
                              className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {permissao.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {permissao.description}
                              </p>
                            </div>
                  </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Sistema de Permissões em Cascata
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        <strong>Módulos Principais:</strong> Permissões independentes que funcionam isoladamente.<br/>
                        <strong>Módulos com Sub-permissões:</strong> Ao marcar a permissão principal, as sub-permissões são automaticamente incluídas.<br/>
                        <strong>Exemplo:</strong> Marcar "Financeiro" automaticamente inclui "Vendas", "Movimentações Caixa" e "Contas a Pagar".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Cancelar
                </button>
                <button
                type="submit"
                  disabled={saving || !emailValido || !usuarioValido}
                  className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
            </div>
          </form>
          </CardContent>
        </Card>
      </main>
    </MenuLayout>
  );
}

export default function EditarUsuarioPage() {
  return <EditarUsuarioPageInner />;
} 