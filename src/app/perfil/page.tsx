'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import { useToast } from '@/components/Toast';

interface UsuarioPerfil {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  nivel: string;
}

export default function PerfilPage() {
  const { user, loading: authLoading, usuarioData, updateUsuarioFoto } = useAuth();
  const { addToast } = useToast();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    usuario: '',
    cpf: '',
    telefone: '',
    whatsapp: '',
    senha: '',
  });
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      // Busca dados do usuário
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (error || !data) {
          addToast('error', 'Erro ao carregar dados do perfil');
          setLoading(false);
          return;
        }
        setPerfil({
          id: data.id || user.id,
          nome: data.nome || '',
          email: data.email || '',
          usuario: data.usuario || '',
          cpf: data.cpf || '',
          telefone: data.telefone || '',
          whatsapp: data.whatsapp || '',
          nivel: data.nivel || 'atendente',
        });
        setForm({
          nome: data.nome || '',
          email: data.email || '',
          usuario: data.usuario || '',
          cpf: data.cpf || '',
          telefone: data.telefone || '',
          whatsapp: data.whatsapp || '',
          senha: '',
        });
        if (data?.foto_url) setFotoUrl(data.foto_url);
      } catch (err) {
        addToast('error', 'Erro inesperado ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [user, authLoading, usuarioData, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!user?.id) {
        addToast('error', 'Usuário não autenticado');
        setSaving(false);
        return;
      }
      // Padronizar username
      const usuarioPadronizado = form.usuario.trim().toLowerCase();
      // Atualizar senha se fornecida
      if (form.senha) {
        const response = await fetch('/api/usuarios/editar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: perfil?.id,
            auth_user_id: user.id,
            senha: form.senha,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          addToast('error', result.error || 'Erro ao atualizar senha');
          setSaving(false);
          return;
        }
      }
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          usuario: usuarioPadronizado,
          cpf: form.cpf || null,
          telefone: form.telefone || null,
          whatsapp: form.whatsapp || null,
        })
        .eq('auth_user_id', user.id);
      if (error) {
        addToast('error', 'Erro ao salvar alterações');
        setSaving(false);
        return;
      }
      setPerfil(prev => prev ? { ...prev, ...form, usuario: usuarioPadronizado } : null);
      addToast('success', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      addToast('error', 'Erro inesperado ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil?.id) {
      addToast('error', 'Arquivo não selecionado ou usuário não encontrado');
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'A imagem deve ter no máximo 5MB');
      return;
    }

    // Validar se o arquivo não está vazio
    if (file.size === 0) {
      addToast('error', 'O arquivo está vazio');
      return;
    }

    // Validar se o arquivo tem nome
    if (!file.name || file.name.trim() === '') {
      addToast('error', 'O arquivo deve ter um nome');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Iniciando upload da foto:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: perfil.id
      });

      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Erro ao verificar buckets:', bucketsError);
        addToast('error', 'Erro ao verificar configuração do storage');
        setUploading(false);
        return;
      }

      const avatarsBucket = buckets.find(b => b.id === 'avatars');
      
      if (!avatarsBucket) {
        console.error('Bucket avatars não encontrado');
        addToast('error', 'Bucket de avatars não está configurado. Execute o script SQL primeiro.');
        setUploading(false);
        return;
      }

      console.log('Bucket avatars encontrado:', avatarsBucket);

      // Validar extensões permitidas
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        addToast('error', `Formato não suportado. Use: ${allowedExtensions.join(', ')}`);
        setUploading(false);
        return;
      }

      const filePath = `user-${perfil.id}/${Date.now()}-${file.name}`;
      
      console.log('Fazendo upload para:', filePath);
      
      // Tentar upload com diferentes configurações
      let uploadResult;
      let uploadError;

      // Primeira tentativa: upload normal
      uploadResult = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadResult.error) {
        console.log('Primeira tentativa falhou, tentando sem upsert...');
        
        // Segunda tentativa: sem upsert
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { 
            upsert: false,
            cacheControl: '3600'
          });
      }

      if (uploadResult.error) {
        console.log('Segunda tentativa falhou, tentando com nome único...');
        
        // Terceira tentativa: com nome único
        const uniqueFilePath = `user-${perfil.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(uniqueFilePath, file, { 
            upsert: false,
            cacheControl: '3600'
          });
        
        if (!uploadResult.error) {
          // Atualizar filePath se a terceira tentativa funcionou
          filePath = uniqueFilePath;
        }
      }

      const { data, error } = uploadResult;

      if (error) {
        console.error('Erro no upload:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        let errorMessage = 'Erro ao fazer upload da foto';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        } else if (error.details) {
          errorMessage += `: ${error.details}`;
        } else if (error.hint) {
          errorMessage += `: ${error.hint}`;
        }
        
        addToast('error', errorMessage);
        setUploading(false);
        return;
      }

      if (!data) {
        console.error('Upload falhou - sem dados retornados');
        addToast('error', 'Upload falhou - tente novamente');
        setUploading(false);
        return;
      }

      console.log('Upload realizado com sucesso:', data);

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const url = publicData.publicUrl;
      console.log('URL pública gerada:', url);

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_url: url })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('Erro ao atualizar foto_url no banco:', updateError);
        addToast('error', 'Erro ao salvar URL da foto no banco de dados');
        setUploading(false);
        return;
      }

      setFotoUrl(url);
      updateUsuarioFoto(url);
      addToast('success', 'Foto atualizada com sucesso!');
      
    } catch (error) {
      console.error('Erro inesperado no upload:', error);
      addToast('error', 'Erro inesperado ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  // Função para remover foto de perfil
  const handleRemoverFoto = async () => {
    if (!perfil?.id || !fotoUrl) {
      addToast('error', 'Usuário não encontrado ou sem foto');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Iniciando remoção da foto:', { userId: perfil.id, fotoUrl });

      // Extrai o caminho do arquivo do storage
      const pathMatch = fotoUrl.match(/user-[^/]+\/[^?]+/);
      if (pathMatch) {
        const filePath = pathMatch[0];
        console.log('Removendo arquivo do storage:', filePath);
        
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (removeError) {
          console.error('Erro ao remover arquivo do storage:', removeError);
          // Continua mesmo se não conseguir remover do storage
        } else {
          console.log('Arquivo removido do storage com sucesso');
        }
      }

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_url: null })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('Erro ao atualizar foto_url no banco:', updateError);
        addToast('error', 'Erro ao remover foto do banco de dados');
        setUploading(false);
        return;
      }

      setFotoUrl(null);
      updateUsuarioFoto('');
      addToast('success', 'Foto removida com sucesso!');
      
    } catch (error) {
      console.error('Erro inesperado ao remover foto:', error);
      addToast('error', 'Erro inesperado ao remover foto');
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <MenuLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Bloco de avatar e upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto de perfil"
                  className="w-28 h-28 rounded-full border-4 border-lime-400 object-cover shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-lime-400 bg-lime-200 flex items-center justify-center shadow-lg">
                  <span className="text-5xl font-bold text-lime-700">
                    {perfil?.nome?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
                onClick={() => fileInputRef.current?.click()}
                title="Trocar foto"
                disabled={uploading}
              >
                {uploading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v6m0 0l-3-3m3 3l3-3m-6-6a4 4 0 118 0 4 4 0 01-8 0z" /></svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadFoto}
                disabled={uploading}
              />
            </div>
            {fotoUrl && (
              <button
                className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
                onClick={handleRemoverFoto}
                disabled={uploading}
              >
                Remover foto
              </button>
            )}
            <span className="mt-2 text-sm text-gray-600">Clique no ícone para trocar a foto</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    value={form.usuario}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha (deixe em branco para não alterar)
                  </label>
                  <input
                    type="password"
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={form.cpf}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nível de Acesso:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {perfil?.nivel || 'Não definido'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ID do Usuário:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {perfil?.id || 'Não disponível'}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
} 