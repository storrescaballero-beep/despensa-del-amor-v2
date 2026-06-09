import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { messages, rutinas, menuActual } = body

  const nombreYo = rutinas?.nombre_yo || 'Sergio'
  const nombrePareja = rutinas?.nombre_pareja || 'Olivia'

  const menuResumen = menuActual?.menu
    ? menuActual.menu.map((d: any) =>
        `${d.dia}: desayuno=${d.desayuno?.plato || '?'}, comida=${d.comida?.plato || '?'}, cena=${d.cena?.plato || '?'}`
      ).join('\n')
    : 'No hay menú generado esta semana'

  const systemPrompt = `Eres una nutricionista experta, cercana y empática llamada "Nuria". Conoces perfectamente a esta pareja:

${nombreYo}: hombre, 1,82m, 85kg, complexión atlética. Objetivo: mantener músculo y rendimiento deportivo. Necesita ~2900 kcal/día, ~180g proteína/día.
${nombrePareja}: mujer, 1,71m, 52kg, complexión delgada y atlética. Objetivo: mantener peso y energía. Necesita ~1900 kcal/día, ~110g proteína/día.
Preferencias: ${rutinas?.preferencias || 'cocina española y mediterránea'}
Evitar: ${rutinas?.evitar || 'nada en especial'}

MENÚ DE ESTA SEMANA:
${menuResumen}

CÓMO RESPONDER:
- Sé cercana, usa sus nombres, da consejos prácticos y concretos
- Si preguntan sobre un plato del menú, responde con ese contexto
- Da cantidades específicas cuando sea relevante
- Máximo 3-4 frases por respuesta, directo al grano
- Puedes sugerir ajustes al menú si lo ves necesario
- Si preguntan sobre suplementos, sé honesta y basada en evidencia`

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
    })

    const text = msg.content.map((b: any) => b.text || '').join('')
    return NextResponse.json({ respuesta: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
