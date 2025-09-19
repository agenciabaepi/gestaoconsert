import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    // usar service role para contornar RLS no cadastro
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const search = searchParams.get('search') || '';

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID é obrigatório' }, { status: 400 });
    }

    let query = supabase
      .from('clientes')
      .select('id, nome, telefone, celular, email, documento, numero_cliente')
      .eq('empresa_id', empresaId)
      .eq('status', 'ativo')
      .order('nome', { ascending: true });

    if (search) {
      query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,celular.ilike.%${search}%,documento.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }

    return NextResponse.json({ clientes: data });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 

export async function POST(request: Request) {
  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : await createServerSupabaseClient();
    const body = await request.json();
    const { empresaId, nome, telefone, celular, email, documento } = body || {};

    if (!empresaId || !nome) {
      return NextResponse.json({ error: 'empresaId e nome são obrigatórios' }, { status: 400 });
    }

    // Gerar próximo numero_cliente sequencial por empresa (fallback simples)
    const { data: ultimo, error: erroUltimo } = await supabase
      .from('clientes')
      .select('numero_cliente')
      .eq('empresa_id', empresaId)
      .order('numero_cliente', { ascending: false })
      .limit(1);

    if (erroUltimo) {
      console.error('Erro ao obter último número de cliente:', erroUltimo);
    }

    let proximoNumero = 1;
    if (Array.isArray(ultimo) && ultimo.length > 0 && ultimo[0]?.numero_cliente != null) {
      const prev = typeof (ultimo[0] as any).numero_cliente === 'string' ? parseInt((ultimo[0] as any).numero_cliente) : Number((ultimo[0] as any).numero_cliente);
      proximoNumero = (isNaN(prev) ? 0 : prev) + 1;
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        empresa_id: empresaId,
        nome,
        telefone: telefone ?? '',
        celular: celular ?? '',
        email: email ?? '',
        documento: documento ?? '',
        numero_cliente: proximoNumero,
        status: 'ativo',
        tipo: 'pf',
        data_cadastro: new Date().toISOString(),
        cadastrado_por: 'SISTEMA'
      })
      .select('id, nome, telefone, celular, email, documento, numero_cliente')
      .single();

    if (error) {
      console.error('Erro ao cadastrar cliente:', error);
      return NextResponse.json({ error: (error as any).message || 'Erro ao cadastrar cliente' }, { status: 500 });
    }

    return NextResponse.json({ cliente: data }, { status: 201 });
  } catch (error: any) {
    console.error('Erro interno no cadastro de cliente:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}