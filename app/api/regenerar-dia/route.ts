import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { dia, menuActual, rutinas, instruccion } = body

  const nombreYo = rutinas?.nombre_yo || 'Sergio'
  const nombrePareja = rutinas?.nombre_pareja || 'Olivia'
  const preferencias = rutinas?.preferencias || 'cocina espanola y mediterranea'
  const evitar = rutinas?.evitar || 'nada'

  const otrosPlatos = Array.isArray(menuActual)
    ? menuActual
        .filter((d: any) => d.dia !== dia)
        .map((d: any) => d.dia + ': comida=' + (d.comida?.plato || '') + ', cena=' + (d.cena?.plato || ''))
        .join('\n')
    : ''

  const instruccionFinal = instruccion || 'Propón algo completamente diferente y variado'

  const prompt = `Eres nutricionista y chef. Regenera SOLO el dia ${dia}.

INSTRUCCION: ${instruccionFinal}

OTROS DIAS (no repetir proteinas):
${otrosPlatos}

DATOS:
- ${nombreYo}: 1.82m, 85kg, atletico, 2900 kcal/dia
- ${nombrePareja}: 1.71m, 52kg, atletica delgada, 1900 kcal/dia
- Preferencias: ${preferencias}
- Evitar: ${evitar}

Responde SOLO JSON sin backticks:
{
  "dia": "${dia}",
  "tipo": "facil",
  "nota": "nota carinosa",
  "desayuno": { "plato": "descripcion", "kcal": 400, "proteinas": 20, "carbos": 45, "grasas": 12 },
  "comida": { "plato": "descripcion", "kcal": 650, "proteinas": 45, "carbos": 60, "grasas": 20, "racion_yo": "racion ${nombreYo}", "racion_pareja": "racion ${nombrePareja}" },
  "snack": "snack con cantidad",
  "cena": { "plato": "descripcion", "kcal": 420, "proteinas": 30, "carbos": 35, "grasas": 14, "racion_yo": "racion ${nombreYo}", "racion_pareja": "racion ${nombrePareja}" },
  "ingredientes": [{ "nombre": "ingrediente", "cantidad_total": "cantidad", "categoria": "categoria" }]
}`

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
    const text = msg.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}