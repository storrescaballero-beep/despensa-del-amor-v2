import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getHogarId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data } = await supabase.from('perfiles').select('hogar_id').eq('id', user.id).single()
  return data?.hogar_id || null
}

export async function GET(req: NextRequest) {
  // Sin auth para compatibilidad con componentes cliente
  const { data } = await supabase.from('rutinas').select('*').order('updated_at', { ascending: false }).limit(1).single()
  return NextResponse.json(data?.perfil || null)
}

export async function POST(req: NextRequest) {
  const perfil = await req.json()
  await supabase.from('rutinas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error } = await supabase.from('rutinas').insert({ perfil, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
