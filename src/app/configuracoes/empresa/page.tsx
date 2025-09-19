'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProtectedRoute from '@/components/ProtectedRoute';

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
  user_id: string;
}

export default function ConfigEmpresa() {
  const [form, setForm] = useState({
    nome: '', cnpj: '', endereco: '', logoUrl: '', telefone: '', email: '', website: ''
  });
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchEmpresa = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser() as { data: { user: SupabaseUser }, error: SupabaseError | null };
        if (userError) throw new Error('Erro ao obter usuário: ' + userError.message);
        if (!user) { setLoading(false); return; }
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) {
          setError(error.message || JSON.stringify(error) || 'Erro ao buscar dados');
        } else if (data) {
          setForm({
            nome: data.nome || '',
            cnpj: data.cnpj || '',
            endereco: data.endereco || '',
            logoUrl: data.logo_url || '',
            telefone: data.telefone || '',
            email: data.email || '',
            website: data.website || ''
          });
          setEmpresaId(data.id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchEmpresa();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser() as { data: { user: SupabaseUser }, error: SupabaseError | null };
      if (userError) throw new Error('Erro ao obter usuário: ' + userError.message);
      if (!user) throw new Error('Usuário não autenticado');
      if (empresaId) {
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('user_id')
          .eq('id', empresaId)
          .maybeSingle();
        if (empresaError) throw new Error('Erro ao verificar propriedade da empresa: ' + empresaError.message);
        if (empresa && empresa.user_id !== user.id) throw new Error('Você não tem permissão para editar esta empresa.');
      }
      const empresaData: Partial<Empresa> = { 
        user_id: user.id,
        nome: form.nome, cnpj: form.cnpj, endereco: form.endereco, logo_url: form.logoUrl,
        telefone: form.telefone, email: form.email, website: form.website
      };
      if (empresaId) empresaData.id = empresaId;
      const { error } = await supabase.from('empresas').upsert([empresaData]);
      if (error) { setError(error.message || JSON.stringify(error) || 'Erro desconhecido'); }
      else { alert('Configurações salvas com sucesso!'); setIsEditing(false); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await handleDeleteLogo();
    const file = e.target.files[0];
    const filePath = `logos/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file);
    if (uploadError) { setError(uploadError.message); return; }
    const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
    setForm({ ...form, logoUrl: data.publicUrl });
  };

  const handleDeleteLogo = async () => {
    if (!form.logoUrl) return;
    const parts = form.logoUrl.split('/');
    const fileName = parts.slice(parts.indexOf('logos')).join('/');
    const { error: deleteError } = await supabase.storage.from('logos').remove([fileName]);
    if (deleteError) setError(deleteError.message); else setForm({ ...form, logoUrl: '' });
  };

  return (
    <ProtectedRoute allowedLevels={['admin', 'tecnico', 'financeiro']}>
      <div className="w-full px-6 pt-1 pb-6">
        <h1 className="text-2xl font-semibold mb-6 text-black text-center">Configurações da Empresa</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5 space-y-2">
            <h2 className="text-base font-semibold text-gray-800">Dados Atuais</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Nome:</strong> {form.nome || '-'}</li>
              <li><strong>CNPJ:</strong> {form.cnpj || '-'}</li>
              <li><strong>Endereço:</strong> {form.endereco || '-'}</li>
              <li><strong>Telefone:</strong> {form.telefone || '-'}</li>
              <li><strong>Email:</strong> {form.email || '-'}</li>
              <li><strong>Website:</strong> {form.website || '-'}</li>
              <li><strong>Logo:</strong> {form.logoUrl ? <a href={form.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver Logo</a> : '-'}</li>
            </ul>
            {form.logoUrl && (
              <div className="mt-3">
                <img src={form.logoUrl} alt="Logo" className="h-20 rounded shadow" />
                {isEditing && (
                  <button type="button" onClick={handleDeleteLogo} className="text-red-500 text-xs mt-1 hover:underline">Remover Logo</button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold text-gray-800">Editar Dados</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800">{isEditing ? 'Cancelar' : 'Editar'}</button>
            </div>
            {error && <p className="text-red-500 mb-2 text-sm">Erro: {error}</p>}
            {loading && <p className="text-gray-500 mb-2 text-sm">Salvando...</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {Object.entries({
                nome: 'Nome da Empresa', cnpj: 'CNPJ', endereco: 'Endereço', logoUrl: 'URL da Logo', telefone: 'Telefone', email: 'Email', website: 'Website'
              }).map(([field, label]) => (
                <div key={field} className="flex flex-col">
                  <label htmlFor={field} className="text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input id={field} name={field} value={(form as Record<string, string>)[field]} onChange={handleChange} disabled={!isEditing} className={`p-2 rounded border text-sm ${isEditing ? 'border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-200' : 'bg-gray-100 cursor-not-allowed'}`} />
                </div>
              ))}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">Upload da Logo</label>
                <div className={`relative border-2 border-dashed rounded-lg p-3 text-center ${!isEditing ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'hover:border-blue-500'}`}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={!isEditing} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-gray-500 text-xs">{form.logoUrl ? 'Clique para trocar a logo' : 'Clique para enviar uma imagem'}</span>
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end">
                <button type="submit" className="px-4 py-2 rounded text-black bg-[#cffb6d] hover:bg-[#b9e84e]" disabled={!isEditing}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Fim do arquivo - removeu duplicações e diretivas fora do topo