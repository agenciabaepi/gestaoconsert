import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { cnpj } = await request.json();

    if (!cnpj) {
      return NextResponse.json({ exists: false });
    }

    // Verificar se o CNPJ já existe na tabela empresas
    const { data: empresaExistente } = await supabase
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpj)
      .maybeSingle();

    return NextResponse.json({ exists: !!empresaExistente });
  } catch (error) {
    console.error('Erro ao verificar CNPJ:', error);
    return NextResponse.json({ exists: false });
  }
}