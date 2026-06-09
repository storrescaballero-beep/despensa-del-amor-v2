import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data } = await supabase.from('rutinas').select('*').order('updated_at', { ascending: false }).limit(1).single()
  return NextResponse.json(data?.perfil || null)
}

export async function POST(req: NextRequest) {
  const perfil = await req.json()
  // Upsert: delete old and insert new
  await supabase.from('rutinas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { data, error } = await supabase.from('rutinas').insert({ perfil, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
