import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const empresa_id = url.searchParams.get('empresa_id');
    if (!empresa_id) {
      return NextResponse.json({ error: 'empresa_id is required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('produtos_servicos')
      .select('codigo')
      .eq('empresa_id', empresa_id);
    if (error) {
      console.error('Error fetching codes:', error);
      return NextResponse.json({ ultimoCodigo: 0 }, { status: 200 });
    }
    // Parse all codigo as integers and find max
    const maxCodigo = data
      .map(item => parseInt(item.codigo, 10))
      .filter(n => !isNaN(n))
      .reduce((max, curr) => (curr > max ? curr : max), 0);
    return NextResponse.json({ ultimoCodigo: maxCodigo }, { status: 200 });
  } catch (err: any) {
    console.error('General GET error:', err);
    return NextResponse.json({ ultimoCodigo: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const {
      nome, tipo, grupo_id, categoria_id, subcategoria_id,
      preco, custo, situacao, empresa_id,
      fornecedor_id, unidade, marca,
      estoque_min, estoque_max, estoque_atual,
      ncm, cfop, cst, cest, obs, imagens, codigo,
      codigo_barras, largura_cm, altura_cm, profundidade_cm, peso_g
    } = await req.json();

    // Validate required fields
    if (!empresa_id || !nome || !preco) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: empresa_id, nome ou preco' },
        { status: 400 }
      );
    }

    const payload = {
      nome, tipo, grupo_id, categoria_id, subcategoria_id,
      preco: parseFloat(preco), custo: parseFloat(custo || '0'),
      situacao, empresa_id, fornecedor_id, unidade, marca,
      estoque_min: parseFloat(estoque_min || '0'),
      estoque_max: parseFloat(estoque_max || '0'),
      estoque_atual: parseFloat(estoque_atual || '0'),
      ncm, cfop, cst, cest, obs,
      imagens_url: imagens,
      codigo,
      codigo_barras,
      largura_cm: parseFloat(largura_cm || '0'),
      altura_cm: parseFloat(altura_cm || '0'),
      profundidade_cm: parseFloat(profundidade_cm || '0'),
      peso_g: parseFloat(peso_g || '0')
    };

    const { data, error } = await supabaseAdmin
      .from('produtos_servicos')
      .insert(payload);

    if (error) {
      console.error('Error inserting product:', error);
      return NextResponse.json(
        {
          message: 'Erro ao inserir produto.',
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

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error('General POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}