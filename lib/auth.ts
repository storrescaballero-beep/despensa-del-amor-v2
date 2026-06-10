import { supabase } from './supabase'

export async function getPerfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('perfiles').select('*, hogares(*)').eq('id', user.id).single()
  return data
}

export async function getHogarId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('perfiles').select('hogar_id').eq('id', user.id).single()
  return data?.hogar_id || null
}

export async function crearHogar(nombreUsuario: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Crear hogar
  const { data: hogar, error: hogarError } = await supabase
    .from('hogares')
    .insert({ nombre: 'Nuestro hogar' })
    .select()
    .single()

  if (hogarError || !hogar) return null

  // Crear perfil vinculado al hogar
  await supabase.from('perfiles').upsert({
    id: user.id,
    hogar_id: hogar.id,
    nombre: nombreUsuario,
    email: user.email,
    rol: 'admin'
  })

  return hogar.id
}

export async function unirseAHogar(inviteCode: string, nombreUsuario: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Buscar hogar por código
  const { data: hogar } = await supabase
    .from('hogares')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (!hogar) return false

  // Crear perfil vinculado al hogar
  const { error } = await supabase.from('perfiles').upsert({
    id: user.id,
    hogar_id: hogar.id,
    nombre: nombreUsuario,
    email: user.email,
    rol: 'miembro'
  })

  return !error
}
