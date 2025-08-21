import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const hoje = new Date().toISOString().split('T')[0];

  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('*')
    .or(`(trialAtivo.eq.true,and(dataFimTrial.lt.${hoje})),pagamentoEmDia.eq.false`);

  if (error) {
    console.error('Erro ao buscar empresas:', error.message);
    return new Response('Erro ao buscar empresas', { status: 500 });
  }

  for (const empresa of empresas || []) {
    await supabase
      .from('empresas')
      .update({
        status: 'bloqueado',
        motivoBloqueio: empresa.trialAtivo
          ? 'Período de teste expirado'
          : 'Pagamento em atraso',
        trialAtivo: false,
      })
      .eq('id', empresa.id);
  }

  return new Response('Verificação concluída com sucesso', { status: 200 });
});