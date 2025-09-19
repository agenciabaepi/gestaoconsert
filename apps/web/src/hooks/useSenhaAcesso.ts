import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useSenhaAcesso = (osId: string) => {
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const gerarNovaSenha = async () => {
    setLoading(true);
    setError('');

    try {
      // Gerar senha de 4 dígitos
      const novaSenha = Math.floor(1000 + Math.random() * 9000).toString();

      // Atualizar no banco
      const { error } = await supabase
        .from('ordens_servico')
        .update({ senha_acesso: novaSenha })
        .eq('id', osId);

      if (error) {
        setError('Erro ao gerar nova senha');
        setLoading(false);
        return;
      }

      setSenha(novaSenha);
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao gerar senha');
      setLoading(false);
    }
  };

  const buscarSenha = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('senha_acesso')
        .eq('id', osId)
        .single();

      if (error) {
        setError('Erro ao buscar senha');
        setLoading(false);
        return;
      }

      setSenha(data?.senha_acesso || '');
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao buscar senha');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (osId) {
      buscarSenha();
    }
  }, [osId]);

  return {
    senha,
    loading,
    error,
    gerarNovaSenha,
    buscarSenha
  };
};
