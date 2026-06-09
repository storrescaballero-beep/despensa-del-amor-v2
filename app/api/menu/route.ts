import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROTEINAS = ['pollo','ternera','cerdo','pescado','salmon','atun','huevos','legumbres','pavo','cordero']
const SNACKS = ['aceitunas y chochos','frutos secos y uva','hummus con zanahoria','yogur griego con nueces','jamon y queso manchego','tosta de aguacate','manzana con almendras','pepino con tzatziki']

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function extractJSON(text: string): any {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const start = clean.indexOf('[')
  const end = clean.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')
  return JSON.parse(clean.substring(start, end + 1))
}

function buildPrompt(dias: string[], yo: string, pareja: string, proteinas: string, snacks: string, diasFaciles: string, prefs: string, evitar: string, fb: string, seed: number) {
  return `Nutricionista chef. Menu para ${dias.join(',')} seed${seed}.
${yo}:1.82m,85kg,atletico,2900kcal,180gprot. ${pareja}:1.71m,52kg,atletica,1900kcal,110gprot.
Dias faciles:${diasFaciles}. Prefs:${prefs}. Evitar:${evitar}. ${fb}
Proteinas sin repetir:${proteinas}. Snacks:${snacks}.
Desayuno diferente cada dia. Sabado y Domingo elaborado.

Responde SOLO con array JSON sin texto antes ni despues:
[{"dia":"${dias[0]}","tipo":"facil","nota":"frase corta carinosa","desayuno":{"plato":"nombre corto","kcal":400,"proteinas":20,"carbos":45,"grasas":12},"comida":{"plato":"nombre corto","kcal":650,"proteinas":45,"carbos":60,"grasas":20,"racion_yo":"200g+guarni","racion_pareja":"130g+guarni"},"snack":"snack corto","cena":{"plato":"nombre corto","kcal":400,"proteinas":30,"carbos":35,"grasas":12,"racion_yo":"racion","racion_pareja":"racion"},"ingredientes":[{"nombre":"Pollo","cantidad_total":"330g","categoria":"carne"},{"nombre":"Arroz","cantidad_total":"250g","categoria":"despensa"}]}]
Genera exactamente ${dias.length} dias con este formato. SIN texto fuera del array.`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { rutinas, feedback } = body

  const yo = rutinas?.nombre_yo || 'Sergio'
  const pareja = rutinas?.nombre_pareja || 'Olivia'
  const seed = Math.floor(Math.random() * 9999)
  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const proteinas = shuffle(PROTEINAS)
  const snacks = shuffle(SNACKS).slice(0, 7).join('|')
  const diasFaciles = rutinas?.dias_faciles?.join(',') || 'ninguno'
  const prefs = rutinas?.preferencias || 'cocina espanola'
  const evitar = rutinas?.evitar || 'nada'
  const fb = feedback ? 'APLICA: ' + feedback : ''

  const lote1 = ['Lunes', 'Martes', 'Miercoles', 'Jueves']
  const lote2 = ['Viernes', 'Sabado', 'Domingo']
  const prot1 = proteinas.slice(0, 5).join(',')
  const prot2 = proteinas.slice(5).join(',')

  try {
    const [r1, r2] = await Promise.all([
      client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: buildPrompt(lote1, yo, pareja, prot1, snacks, diasFaciles, prefs, evitar, fb, seed) }]
      }),
      client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(lote2, yo, pareja, prot2, snacks, diasFaciles, prefs, evitar, fb, seed + 1) }]
      })
    ])

    const text1 = r1.content.map((b: any) => b.text || '').join('')
    const text2 = r2.content.map((b: any) => b.text || '').join('')
    const dias1 = extractJSON(text1)
    const dias2 = extractJSON(text2)
    const fixDia = (d: string) => d.replace('Miercoles','Miércoles').replace('Sabado','Sábado')
    const allDias = [...dias1, ...dias2].map((d: any) => ({ ...d, dia: fixDia(d.dia) }))

    return NextResponse.json({ menu: allDias, generado_para: 'Semana del ' + fecha })
  } catch (e: any) {
    console.error('Menu error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}