'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import logo from '@/assets/imagens/logobranco.png';
import Image from 'next/image';
import {
  FaUser,
  FaEye,
  FaEyeSlash,
  FaBuilding,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft
} from 'react-icons/fa';
import { mask as masker } from 'remask';

export default function CadastroEmpresa() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
    plano: 'unico', // Valor padrão
    cpf: '',
    // Campos da empresa
    nomeEmpresa: '',
    cidade: '',
    endereco: '',
    website: '',
    cnpj: ''
  });

  // Inicializa o plano da URL de forma segura
  useEffect(() => {
    try {
      // Força modelo de preço único
      setForm(prev => ({ ...prev, plano: 'unico' }));
    } catch (error) {
      }
  }, [searchParams]);

  const [emailValido, setEmailValido] = useState(true);
  const [senhasIguais, setSenhasIguais] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const progress = (step / 2) * 100; // Agora são 2 passos

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function verificarEmail(email: string) {
    const res = await fetch('/api/verificar/email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    return result.exists;
  }

  async function verificarCPF(cpf: string) {
    const res = await fetch('/api/verificar/cpf', {
      method: 'POST',
      body: JSON.stringify({ cpf }),
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    return result.exists;
  }

  async function verificarCNPJ(cnpj: string) {
    const res = await fetch('/api/verificar/cnpj', {
      method: 'POST',
      body: JSON.stringify({ cnpj }),
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    return result.exists;
  }

  React.useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValido(emailRegex.test(form.email));
    setSenhasIguais(form.senha === form.confirmarSenha);
  }, [form.email, form.senha, form.confirmarSenha]);

  // Verificação de email já existente
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (form.email && form.email.length > 5) {
        const exists = await verificarEmail(form.email);
        setEmailError(exists ? 'Este e-mail já está em uso.' : '');
      } else {
        setEmailError('');
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [form.email]);

  // Verificação de CPF já existente com debounce
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const raw = form.cpf.replace(/\D/g, '');
      if (raw.length === 11) {
        const exists = await verificarCPF(raw);
        setCpfError(exists ? 'Este CPF já está em uso.' : '');
      } else {
        setCpfError('');
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [form.cpf]);

  // Verificação de CNPJ já existente com debounce
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const raw = form.cnpj.replace(/\D/g, '');
      if (raw.length === 14) {
        const exists = await verificarCNPJ(raw);
        setCnpjError(exists ? 'Este CNPJ já está em uso.' : '');
      } else {
        setCnpjError('');
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [form.cnpj]);

  const validarFormulario = () => {
    // Verificar campos obrigatórios
    if (!form.nome?.trim()) {
      toast.error("Preencha seu nome completo.");
      return false;
    }
    if (!form.email?.trim()) {
      toast.error("Preencha seu e-mail.");
      return false;
    }
    if (!form.senha?.trim()) {
      toast.error("Crie uma senha.");
      return false;
    }
    if (!form.confirmarSenha?.trim()) {
      toast.error("Confirme sua senha digitada.");
      return false;
    }
    if (!form.whatsapp?.trim()) {
      toast.error("Preencha seu WhatsApp.");
      return false;
    }
    if (!form.cpf?.trim()) {
      toast.error("Preencha seu CPF.");
      return false;
    }
    if (!form.nomeEmpresa?.trim()) {
      toast.error("Preencha o nome da empresa.");
      return false;
    }
    if (!form.cidade?.trim()) {
      toast.error("Preencha a cidade.");
      return false;
    }
    if (!form.endereco?.trim()) {
      toast.error("Preencha o endereço.");
      return false;
    }
    
    // Verificar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Informe um e-mail válido.");
      return false;
    }
    
    // Verificar tamanho da senha
    if (form.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }
    
    // Verificar se as senhas coincidem
    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return false;
    }
    
    // Verificar se há erros de validação
    if (emailError || cpfError || cnpjError) {
      toast.error("Corrija os erros de validação antes de continuar.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validarFormulario()) return;
    
    // Remove máscaras antes de enviar
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    
    // Prepara o corpo da requisição
    const payload = {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      nomeEmpresa: form.nomeEmpresa,
      whatsapp: form.whatsapp,
      plano: form.plano,
      cpf: cpfLimpo,
      cnpj: cnpjLimpo,
      cidade: form.cidade,
      endereco: form.endereco,
      website: form.website,
    };
    
    try {
      const res = await fetch('/api/empresa/criar', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      
      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        console.error('Resposta não é um JSON válido:', text);
        toast.error('Erro inesperado no servidor.');
        return;
      }
      
      if (!res.ok) {
        if (result.error?.toLowerCase().includes('e-mail já cadastrado')) {
          setEmailError('Este e-mail já está em uso.');
          toast.error('Este e-mail já está em uso.');
        } else if (result.error?.toLowerCase().includes('cpf já cadastrado')) {
          setCpfError('Este CPF já está em uso.');
          toast.error('Este CPF já está em uso.');
        } else if (result.error?.toLowerCase().includes('cnpj já cadastrado')) {
          setCnpjError('Este CNPJ já está em uso.');
          toast.error('Este CNPJ já está em uso.');
        } else {
          toast.error(`Erro ao cadastrar: ${result.error || 'Tente novamente.'}`);
        }
        return;
      }
      
      toast.success(result.message || 'Cadastro realizado com sucesso!');
      
      // Aguarda um pouco antes de redirecionar para instruções de verificação
      setTimeout(() => {
        router.push(`/instrucoes-verificacao?email=${encodeURIComponent(form.email)}`);
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Erro no try/catch:', error);
      toast.error('Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 bg-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `linear-gradient(rgba(209,254,110,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(209,254,110,0.08) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/60" />
      </div>
      <div className="relative z-20 w-full max-w-4xl space-y-6">
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => router.push('/')}
            className="transition-all duration-300 hover:scale-105 hover:brightness-110"
          >
            <Image src={logo} alt="" width={200} height={60} priority className="mx-auto" />
          </button>
        </div>
        <p className="text-center text-[#D1FE6E]/80 font-medium text-sm mb-4">
          Experimente gratuitamente por 15 dias. Sem cartão de crédito!
        </p>
        
        {/* Indicador de Etapas */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 ${
              step === 1 
                ? 'bg-[#D1FE6E]/10 border border-[#D1FE6E]/20 text-[#D1FE6E]' 
                : 'text-white/60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 
                  ? 'bg-[#D1FE6E] text-black' 
                  : 'bg-white/20 text-white/60'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Dados Pessoais</span>
              {step === 1 && <FaUser className="text-[#D1FE6E] ml-1" />}
            </div>
            
            <div className="w-8 h-px bg-white/20"></div>
            
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 ${
              step === 2 
                ? 'bg-[#D1FE6E]/10 border border-[#D1FE6E]/20 text-[#D1FE6E]' 
                : 'text-white/60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 
                  ? 'bg-[#D1FE6E] text-black' 
                  : 'bg-white/20 text-white/60'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Dados da Empresa</span>
              {step === 2 && <FaBuilding className="text-[#D1FE6E] ml-1" />}
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto p-8 rounded-3xl overflow-visible min-h-[760px] border" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)'
        }}>
          <h1 className="text-4xl font-semibold tracking-tight text-white text-center mb-4">Crie sua conta</h1>
          
          {/* Barra de Progresso */}
          <div className="relative mb-8">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>Etapa {step} de 2</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D1FE6E] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="h-auto min-h-[560px] overflow-visible relative transition-all">
            {step === 1 && (
              <div key={`step1-${step}`} className="w-full gap-3 flex flex-col transition-opacity duration-200">
                {/* Header da Etapa 1 */}
                <div className="text-center mb-6 p-4 rounded-2xl bg-[#D1FE6E]/5 border border-[#D1FE6E]/20">
                  <h2 className="text-2xl font-semibold text-white mb-2 flex items-center justify-center">
                    <FaUser className="text-[#D1FE6E] mr-3" />
                    Etapa 1: Seus Dados Pessoais
                  </h2>
                  <p className="text-[#D1FE6E]/80 text-sm">Preencha suas informações pessoais para criar sua conta</p>
                </div>
                
                <label className="text-sm text-white/70">Nome completo *</label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.nome}
                  onChange={handleChange}
                />
                
                <label className={`text-sm ${(!emailValido || emailError) ? 'text-red-400' : 'text-white/70'}`}>{emailError || 'Informe um e-mail válido. *'}</label>
                <input
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  className={`w-full px-4 py-3 rounded-md border ${(!emailValido || emailError) ? 'border-red-400' : 'border-white/10'} bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition`}
                  value={form.email}
                  onChange={handleChange}
                />
                <label className="text-sm text-white/70">Crie uma senha segura. *</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    name="senha"
                    placeholder="Senha"
                    className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition pr-10"
                    value={form.senha}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center cursor-pointer" onClick={() => setMostrarSenha(!mostrarSenha)}>
                    {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
                <label className={`text-sm ${senhasIguais ? 'text-white/70' : 'text-red-400'}`}>{senhasIguais ? 'Repita sua senha para confirmar' : 'As senhas não coincidem.'}</label>
                <div className="relative">
                  <input
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    name="confirmarSenha"
                    placeholder="Confirmar senha"
                    className={`w-full px-4 py-3 rounded-md border ${senhasIguais ? 'border-white/10' : 'border-red-400'} bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition pr-10`}
                    value={form.confirmarSenha || ''}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center cursor-pointer" onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
                    {mostrarConfirmarSenha ? <FaEyeSlash /> : <FaEye />}
                </div>
                </div>
                <label className={`text-sm ${cpfError ? 'text-red-400' : 'text-white/70'}`}>{cpfError || 'Informe seu CPF (somente números). *'}</label>
                <input
                  type="text"
                  name="cpf"
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-3 rounded-md border ${cpfError ? 'border-red-400' : 'border-white/10'} bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition`}
                  value={form.cpf}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, cpf: masker(raw, ['999.999.999-99']) });
                  }}
                  maxLength={14}
                  autoComplete="off"
                />
                <label className="text-sm text-white/70">WhatsApp *</label>
                <input
                  type="text"
                  name="whatsapp"
                  placeholder="(99) 99999-9999"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.whatsapp}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, whatsapp: masker(raw, ['(99) 99999-9999']) });
                  }}
                  maxLength={15}
                  autoComplete="off"
                />
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={handleNext} 
                    className="px-6 py-3 rounded-lg transition font-medium bg-[#D1FE6E] text-black hover:bg-[#B8E55A] flex items-center space-x-2"
                  >
                    <span>Próxima Etapa</span>
                    <FaArrowRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                key={`step2-${step}`}
                className="w-full gap-3 flex flex-col transition-opacity duration-200"
              >
                {/* Header da Etapa 2 */}
                <div className="text-center mb-6 p-4 rounded-2xl bg-[#D1FE6E]/5 border border-[#D1FE6E]/20">
                  <h2 className="text-2xl font-semibold text-white mb-2 flex items-center justify-center">
                    <FaBuilding className="text-[#D1FE6E] mr-3" />
                    Etapa 2: Dados da Empresa
                  </h2>
                  <p className="text-[#D1FE6E]/80 text-sm">Agora preencha as informações da sua empresa</p>
                </div>
                
                <label className="text-sm text-white/70">Nome da empresa *</label>
                <input
                  type="text"
                  name="nomeEmpresa"
                  placeholder="Nome da sua empresa"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.nomeEmpresa}
                  onChange={handleChange}
                />

                <label className="text-sm text-white/70">CNPJ (opcional)</label>
                <input
                  type="text"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  className={`w-full px-4 py-3 rounded-md border ${cnpjError ? 'border-red-400' : 'border-white/10'} bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition`}
                  value={form.cnpj}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, cnpj: masker(raw, ['99.999.999/9999-99']) });
                  }}
                  maxLength={18}
                  autoComplete="off"
                />
                {cnpjError && <span className="text-red-400 text-xs">{cnpjError}</span>}

                <label className="text-sm text-white/70">Cidade *</label>
                <input
                  type="text"
                  name="cidade"
                  placeholder="Cidade"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.cidade}
                  onChange={handleChange}
                />

                <label className="text-sm text-white/70">Endereço *</label>
                <input
                  type="text"
                  name="endereco"
                  placeholder="Endereço completo"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.endereco}
                  onChange={handleChange}
                />

                <label className="text-sm text-white/70">Website (opcional)</label>
                <input
                  type="text"
                  name="website"
                  placeholder="www.suaempresa.com.br"
                  className="w-full px-4 py-3 rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#D1FE6E]/40 transition"
                  value={form.website}
                  onChange={handleChange}
                />

                {/* Dados do responsável removidos aqui; já coletados no passo 1 */}
                {/* Exibição de erro de submissão */}
                {submitError && (
                  <p className="text-red-500 text-sm mb-4">{submitError}</p>
                )}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/15 transition flex items-center space-x-2"
                  >
                    <FaArrowLeft className="text-sm" />
                    <span>Voltar</span>
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={
                      !form.nome?.trim() ||
                      !form.email?.trim() ||
                      !form.senha?.trim() ||
                      !form.confirmarSenha?.trim() ||
                      emailError !== '' ||
                      form.senha !== form.confirmarSenha ||
                      !form.whatsapp?.trim() ||
                      !form.cpf?.trim() ||
                      cpfError !== '' ||
                      cnpjError !== '' ||
                      !form.nomeEmpresa?.trim() ||
                      !form.cidade?.trim() ||
                      !form.endereco?.trim()
                    }
                    className={`px-6 py-3 rounded-lg transition font-medium flex items-center space-x-2 ${
                      !form.nome?.trim() ||
                      !form.email?.trim() ||
                      !form.senha?.trim() ||
                      !form.confirmarSenha?.trim() ||
                      emailError !== '' ||
                      form.senha !== form.confirmarSenha ||
                      !form.whatsapp?.trim() ||
                      !form.cpf?.trim() ||
                      cpfError !== '' ||
                      cnpjError !== '' ||
                      !form.nomeEmpresa?.trim() ||
                      !form.cidade?.trim() ||
                      !form.endereco?.trim()
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : 'bg-[#D1FE6E] text-black hover:bg-[#B8E55A]'
                    }`}
                  >
                    <span>Finalizar Cadastro</span>
                    <FaCheckCircle className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="relative z-10 w-full mt-16 border-t border-white/10 bg-gradient-to-b from-transparent to-black/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-8 py-12">
          {/* Grid de 4 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Coluna 1 - Logo e Descrição */}
            <div className="flex flex-col items-center md:items-start">
              <button 
                onClick={() => router.push('/')}
                className="transition-all duration-300 hover:scale-105 hover:brightness-110 mb-6"
              >
                <Image 
                  src={logo} 
                  alt="CONSERT Logo" 
                  width={140} 
                  height={140}
                />
              </button>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs text-center md:text-left">
                Sistema completo para gestão de assistências técnicas. Simplifique processos, aumente a produtividade e encante seus clientes.
              </p>
            </div>
            
            {/* Coluna 2 - Produto */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-white font-semibold mb-4 text-center md:text-left">Produto</h3>
              <div className="space-y-3 text-center md:text-left">
                <a href="/planos" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Planos</a>
                <a href="/funcionalidades" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Funcionalidades</a>
                <a href="/precos" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Preços</a>
                <a href="/demo" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Demonstração</a>
              </div>
            </div>
            
            {/* Coluna 3 - Suporte */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-white font-semibold mb-4 text-center md:text-left">Suporte</h3>
              <div className="space-y-3 text-center md:text-left">
                <a href="/ajuda" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Central de Ajuda</a>
                <a href="/contato" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Contato</a>
                <a href="/documentacao" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Documentação</a>
                <a href="/status" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Status do Sistema</a>
              </div>
            </div>
            
            {/* Coluna 4 - Empresa */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-white font-semibold mb-4 text-center md:text-left">Empresa</h3>
              <div className="space-y-3 text-center md:text-left">
                <a href="/sobre" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Sobre Nós</a>
                <a href="/blog" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Blog</a>
                <a href="/carreiras" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Carreiras</a>
                <a href="/imprensa" className="block text-white/60 hover:text-[#D1FE6E] transition-colors text-sm">Imprensa</a>
              </div>
            </div>
          </div>
          
          {/* Linha de separação */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Copyright */}
              <div className="text-white/60 text-sm">
                © 2025 ConsertOS. Todos os direitos reservados.
              </div>
              
              {/* Links legais */}
              <div className="flex space-x-6 text-sm">
                <a href="/privacidade" className="text-white/60 hover:text-[#D1FE6E] transition-colors">Privacidade</a>
                <a href="/termos" className="text-white/60 hover:text-[#D1FE6E] transition-colors">Termos de Uso</a>
                <a href="/cookies" className="text-white/60 hover:text-[#D1FE6E] transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Teste site funcionando após limpeza de disco
