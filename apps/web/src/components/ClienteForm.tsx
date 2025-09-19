'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiUserPlus } from "react-icons/fi";
import Cleave from 'cleave.js/react';
import axios from 'axios';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import Lottie from 'lottie-react';
import checkmarkAnimation from '@/assets/animations/checkmark.json';
import errorAnimation from '@/assets/animations/error.json';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { useSubscription } from '@/hooks/useSubscription';
import { FiAlertTriangle } from 'react-icons/fi';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  celular: string;
  email: string;
  documento: string;
  tipo: string;
  observacoes: string;
  responsavel: string;
  senha: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  origem: string;
  aniversario: string;
  status?: string;
  numero_cliente?: string;
}

export default function ClienteForm({ cliente, returnToOS }: { cliente?: Cliente; returnToOS?: boolean }) {
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        email: '',
        documento: '',
        tipo: 'pf',
        observacoes: '',
        responsavel: '',
        senha: '',
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        origem: '',
        aniversario: '',
        status: 'ativo', // <-- adicionado aqui
      });
    const [novoClienteId, setNovoClienteId] = useState<string | null>(null);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { carregarLimites, limites, podeCriar, assinatura, isTrialExpired } = useSubscription();

  // Verificar se está no trial e não pode criar clientes
  const isTrial = assinatura?.status === 'trial' && !isTrialExpired();
  const cannotCreateClients = isTrial && limites && !podeCriar('clientes');

  const isDocumentoValido = () => {
    if (!form.documento) return null;
    return form.tipo === 'pf'
      ? cpf.isValid(form.documento)
      : cnpj.isValid(form.documento);
  };

  useEffect(() => {
    if (cliente) {
        setForm({ ...cliente, status: cliente.status ?? 'ativo' });
      }
  }, [cliente]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'cep') {
      // Remove máscara para checar apenas números
      const valorCep = e.target.value.replace(/\D/g, '');
      if (valorCep.length === 8) {
        try {
          const response = await axios.get(`https://viacep.com.br/ws/${valorCep}/json/`);
          const data = response.data;
          if (!data.erro) {
            setForm(prev => ({
              ...prev,
              rua: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            }));
          }
        } catch (error) {
          // ignore error
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    // Busca o empresa_id do usuário logado
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', userData?.user?.id)
      .single();

    if (usuarioError || !usuarioData?.empresa_id) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      alert("Empresa ID não encontrado para este usuário.");
      setLoading(false);
      return;
    }

    const empresaId = usuarioData.empresa_id;

    // Remover obrigatoriedade do campo documento
    // if (!form.documento) {
    //   alert("O campo Documento é obrigatório.");
    //   setLoading(false);
    //   return;
    // }

    if (form.documento) {
      if (form.tipo === 'pf' && !cpf.isValid(form.documento)) {
        alert("CPF inválido!");
        setLoading(false);
        return;
      }
      if (form.tipo === 'pj' && !cnpj.isValid(form.documento)) {
        alert("CNPJ inválido!");
        setLoading(false);
        return;
      }
    }

    // Buscar o maior numero_cliente atual para a empresa e calcular o próximo, preservando ao editar
    let numeroCliente = cliente?.numero_cliente;
    if (!numeroCliente) {
      const { data: maxResult } = await supabase
        .from('clientes')
        .select('numero_cliente')
        .eq('empresa_id', empresaId)
        .order('numero_cliente', { ascending: false })
        .limit(1)
        .single();

      numeroCliente = maxResult?.numero_cliente ? maxResult.numero_cliente + 1 : 1;
    }

    const clientePayload = {
      empresa_id: empresaId,
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      documento: form.documento,
      tipo: form.tipo,
      observacoes: form.observacoes,
      responsavel: form.responsavel,
      senha: form.senha,
      cep: form.cep,
      rua: form.rua,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,
      origem: form.origem,
      aniversario: form.aniversario && form.aniversario.trim() !== '' ? form.aniversario : null,
      cpf: form.documento,
      endereco: `${form.rua}, ${form.numero}, ${form.bairro}, ${form.cidade} - ${form.estado}`,
      data_cadastro: new Date().toISOString(),
      numero_cliente: numeroCliente,
      status: form.status,
      cadastrado_por: userData?.user?.user_metadata?.nome?.split(' ')[0] || userData?.user?.email || 'Desconhecido',
    };

    if (cliente && cliente.id) {
      const { error } = await supabase
        .from('clientes')
        .update(clientePayload)
        .eq('id', cliente.id);

      if (error) {
        setShowError(true);
        setTimeout(() => setShowError(false), 2000);
        console.error('Erro ao atualizar cliente:', error);
        alert('Erro ao atualizar cliente: ' + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .insert(clientePayload)
        .select();

      if (error) {
        setShowError(true);
        setTimeout(() => setShowError(false), 2000);
        console.error('Erro ao inserir cliente:', error);
        alert('Erro ao cadastrar cliente: ' + error.message);
        setLoading(false);
        return;
      }

      const novoId = data?.[0]?.id;
      setNovoClienteId(novoId || null);
      
      // Recarregar limites após criar cliente
      carregarLimites();
      
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (returnToOS && novoId) {
          // Retorna para a OS com o cliente selecionado
          router.push('/nova-os?clienteId=' + novoId);
        } else {
          router.push('/clientes');
        }
      }, 1500);
      return; // Retorna aqui para evitar execução dupla
    }

    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      if (returnToOS) {
        // Retorna para a OS com o cliente selecionado (caso de edição)
        router.push('/nova-os?clienteId=' + cliente?.id);
      } else {
        router.push('/clientes');
      }
    }, 1500);
  };

  return (
    <>
      {showSuccess && (
        <div className="flex justify-center my-6">
          <Lottie 
            animationData={checkmarkAnimation} 
            loop={false} 
            style={{ width: 120, height: 120 }}
          />
        </div>
      )}

      {showError && (
        <div className="flex justify-center my-6">
          <Lottie 
            animationData={errorAnimation} 
            loop={false} 
            style={{ width: 120, height: 120 }}
          />
        </div>
      )}

      {/* Aviso quando limite for atingido */}
      {cannotCreateClients && (
        <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-700 font-medium text-sm">
              Limite de clientes atingido
            </span>
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Para criar mais clientes, escolha um plano adequado às suas necessidades.
          </p>
          <button 
            onClick={() => window.location.href = '/planos'}
            className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            Ver planos disponíveis
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-8 ${cannotCreateClients ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <Button type="button" onClick={() => router.back()} variant="secondary">
            <FiArrowLeft size={20} />
            Voltar
          </Button>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FiUserPlus size={24} />
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
        </div>

        <section>
        <div className="mb-4 flex items-center gap-4">
          <span className="block text-sm font-medium text-gray-700">Status:</span>
          <button
            type="button"
            onClick={() =>
              setForm(prev => ({
                ...prev,
                status: prev.status === 'ativo' ? 'inativo' : 'ativo'
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.status === 'ativo' ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.status === 'ativo' ? 'translate-x-6' : 'translate-x-1'
              }`}
            /> 
          </button>
          <span className="text-sm text-gray-600">
            {form.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
          <h3 className="mb-4 text-base font-semibold text-gray-700">Informações Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome"
              required
            />
            <div className="relative">
              <Cleave
                options={{
                  delimiters: form.tipo === 'pf' ? ['.', '.', '-'] : ['.', '.', '/', '-'],
                  blocks: form.tipo === 'pf' ? [3, 3, 3, 2] : [2, 3, 3, 4, 2],
                  numericOnly: true
                }}
                value={form.documento}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, documento: e.target.value })}
                placeholder="CPF/CNPJ"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isDocumentoValido() === true && (
                <Lottie 
                  animationData={checkmarkAnimation} 
                  loop={false}
                  style={{ width: 32, height: 32 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
              )}
              {isDocumentoValido() === false && (
                <Lottie 
                  animationData={errorAnimation} 
                  loop={false}
                  style={{ width: 32, height: 32 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
              )}
            </div>
            <Select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
            >
              <option value="pf">Pessoa Física</option>
              <option value="pj">Pessoa Jurídica</option>
            </Select>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
            />
            <Input
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="Telefone"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold text-gray-700">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Cleave
                options={{
                  delimiters: ['-'],
                  blocks: [5, 3],
                  numericOnly: true
                }}
                value={form.cep}
                onChange={handleChange}
                placeholder="CEP"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Input
              type="text"
              name="rua"
              value={form.rua}
              onChange={handleChange}
              placeholder="Rua"
            />
            <Input
              type="text"
              name="numero"
              value={form.numero}
              onChange={handleChange}
              placeholder="Número"
            />
            <Input
              type="text"
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
              placeholder="Complemento"
            />
            <Input
              type="text"
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              placeholder="Bairro"
            />
            <Input
              type="text"
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              placeholder="Cidade"
            />
            <Input
              type="text"
              name="estado"
              value={form.estado}
              onChange={handleChange}
              placeholder="Estado"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold text-gray-700">Detalhes Extras</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              name="responsavel"
              value={form.responsavel}
              onChange={handleChange}
              placeholder="Responsável"
            />
            <Input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              placeholder="Senha"
            />
            <Input
              type="date"
              name="aniversario"
              value={form.aniversario}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Input
              type="text"
              name="origem"
              value={form.origem}
              onChange={handleChange}
              placeholder="Origem"
            />
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              placeholder="Observações"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="secondary"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={loading}
          >
            {loading ? (cliente ? "Atualizando..." : "Salvando...") : (cliente ? "Atualizar" : "Salvar")}
          </Button>
        </div>
      </form>
    </>
  );
}