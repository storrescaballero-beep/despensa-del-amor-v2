import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROTEINAS = ['pollo','ternera','cerdo','pescado blanco','salmon','atun','huevos','legumbres','pavo','cordero']
const SNACKS_LIST = [
  'aceitunas variadas y chochos lupinos',
  'frutos secos mixtos y uvas',
  'hummus con palitos de zanahoria',
  'yogur griego con miel y nueces',
  'jamon iberico y queso manchego',
  'tosta con aguacate y tomate',
  'manzana con mantequilla de almendras',
  'pepino con tzatziki',
  'datiles con almendras',
  'platano con chocolate negro',
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function extractJSON(text: string): any {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(clean.substring(start, end + 1))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { rutinas, feedback } = body

  const nombreYo = rutinas?.nombre_yo || 'Sergio'
  const nombrePareja = rutinas?.nombre_pareja || 'Olivia'
  const proteinasOrden = shuffle(PROTEINAS).join(', ')
  const snacksSugeridos = shuffle(SNACKS_LIST).slice(0, 7).join(' | ')
  const seed = Math.floor(Math.random() * 10000)
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const diasFaciles = rutinas?.dias_faciles?.join(', ') || 'ninguno'
  const preferencias = rutinas?.preferencias || 'cocina espanola y mediterranea variada'
  const evitar = rutinas?.evitar || 'nada en especial'
  const diaCompra = rutinas?.dia_compra || 'sabado'
  const cocinero = rutinas?.cocinero || 'uno de los dos'
  const feedbackLinea = feedback ? 'FEEDBACK: ' + feedback : ''

  const prompt = `Eres nutricionista y chef espanol experto. Genera menu semanal UNICO (seed: ${seed}).

PERFIL:
- ${nombreYo}: 1.82m, 85kg, atletico. 2900 kcal/dia, 180g proteina/dia.
- ${nombrePareja}: 1.71m, 52kg, delgada atletica. 1900 kcal/dia, 110g proteina/dia.
- Quien cocina: ${cocinero}
- Dias faciles: ${diasFaciles}
- Preferencias: ${preferencias}
- Evitar: ${evitar}
- Dia compra: ${diaCompra}
${feedbackLinea}

REGLAS:
- DESAYUNO variado cada dia
- SNACK rotando: ${snacksSugeridos}
- Proteinas sin repetir: ${proteinasOrden}
- Dias faciles: max 25 min
- Raciones diferentes por persona
- Categorias: fruta, carne, lacteos, panaderia, despensa, bebidas, limpieza, otros

Responde UNICAMENTE con JSON valido, sin texto antes ni despues, sin backticks:
{"menu":[{"dia":"Lunes","tipo":"facil","nota":"nota carinosa","desayuno":{"plato":"descripcion","kcal":420,"proteinas":22,"carbos":48,"grasas":14},"comida":{"plato":"descripcion","kcal":680,"proteinas":48,"carbos":62,"grasas":22,"racion_yo":"200g pollo","racion_pareja":"130g pollo"},"snack":"snack descripcion","cena":{"plato":"descripcion","kcal":420,"proteinas":32,"carbos":35,"grasas":14,"racion_yo":"racion yo","racion_pareja":"racion pareja"},"ingredientes":[{"nombre":"Pechuga de pollo","cantidad_total":"330g","categoria":"carne"}]}],"generado_para":"fecha"}
Genera los 7 dias completos con la misma estructura.`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
    const text = msg.content.map((b: any) => b.text || '').join('')
    const parsed = extractJSON(text)
    if (!parsed.menu || !Array.isArray(parsed.menu)) throw new Error('Invalid menu structure')
    parsed.generado_para = 'Semana del ' + fechaHoy
    return NextResponse.json(parsed)
  } catch (e: any) {
    console.error('Menu error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}