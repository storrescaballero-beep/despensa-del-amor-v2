import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { menu } = await req.json()

  const ingredientesPorDia = menu.map((day: any) =>
    `${day.dia}: ${day.ingredientes.join(', ')}`
  ).join('\n')

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Eres un asistente de cocina experto. Tengo el siguiente menú semanal para 2 personas:

${ingredientesPorDia}

Tu tarea:
1. Agrupa ingredientes que se repiten durante la semana
2. Calcula la cantidad total necesaria para 2 personas para toda la semana
3. Usa unidades prácticas: gramos (g), kilos (kg), litros (l), unidades (ud), docena
4. Sé conservador para evitar desperdicios
5. Asigna la categoría correcta a cada ingrediente usando EXACTAMENTE estas opciones:
   - "fruta" → frutas, verduras, hortalizas, ensaladas
   - "carne" → carne, pollo, ternera, cerdo, cordero, pescado, marisco, huevos
   - "lacteos" → leche, yogur, queso, mantequilla, nata, crema
   - "panaderia" → pan, bollería, cereales, galletas
   - "despensa" → pasta, arroz, legumbres, conservas, aceite, especias, salsas, harinas
   - "bebidas" → agua, zumos, refrescos, vino, cerveza
   - "limpieza" → productos de limpieza, higiene
   - "otros" → cualquier otra cosa

Responde SOLO con JSON válido sin backticks ni explicaciones:
{
  "ingredientes": [
    {
      "nombre": "Pechuga de pollo",
      "cantidad": "600g",
      "categoria": "carne"
    }
  ]
}
`
      }]
    })

    const text = msg.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
