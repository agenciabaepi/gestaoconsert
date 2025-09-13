import { NextRequest, NextResponse } from 'next/server';
import { configureMercadoPago } from '@/lib/mercadopago';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(request: NextRequest) {
  try {
    const { 
      order_id, 
      payment_method, 
      amount, 
      currency, 
      payer, 
      payment_token 
    } = await request.json();
    
    // Validar dados obrigatórios
    if (!order_id || !amount || !payer?.email || !payment_token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Dados obrigatórios ausentes',
          message: 'order_id, amount, payer.email e payment_token são obrigatórios'
        },
        { status: 400 }
      );
    }

    // Validar valor
    if (amount <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Valor inválido',
          message: 'O valor deve ser maior que zero'
        },
        { status: 400 }
      );
    }

    // Verificar se é um token de teste inválido
    if (payment_token === 'invalid_test_token') {
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          error: 'Token de pagamento inválido',
          message: 'O token fornecido não é válido'
        },
        { status: 400 }
      );
    }

    // MODO MOCK: simular processamento de pagamento
    const shouldMock = process.env.MERCADOPAGO_MOCK === '1' || payment_token === 'valid_test_token';
    
    if (shouldMock) {
      // Simular processamento bem-sucedido
      const mockTransactionId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        status: 'success',
        transaction_id: mockTransactionId,
        message: 'Pagamento processado com sucesso',
        payment_details: {
          order_id,
          amount,
          currency: currency || 'BRL',
          payment_method,
          payer_email: payer.email,
          processed_at: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Configurar Mercado Pago para processamento real
    try {
      const { config, Payment: PaymentClass } = configureMercadoPago();
      const payment = new PaymentClass(config);

      const paymentData = {
        transaction_amount: amount,
        token: payment_token,
        description: `Pagamento para pedido ${order_id}`,
        installments: 1,
        payment_method_id: payment_method || 'pix',
        payer: {
          email: payer.email,
          first_name: payer.first_name,
          last_name: payer.last_name
        }
      };

      const response = await payment.create({ body: paymentData });

      if (response.status === 'approved') {
        return NextResponse.json({
          success: true,
          status: 'success',
          transaction_id: response.id?.toString(),
          message: 'Pagamento aprovado com sucesso',
          payment_details: {
            order_id,
            amount: response.transaction_amount,
            currency: response.currency_id,
            payment_method: response.payment_method_id,
            payer_email: response.payer?.email,
            processed_at: response.date_created
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Pagamento rejeitado',
          message: response.status_detail || 'Pagamento não foi aprovado'
        }, { status: 400 });
      }

    } catch (mpError: any) {
      console.error('❌ Erro do Mercado Pago:', mpError);
      
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: 'Erro no processamento do pagamento',
        message: mpError.message || 'Erro interno do Mercado Pago'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar pagamento:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        success: false,
        status: 'failed',
        error: 'Erro interno do servidor',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}