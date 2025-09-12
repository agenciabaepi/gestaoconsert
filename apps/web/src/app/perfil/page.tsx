'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import MenuLayout from '@/components/MenuLayout';
import { useToast } from '@/components/Toast';
import { ConfirmProvider, useConfirm } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { FiUser, FiCamera, FiTrash2, FiEdit2, FiSave, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

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
    whatsapp: '',
    senha: '',
  });
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de validação
  const [emailValido, setEmailValido] = useState(true);
  const [usuarioValido, setUsuarioValido] = useState(true);

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
        if (error) {
          // Suprimir erros 406 específicos do perfil
          if (error.code === '406' || error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
            console.warn('⚠️ Erro 406 suprimido na página de perfil:', error);
            setLoading(false);
            return;
          }
          addToast('error', 'Erro ao carregar dados do perfil');
          setLoading(false);
          return;
        }
        if (!data) {
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

  // Validação em tempo real
  useEffect(() => {
    if (form.email) {
      const emailFormatValido = validarEmail(form.email);
      if (!emailFormatValido) {
        setEmailValido(false);
        return;
      }
      validarEmailUnico(form.email).then(setEmailValido);
    } else {
      setEmailValido(true);
    }
  }, [form.email]);

  useEffect(() => {
    if (form.usuario) {
      validarUsuarioUnico(form.usuario).then(setUsuarioValido);
    } else {
      setUsuarioValido(true);
    }
  }, [form.usuario]);

  // Função para validar email
  const validarEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar usuário único
  const validarUsuarioUnico = async (usuario: string) => {
    if (!usuario.trim() || !perfil?.id) return true;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('usuario', usuario.trim().toLowerCase())
        .neq('id', perfil.id)
        .single();
      
      // Suprimir erros 406 específicos
      if (error && (error.code === '406' || error.message?.includes('406') || error.message?.includes('Not Acceptable'))) {
        console.warn('⚠️ Erro 406 suprimido na validação de usuário:', error);
        return true; // Assumir válido em caso de erro 406
      }
      
      return !data; // Retorna true se não existir (válido)
    } catch {
      return true; // Se não encontrar, é válido
    }
  };

  // Função para validar email único
  const validarEmailUnico = async (email: string) => {
    if (!email.trim() || !perfil?.id) return true;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .neq('id', perfil.id)
        .single();
      
      // Suprimir erros 406 específicos
      if (error && (error.code === '406' || error.message?.includes('406') || error.message?.includes('Not Acceptable'))) {
        console.warn('⚠️ Erro 406 suprimido na validação de email:', error);
        return true; // Assumir válido em caso de erro 406
      }
      
      return !data; // Retorna true se não existir (válido)
    } catch {
      return true; // Se não encontrar, é válido
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações finais
    if (!emailValido) {
      addToast('error', 'E-mail inválido ou já cadastrado');
      return;
    }
    
    if (!usuarioValido) {
      addToast('error', 'Nome de usuário já existe');
      return;
    }

    setSaving(true);
    try {
      if (!user?.id) {
        addToast('error', 'Usuário não autenticado');
        setSaving(false);
        return;
      }
      
      // Padronizar username
      const usuarioPadronizado = form.usuario.trim().toLowerCase();
      
      // Usar API de edição para sincronizar Auth
      const response = await fetch('/api/usuarios/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: perfil?.id,
          auth_user_id: user.id,
          nome: form.nome,
          email: form.email,
          usuario: usuarioPadronizado,
          cpf: form.cpf || null,
          whatsapp: form.whatsapp || null,
          senha: form.senha || undefined,
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        addToast('error', result.error || 'Erro ao atualizar perfil');
        setSaving(false);
        return;
      }
      
      // Atualizar estado local
      setPerfil(prev => prev ? { ...prev, ...form, usuario: usuarioPadronizado } : null);
      
      // Limpar senha do formulário
      setForm(prev => ({ ...prev, senha: '' }));
      
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
      // Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ Usuário não autenticado:', sessionError);
        addToast('error', 'Usuário não autenticado. Faça login novamente.');
        setUploading(false);
        return;
      }

      // Pular verificação de bucket (problema de permissões)
      // Validar extensões permitidas
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        addToast('error', `Formato não suportado. Use: ${allowedExtensions.join(', ')}`);
        setUploading(false);
        return;
      }

      let filePath = `user-${perfil.id}/${Date.now()}-${file.name}`;
      
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
      
      // Verificar se é erro 406 e suprimir
      if (uploadResult.error && (
        uploadResult.error.message?.includes('406') || 
        uploadResult.error.message?.includes('Not Acceptable')
      )) {
        console.warn('⚠️ Erro 406 suprimido no upload de avatar:', uploadResult.error);
        addToast('warning', 'Upload de foto temporariamente indisponível');
        setUploading(false);
        return;
      }

      if (uploadResult.error) {
        // Segunda tentativa: sem upsert
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { 
            upsert: false,
            cacheControl: '3600'
          });
      }

      if (uploadResult.error) {
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

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const url = publicData.publicUrl;
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
      // Extrai o caminho do arquivo do storage
      const pathMatch = fotoUrl.match(/user-[^/]+\/[^?]+/);
      if (pathMatch) {
        const filePath = pathMatch[0];
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (removeError) {
          console.error('Erro ao remover arquivo do storage:', removeError);
          // Continua mesmo se não conseguir remover do storage
        } else {
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
        <div className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="animate-pulse space-y-6">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e configurações de conta</p>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "" : "bg-[#cffb6d] text-black hover:bg-[#b8e55a]"}
          >
            {isEditing ? (
              <>
                <FiX size={16} className="mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <FiEdit2 size={16} className="mr-2" />
                Editar Perfil
              </>
            )}
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              {/* Bloco de avatar e upload */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Foto de perfil"
                      className="w-32 h-32 rounded-full border-4 border-gray-900 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gray-200 flex items-center justify-center shadow-lg">
                      <span className="text-6xl font-bold text-gray-700">
                        {perfil?.nome?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <button
                    className="absolute bottom-0 right-0 bg-gray-900 text-white rounded-full p-3 shadow-lg hover:bg-gray-800 transition-all duration-200"
                    onClick={() => fileInputRef.current?.click()}
                    title="Trocar foto"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FiCamera className="w-5 h-5" />
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
                    className="mt-3 text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 flex items-center gap-1"
                    onClick={handleRemoverFoto}
                    disabled={uploading}
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Remover foto
                  </button>
                )}
                <span className="mt-2 text-sm text-gray-600">Clique no ícone para trocar a foto</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-gray-900' 
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        isEditing 
                          ? emailValido ? 'border-gray-300 focus:ring-gray-900' : 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      placeholder="Digite seu e-mail"
                      required
                    />
                    {isEditing && form.email && !emailValido && (
                      <p className="text-red-500 text-xs">
                        {!validarEmail(form.email) ? 'E-mail inválido' : 'E-mail já cadastrado'}
                      </p>
                    )}
                  </div>

                  {/* Usuário */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome de Usuário *
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={form.usuario}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        isEditing 
                          ? usuarioValido ? 'border-gray-300 focus:ring-gray-900' : 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      placeholder="Digite seu nome de usuário"
                      required
                    />
                    {isEditing && form.usuario && !usuarioValido && (
                      <p className="text-red-500 text-xs">Nome de usuário já existe</p>
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
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 pr-12 ${
                          isEditing 
                            ? 'border-gray-300 focus:ring-gray-900' 
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        }`}
                        placeholder="Deixe em branco para não alterar"
                        autoComplete="new-password"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setSenhaVisivel(!senhaVisivel)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {senhaVisivel ? (
                            <FiEyeOff className="w-5 h-5" />
                          ) : (
                            <FiEye className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                      placeholder="000.000.000-00 (opcional)"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      WhatsApp *
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-gray-900' 
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                {/* Informações do Sistema */}
                <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5" />
                    Informações do Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600">Nível de Acesso:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {perfil?.nivel || 'Não definido'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600">ID do Usuário:</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">
                        {perfil?.id || 'Não disponível'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !emailValido || !usuarioValido}
                      className="bg-[#cffb6d] text-black hover:bg-[#b8e55a]"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <FiSave size={16} className="mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
} 