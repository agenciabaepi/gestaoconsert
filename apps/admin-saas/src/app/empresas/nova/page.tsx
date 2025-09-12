'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cliente com chave anônima para autenticação
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface EmpresaForm {
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  website: string;
  plano: string;
  maxusuarios: number;
  adminEmail: string;
  adminNome: string;
  adminSenha: string;
}

export default function NovaEmpresaPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<EmpresaForm>({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    website: '',
    plano: 'basico',
    maxusuarios: 2,
    adminEmail: '',
    adminNome: '',
    adminSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (field: keyof EmpresaForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlanoChange = (plano: string) => {
    const maxUsuarios = {
      'basico': 2,
      'pro': 5,
      'premium': 10
    };
    
    setForm(prev => ({
      ...prev,
      plano,
      maxusuarios: maxUsuarios[plano as keyof typeof maxUsuarios] || 2
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🔄 Cadastrando nova empresa...', form);

      // Validar campos obrigatórios
      if (!form.nome || !form.email) {
        setError('Nome e email da empresa são obrigatórios');
        return;
      }

      if (!form.adminEmail || !form.adminNome || !form.adminSenha) {
        setError('Dados do administrador são obrigatórios');
        return;
      }

      // 1. Criar usuário admin no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.adminEmail,
        password: form.adminSenha,
        options: {
          data: {
            nome: form.adminNome,
            empresa: form.nome
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        setError(`Erro ao criar usuário: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar usuário no sistema de autenticação');
        return;
      }

      console.log('✅ Usuário criado no Auth:', authData.user);

      // 2. Criar empresa usando service role (contorna RLS)
      const { data: empresa, error: empresaError } = await supabaseAdmin
        .from('empresas')
        .insert({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cnpj: form.cnpj,
          endereco: form.endereco,
          cidade: form.cidade,
          website: form.website,
          plano: form.plano,
          maxusuarios: form.maxusuarios
        })
        .select()
        .single();

      if (empresaError) {
        console.error('Erro ao criar empresa:', empresaError);
        setError(`Erro ao criar empresa: ${empresaError.message}`);
        return;
      }

      console.log('✅ Empresa criada:', empresa);

      // 3. Criar usuário na tabela usuarios usando service role
      const { error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          auth_user_id: authData.user.id,
          nome: form.adminNome,
          email: form.adminEmail,
          nivel: 'admin',
          empresa_id: empresa.id,
          tipo: 'principal'
        });

      if (usuarioError) {
        console.error('Erro ao criar usuário na tabela:', usuarioError);
        setError(`Erro ao criar usuário na tabela: ${usuarioError.message}`);
        return;
      }

      console.log('✅ Usuário criado na tabela usuarios');
      setSuccess(true);
      
      // Limpar formulário após sucesso
      setTimeout(() => {
        setForm({
          nome: '',
          email: '',
          telefone: '',
          cnpj: '',
          endereco: '',
          cidade: '',
          website: '',
          plano: 'basico',
          maxusuarios: 2,
          adminEmail: '',
          adminNome: '',
          adminSenha: ''
        });
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Erro geral:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/empresas" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </a>
              <h1 className="text-xl font-semibold text-gray-900">
                Nova Empresa
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Cadastrar Nova Empresa
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Preencha os dados da empresa para cadastrá-la no sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
                         {/* Success Message */}
             {success && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="flex items-center mb-2">
                   <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                   <span className="text-green-800 font-medium">
                     Empresa cadastrada com sucesso!
                   </span>
                 </div>
                 <div className="text-sm text-green-700">
                   <p><strong>Credenciais do Administrador:</strong></p>
                   <p>Email: {form.adminEmail}</p>
                   <p>Senha: {form.adminSenha}</p>
                   <p className="mt-2 text-xs">
                     Guarde essas credenciais para acesso ao sistema da empresa.
                   </p>
                 </div>
               </div>
             )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Dados Básicos */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={form.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
            </div>

                         {/* Plano */}
             <div>
               <h3 className="text-md font-medium text-gray-900 mb-4">Plano</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                   <input
                     type="radio"
                     name="plano"
                     value="basico"
                     checked={form.plano === 'basico'}
                     onChange={(e) => handlePlanoChange(e.target.value)}
                     className="sr-only"
                   />
                   <div className="text-center">
                     <h4 className="font-medium text-gray-900">Básico</h4>
                     <p className="text-sm text-gray-600">Até {form.maxusuarios} usuários</p>
                     <p className="text-xs text-gray-500 mt-1">Funcionalidades essenciais</p>
                   </div>
                 </div>

                 <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                   <input
                     type="radio"
                     name="plano"
                     value="pro"
                     checked={form.plano === 'pro'}
                     onChange={(e) => handlePlanoChange(e.target.value)}
                     className="sr-only"
                   />
                   <div className="text-center">
                     <h4 className="font-medium text-gray-900">Pro</h4>
                     <p className="text-sm text-gray-600">Até {form.maxusuarios} usuários</p>
                     <p className="text-xs text-gray-500 mt-1">Funcionalidades avançadas</p>
                   </div>
                 </div>

                 <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                   <input
                     type="radio"
                     name="plano"
                     value="premium"
                     checked={form.plano === 'premium'}
                     onChange={(e) => handlePlanoChange(e.target.value)}
                     className="sr-only"
                   />
                   <div className="text-center">
                     <h4 className="font-medium text-gray-900">Premium</h4>
                     <p className="text-sm text-gray-600">Até {form.maxusuarios} usuários</p>
                     <p className="text-xs text-gray-500 mt-1">Todas as funcionalidades</p>
                   </div>
                 </div>
               </div>
             </div>

             {/* Administrador */}
             <div>
               <h3 className="text-md font-medium text-gray-900 mb-4">Administrador da Empresa</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Nome do Administrador *
                   </label>
                   <input
                     type="text"
                     required
                     value={form.adminNome}
                     onChange={(e) => handleInputChange('adminNome', e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Nome completo"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Email do Administrador *
                   </label>
                   <input
                     type="email"
                     required
                     value={form.adminEmail}
                     onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="admin@empresa.com"
                   />
                 </div>

                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Senha do Administrador *
                   </label>
                   <input
                     type="password"
                     required
                     value={form.adminSenha}
                     onChange={(e) => handleInputChange('adminSenha', e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Senha de acesso"
                     minLength={6}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     Mínimo 6 caracteres
                   </p>
                 </div>
               </div>
             </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <a
                href="/empresas"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{loading ? 'Cadastrando...' : 'Cadastrar Empresa'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 