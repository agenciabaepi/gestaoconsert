import { NextRequest, NextResponse } from 'next/server';
import { configureMercadoPago } from '@/lib/mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se é uma notificação do Mercado Pago
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;
    
    // Configurar Mercado Pago
    const mercadopago = configureMercadoPago();
    
    // Buscar informações do pagamento
    const payment = await mercadopago.payment.findById(paymentId);
    
    if (!payment) {
      console.error('Pagamento não encontrado:', paymentId);
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Extrair assinatura_id do external_reference
    const externalRef = payment.external_reference;
    const assinaturaId = externalRef?.replace('assinatura_', '');
    
    if (!assinaturaId) {
      console.error('External reference inválido:', externalRef);
      return NextResponse.json({ error: 'External reference inválido' }, { status: 400 });
    }

    // Salvar no banco de dados
    const supabase = createServerSupabaseClient();
    
    // Buscar pagamento pelo external_reference
    const { data: pagamento, error: fetchError } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('mercadopago_external_reference', externalRef)
      .single();

    if (fetchError || !pagamento) {
      console.error('Pagamento não encontrado no banco:', externalRef);
      return NextResponse.json({ error: 'Pagamento não encontrado no banco' }, { status: 404 });
    }

    // Atualizar status do pagamento
    const updateData: any = {
      mercadopago_payment_id: paymentId.toString(),
      status: payment.status,
      status_detail: payment.status_detail,
      webhook_received: true,
      webhook_data: body,
      updated_at: new Date().toISOString(),
    };

    // Se foi aprovado, adicionar paid_at e atualizar assinatura
    if (payment.status === 'approved') {
      updateData.paid_at = new Date().toISOString();
      
      // Atualizar assinatura para ativa
      const { error: assinaturaError } = await supabase
        .from('assinaturas')
        .update({
          status: 'active',
          data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
          proxima_cobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assinaturaId);

      if (assinaturaError) {
        console.error('Erro ao atualizar assinatura:', assinaturaError);
      } else {
        console.log(`Assinatura ${assinaturaId} ativada com sucesso`);
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Atualizar assinatura para suspensa
      const { error: assinaturaError } = await supabase
        .from('assinaturas')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assinaturaId);

      if (assinaturaError) {
        console.error('Erro ao suspender assinatura:', assinaturaError);
      } else {
        console.log(`Assinatura ${assinaturaId} suspensa`);
      }
    }

    // Atualizar pagamento
    const { error: updateError } = await supabase
      .from('pagamentos')
      .update(updateData)
      .eq('id', pagamento.id);

    if (updateError) {
      console.error('Erro ao atualizar pagamento:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 });
    }

    console.log(`Pagamento ${paymentId} da assinatura ${assinaturaId} atualizado para status: ${payment.status}`);

    return NextResponse.json({ 
      received: true,
      payment_id: paymentId,
      assinatura_id: assinaturaId,
      status: payment.status 
    });

  } catch (error) {
    console.error('Erro no webhook de assinatura:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 