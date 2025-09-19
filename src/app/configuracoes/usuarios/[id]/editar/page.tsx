'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import MenuLayout from '@/components/MenuLayout';
import { useToast } from '@/components/Toast';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/Button';

const AREAS_SISTEMA = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'ordens', label: 'Ordens de Serviço' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'bancada', label: 'Bancada' },
  { key: 'caixa', label: 'Caixa/PDV' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'configuracoes', label: 'Configurações' },
  { key: 'lembretes', label: 'Lembretes' },
];

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    usuario: '',
    senha: '',
    telefone: '',
    cpf: '',
    whatsapp: '',
    nivel: '',
    permissoes: [] as string[],
    auth_user_id: '',
  });

  useEffect(() => {
    const fetchUsuario = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, email, usuario, telefone, cpf, whatsapp, nivel, permissoes, auth_user_id')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) {
        addToast('error', 'Erro ao carregar usuário');
        setLoading(false);
        return;
      }
      setForm({
        nome: data.nome || '',
        email: data.email || '',
        usuario: data.usuario || '',
        senha: '',
        telefone: data.telefone || '',
        cpf: data.cpf || '',
        whatsapp: data.whatsapp || '',
        nivel: data.nivel || '',
        permissoes: data.permissoes || [],
        auth_user_id: data.auth_user_id || '',
      });
      setLoading(false);
    };
    if (userId) fetchUsuario();
  }, [userId, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Preencher permissões padrão ao trocar nível
    if (name === 'nivel') {
      let permissoesPadrao: string[] = [];
      if (value === 'tecnico') {
        permissoesPadrao = ['ordens', 'clientes', 'bancada'];
      } else if (value === 'financeiro') {
        permissoesPadrao = ['dashboard', 'lembretes', 'clientes', 'ordens', 'equipamentos', 'financeiro', 'vendas'];
      } else if (value === 'atendente') {
        permissoesPadrao = ['lembretes', 'clientes', 'ordens', 'equipamentos', 'dashboard', 'caixa'];
      } else if (value === 'admin') {
        permissoesPadrao = AREAS_SISTEMA.map(a => a.key);
      }
      setForm((prev) => ({ ...prev, permissoes: permissoesPadrao }));
    }
  };

  const handlePermissaoChange = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(key)
        ? prev.permissoes.filter((p) => p !== key)
        : [...prev.permissoes, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updateData: any = {
      id: userId,
      nome: form.nome,
      email: form.email,
      usuario: form.usuario.trim().toLowerCase(),
      telefone: form.telefone,
      cpf: form.cpf,
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
    setSaving(false);
    if (!response.ok) {
      addToast('error', result.error || 'Erro ao salvar alterações');
    } else {
      addToast('success', 'Usuário atualizado com sucesso!');
      router.push('/configuracoes?tab=1');
    }
  };

  return (
    <MenuLayout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <FiArrowLeft />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
        </div>
        
        {loading ? (
          <div className="text-center py-20">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário</label>
              <input
                type="text"
                name="usuario"
                value={form.usuario}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha (deixe em branco para não alterar)</label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nível</label>
              <select
                name="nivel"
                value={form.nivel}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Selecione...</option>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="atendente">Atendente</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Permissões de Acesso</label>
              <div className="grid grid-cols-2 gap-2">
                {AREAS_SISTEMA.map((area) => (
                  <label key={area.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.permissoes.includes(area.key)}
                      onChange={() => handlePermissaoChange(area.key)}
                    />
                    {area.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/configuracoes?tab=1')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </MenuLayout>
  );
} 