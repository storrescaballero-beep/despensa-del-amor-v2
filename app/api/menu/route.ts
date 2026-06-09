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
  const feedbackLinea = feedback ? 'FEEDBACK DEL USUARIO (aplicar obligatoriamente): ' + feedback : ''

  const prompt = `Eres nutricionista y chef espanol experto. Genera un menu semanal UNICO y VARIADO (seed: ${seed}).

PERFIL:
- ${nombreYo}: hombre, 1.82m, 85kg, atletico. Necesita 2900 kcal/dia, 180g proteina/dia.
- ${nombrePareja}: mujer, 1.71m, 52kg, delgada atletica. Necesita 1900 kcal/dia, 110g proteina/dia.
- Quien cocina: ${cocinero}
- Dias faciles: ${diasFaciles}
- Preferencias: ${preferencias}
- Evitar: ${evitar}
- Dia compra: ${diaCompra}
${feedbackLinea}

REGLAS:
1. DESAYUNO variado cada dia (tostadas, avena, huevos, yogur granola, tortitas proteicas, bocadillo, batido)
2. COMIDA: plato principal con guarni cion
3. SNACK rotando: ${snacksSugeridos}
4. CENA mas ligera que comida
5. Proteinas sin repetir en este orden: ${proteinasOrden}
6. Dias faciles: max 25 min
7. Fines de semana: elaborado y especial
8. Raciones diferentes por persona
9. Ingredientes = suma ambas raciones con categoria correcta
10. Nota carinosa diferente cada dia

CATEGORIAS: fruta, carne, lacteos, panaderia, despensa, bebidas, limpieza, otros

Responde SOLO JSON valido sin backticks:
{
  "menu": [
    {
      "dia": "Lunes",
      "tipo": "facil",
      "nota": "nota carinosa",
      "desayuno": { "plato": "descripcion", "kcal": 420, "proteinas": 22, "carbos": 48, "grasas": 14 },
      "comida": { "plato": "descripcion", "kcal": 680, "proteinas": 48, "carbos": 62, "grasas": 22, "racion_yo": "200g pollo + 150g arroz", "racion_pareja": "130g pollo + 100g arroz" },
      "snack": "descripcion snack",
      "cena": { "plato": "descripcion", "kcal": 420, "proteinas": 32, "carbos": 35, "grasas": 14, "racion_yo": "racion sergio", "racion_pareja": "racion olivia" },
      "ingredientes": [{ "nombre": "Pechuga de pollo", "cantidad_total": "330g", "categoria": "carne" }]
    }
  ],
  "generado_para": "Semana del ${fechaHoy}"
}
7 dias completos Lunes a Domingo.`

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
    const text = msg.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}