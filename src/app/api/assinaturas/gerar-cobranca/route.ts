import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { configureMercadoPago } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const { assinaturaId } = await request.json();
    
    if (!assinaturaId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Buscar dados da assinatura
    const { data: assinatura, error: fetchError } = await supabase
      .from('assinaturas')
      .select(`
        *,
        empresas!inner(nome, email_contato),
        planos!inner(nome, valor)
      `)
      .eq('id', assinaturaId)
      .single();

    if (fetchError || !assinatura) {
      console.error('Erro ao buscar assinatura:', fetchError);
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se trial expirou
    if (assinatura.status !== 'trial' || 
        new Date(assinatura.data_trial_fim) > new Date()) {
      return NextResponse.json(
        { error: 'Trial ainda não expirou' },
        { status: 400 }
      );
    }

    // Configurar Mercado Pago
    const mercadopago = configureMercadoPago();
    
    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          title: `Assinatura ${assinatura.planos.nome} - ${assinatura.empresas.nome}`,
          unit_price: parseFloat(assinatura.valor),
          quantity: 1,
        },
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'bank_transfer' },
        ],
        installments: 1,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/assinaturas/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/assinaturas/falha`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/assinaturas/pendente`,
      },
      auto_return: 'approved',
      external_reference: `assinatura_${assinaturaId}`,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/assinaturas/webhook`,
      expires: true,
      expiration_date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Salvar pagamento no banco
    const { data: pagamento, error: dbError } = await supabase
      .from('pagamentos')
      .insert({
        empresa_id: assinatura.empresa_id,
        usuario_id: assinatura.empresa_id, // Usar empresa_id como usuário
        valor: assinatura.valor,
        mercadopago_preference_id: response.body.id,
        mercadopago_external_reference: preference.external_reference,
        status: 'pending',
        status_detail: 'pending_waiting_payment',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar pagamento:', dbError);
      return NextResponse.json(
        { error: 'Erro ao salvar pagamento' },
        { status: 500 }
      );
    }

    // Atualizar assinatura
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({
        status: 'pending_payment',
        proxima_cobranca: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assinaturaId);

    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
    }

    return NextResponse.json({
      success: true,
      preference_id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      pagamento_id: pagamento.id,
      assinatura_id: assinaturaId,
    });

  } catch (error) {
    console.error('Erro ao gerar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 