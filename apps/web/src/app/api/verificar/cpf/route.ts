import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { cpf } = await req.json();
  const rawCpf = cpf.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('cpf', rawCpf)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({ exists: true })
}