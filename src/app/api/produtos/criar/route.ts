import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  console.log('API Route /api/produtos/criar chamada');
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const {
      empresa_id,
      nome,
      tipo,
      preco,
      unidade,
      ativo
    } = await req.json();

    console.log('Dados recebidos na API de cadastro rápido:', {
      empresa_id, nome, tipo, preco, unidade, ativo
    });

    // Validate required fields
    if (!empresa_id || !nome || !tipo || !preco) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: empresa_id, nome, tipo ou preco' },
        { status: 400 }
      );
    }

    // Buscar todos os códigos da empresa e calcular o máximo de forma robusta
    const { data: codigosData } = await supabaseAdmin
      .from('produtos_servicos')
      .select('codigo')
      .eq('empresa_id', empresa_id);

    const maxCodigo = (codigosData || [])
      .map((r: any) => parseInt(String(r?.codigo || '0'), 10))
      .filter((n: number) => !Number.isNaN(n))
      .reduce((acc: number, n: number) => (n > acc ? n : acc), 0);

    let proximoCodigo = maxCodigo + 1;

    const payload = {
      empresa_id,
      nome,
      tipo,
      preco: parseFloat(preco),
      unidade: unidade || 'un',
      ativo: true, // Sempre ativo por padrão
      codigo: proximoCodigo.toString()
    };

    console.log('Payload para inserção:', payload);

    // Inserção com retry se houver conflito de código único (23505)
    let data: any = null;
    let error: any = null;
    for (let tentativas = 0; tentativas < 5; tentativas++) {
      const tentativaPayload = { ...payload, codigo: proximoCodigo.toString() };
      const res = await supabaseAdmin
        .from('produtos_servicos')
        .insert(tentativaPayload)
        .select()
        .single();
      data = res.data;
      error = res.error;
      if (!error) break;
      if (error?.code === '23505') {
        // código duplicado – incrementar e tentar novamente
        proximoCodigo += 1;
        continue;
      }
      break;
    }

    if (error) {
      console.error('Error inserting product/service:', error);
      return NextResponse.json(
        {
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        },
        { status: 500 }
      );
    }

    console.log('Produto/serviço criado com sucesso:', data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('General POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 