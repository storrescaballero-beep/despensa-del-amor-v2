import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { dia, menuActual, rutinas, instruccion } = body

  const nombreYo = rutinas?.nombre_yo || 'Sergio'
  const nombrePareja = rutinas?.nombre_pareja || 'Persona 2'

  const otrosPlatos = (menuActual || [])
    .filter((d: any) => d.dia !== dia)
    .map((d: any) => `${d.dia}: comida=${d.comida?.plato || ''}, cena=${d.cena?.plato || ''}`)
    .join('\n')

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres nutricionista y chef. Regenera SOLO el día ${dia} del menú semanal.

INSTRUCCIÓN: ${instruccion || 'Propón algo completamente diferente y variado'}

OTROS DÍAS YA ASIGNADOS (no repetir proteínas principales):
${otrosPlatos}

DATOS PAREJA:
- ${nombreYo}: 1,82m, 85kg, atlético, necesita ~2900 kcal/día, ~180g proteína
- ${nombrePareja}: 1,71m, 52kg, atlética delgada, necesita ~1900 kcal/día, ~110g proteína
- Preferencias: ${rutinas?.preferencias || 'cocina española y mediterránea'}
- Evitar: ${rutinas?.evitar || 'nada'}

Responde SOLO con JSON válido sin backticks ni texto extra:
{
  "dia": "${dia}",
  "tipo": "facil",
  "nota": "nota cariñosa diferente",
  "desayuno": { "plato": "descripción desayuno", "kcal": 400, "proteinas": 20, "carbos": 45, "grasas": 12 },
  "comida": { "plato": "nombre plato", "kcal": 650, "proteinas": 45, "carbos": 60, "grasas": 20, "racion_yo": "ración ${nombreYo}", "racion_pareja": "ración ${nombrePareja}" },
  "snack": "snack apetecible con cantidad",
  "cena": { "plato": "nombre plato", "kcal": 420, "proteinas": 30, "carbos": 35, "grasas": 14, "racion_yo": "ración ${nombreYo}", "racion_pareja": "ración ${nombrePareja}" },
  "ingredientes": [{ "nombre": "ingrediente", "cantidad_total": "cantidad", "categoria": "categoria" }]
}`
      }]
    })

    const text = msg.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
