import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Item = {
  id: string
  name: string
  category: string
  quantity: number
  done: boolean
  added_by: string
  created_at: string
}

export type Macros = {
  kcal: number
  proteinas: number
  carbos: number
  grasas: number
}

export type Comida = Macros & {
  plato: string
  racion_yo?: string
  racion_pareja?: string
}

export type Ingrediente = {
  nombre: string
  cantidad_total: string
  categoria: string
}

export type MenuDay = {
  dia: string
  tipo: 'facil' | 'elaborado'
  nota?: string
  desayuno: Macros & { plato: string }
  comida: Comida
  snack: string
  cena: Comida
  ingredientes: Ingrediente[]
}

export type WeekMenu = {
  menu: MenuDay[]
  generado_para: string
}

export type Rutinas = {
  nombre_yo: string
  nombre_pareja: string
  cocinero: string
  dias_faciles: string[]
  preferencias: string
  evitar: string
  email_yo: string
  email_pareja: string
  dia_compra: string
}
