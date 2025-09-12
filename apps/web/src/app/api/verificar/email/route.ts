import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { email } = await req.json()

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()

  if (error || !data) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({ exists: true })
}