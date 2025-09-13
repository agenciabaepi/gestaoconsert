'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { 
  BuildingOfficeIcon as FiBuilding,
  PhotoIcon as FiImage,
  ArrowUpTrayIcon as FiUpload,
  XMarkIcon as FiX,
  TrashIcon as FiTrash2,
  DocumentTextIcon as FiFileText,
  PencilIcon as FiEdit2,
  CheckIcon as FiSave,
  MapPinIcon as FiMapPin,
  PhoneIcon as FiPhone,
  EnvelopeIcon as FiMail,
  GlobeAltIcon as FiGlobe
} from '@heroicons/react/24/outline';

interface SupabaseError { message: string }
interface SupabaseUser { id: string }
interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  logo_url: string;
  telefone: string;
  email: string;
  website: string;
  whatsapp: string;
  user_id: string;
}

export default function ConfigEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Empresa>>({});
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { refreshEmpresaData } = useAuth();

  useEffect(() => {
    fetchEmpresa();
  }, []);

  const fetchEmpresa = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar empresa:', error);
        addToast('error', 'Erro ao carregar dados da empresa');
        return;
      }

      if (data) {
        setEmpresa(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Erro:', error);
      addToast('error', 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      if (empresa) {
        const { error } = await supabase
          .from('empresas')
          .update(formData)
          .eq('id', empresa.id);

        if (error) {
          console.error('Erro ao atualizar empresa:', error);
          addToast('error', 'Erro ao salvar dados');
          return;
        }
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert({ ...formData, user_id: user.id });

        if (error) {
          console.error('Erro ao criar empresa:', error);
          addToast('error', 'Erro ao salvar dados');
          return;
        }
      }

      addToast('success', 'Dados salvos com sucesso!');
      setEditMode(false);
      fetchEmpresa();
    } catch (error) {
      console.error('Erro inesperado:', error);
      addToast('error', 'Erro inesperado');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addToast('error', 'Usuário não autenticado');
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        addToast('error', 'Erro ao fazer upload da imagem');
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const logoUrl = data.publicUrl;
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      
      // Salvar logo automaticamente no banco
      if (empresa) {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ logo_url: logoUrl })
          .eq('id', empresa.id);

        if (updateError) {
          console.error('Erro ao salvar logo no banco:', updateError);
          addToast('error', 'Erro ao salvar logo no banco');
          return;
        }
      }
      
      // Atualizar contexto em tempo real
      await refreshEmpresaData();
      
      addToast('success', 'Logo enviado e salvo com sucesso!');
    } catch (error) {
      console.error('Erro inesperado:', error);
      addToast('error', 'Erro inesperado');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setFormData(prev => ({ ...prev, logo_url: '' }));
      
      // Remover logo do banco automaticamente
      if (empresa) {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ logo_url: '' })
          .eq('id', empresa.id);

        if (updateError) {
          console.error('Erro ao remover logo do banco:', updateError);
          addToast('error', 'Erro ao remover logo do banco');
          return;
        }
      }
      
      // Atualizar contexto em tempo real
      await refreshEmpresaData();
      
      addToast('success', 'Logo removido com sucesso!');
    } catch (error) {
      console.error('Erro inesperado:', error);
      addToast('error', 'Erro inesperado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FiBuilding className="text-blue-600 h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
            <p className="text-gray-600">Gerencie as informações da sua empresa</p>
          </div>
        </div>

        {/* Logo Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiImage className="text-blue-600 h-5 w-5" />
              <h2 className="text-lg font-semibold text-gray-900">Logo da Empresa</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {formData.logo_url && formData.logo_url.trim() !== '' ? (
              <div className="relative">
                <img 
                  src={formData.logo_url} 
                  alt="Logo da empresa" 
                  className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                  onError={(e) => {
                    console.error('Erro ao carregar logo da empresa:', formData.logo_url);
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                {editMode && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <FiImage className="text-gray-400 h-6 w-6" />
              </div>
            )}

            {editMode ? (
              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <FiUpload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Enviar Logo'}
                  </Button>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB
                </p>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  Clique em "Editar" para modificar o logo da empresa
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Company Info Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiFileText className="text-blue-600 h-5 w-5" />
              <h2 className="text-lg font-semibold text-gray-900">Informações da Empresa</h2>
            </div>
            <Button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              variant={editMode ? "default" : "outline"}
            >
              {editMode ? (
                <>
                  <FiSave className="h-4 w-4 mr-2" />
                  Salvar
                </>
              ) : (
                <>
                  <FiEdit2 className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa
              </label>
              {editMode ? (
                <Input
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da empresa"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.nome || 'Não informado'}</p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ
              </label>
              {editMode ? (
                <Input
                  value={formData.cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.cnpj || 'Não informado'}</p>
              )}
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMapPin className="inline h-4 w-4 mr-1" />
                Endereço
              </label>
              {editMode ? (
                <Input
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.endereco || 'Não informado'}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="inline h-4 w-4 mr-1" />
                Telefone
              </label>
              {editMode ? (
                <Input
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.telefone || 'Não informado'}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="inline h-4 w-4 mr-1" />
                WhatsApp
              </label>
              {editMode ? (
                <Input
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.whatsapp || 'Não informado'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              {editMode ? (
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.email || 'Não informado'}</p>
              )}
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiGlobe className="inline h-4 w-4 mr-1" />
                Website
              </label>
              {editMode ? (
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.com"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{empresa?.website || 'Não informado'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}