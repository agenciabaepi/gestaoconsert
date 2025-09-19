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
  FaMapMarkerAlt,
  FaGlobe,
  FaCheckCircle
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
      const planoFromUrl = searchParams?.get('plano') || 'unico';
      // Força modelo de preço único
      setForm(prev => ({ ...prev, plano: 'unico' }));
    } catch (error) {
      console.log('Erro ao obter parâmetros da URL:', error);
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
      toast.error("Confirme sua senha.");
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
      } catch (e) {
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
      
      toast.success('Cadastro realizado com sucesso!');
      
      // Aguarda um pouco antes de redirecionar
      setTimeout(() => {
        router.push('/cadastro/sucesso');
      }, 3000);
      
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
          <Image src={logo} alt="" width={200} height={60} priority className="mx-auto" />
        </div>
        <p className="text-center text-[#D1FE6E]/80 font-medium text-sm mb-4">
          Experimente gratuitamente por 15 dias. Sem cartão de crédito!
        </p>
        <div className="w-full max-w-7xl mx-auto p-8 rounded-3xl overflow-visible min-h-[760px] border" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)'
        }}>
          <h1 className="text-4xl font-semibold tracking-tight text-white text-center mb-4">Crie sua conta</h1>
          <div className="relative mb-6 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#D1FE6E] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="h-auto min-h-[560px] overflow-visible relative transition-all">
            {step === 1 && (
              <div key={`step1-${step}`} className="w-full gap-3 flex flex-col transition-opacity duration-200">
                <h2 className="text-xl font-light text-white mb-4">Seus dados</h2>
                
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
                <label className={`text-sm ${senhasIguais ? 'text-white/70' : 'text-red-400'}`}>{senhasIguais ? 'Repita sua senha para confirmar. *' : 'As senhas não coincidem.'}</label>
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
                  <button onClick={handleNext} className="px-6 py-3 rounded-lg transition font-medium bg-[#D1FE6E] text-black hover:bg-[#B8E55A]">Continuar</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                key={`step2-${step}`}
                className="w-full gap-3 flex flex-col transition-opacity duration-200"
              >
                <h2 className="text-xl font-light text-white mb-4">Dados da Empresa</h2>
                
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
                    className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/15 transition"
                  >
                    Voltar
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
                    className={`px-6 py-3 rounded-lg transition font-medium ${
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
                    Finalizar Cadastro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <footer className="text-xs text-gray-400 text-center mt-8">
          © 2025 ConsertOS. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}