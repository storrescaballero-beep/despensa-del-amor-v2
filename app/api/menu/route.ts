import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROTEINAS = ['pollo','ternera','cerdo','pescado blanco','salmón','atún','huevos','legumbres','pavo','cordero']
const SNACKS = [
  'aceitunas variadas y chochos lupinos',
  'frutos secos mixtos y uvas',
  'hummus con palitos de zanahoria',
  'yogur griego con miel y nueces',
  'jamón ibérico y queso manchego',
  'edamame con sal marina',
  'tosta con aguacate y tomate',
  'manzana con mantequilla de almendras',
  'pepino con tzatziki',
  'dátiles con almendras',
  'chips de garbanzos tostados',
  'plátano con chocolate negro',
]

function shuffle(arr: string[]) {
  return arr.sort(() => Math.random() - 0.5)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { rutinas, feedback } = body

  const nombreYo = rutinas?.nombre_yo || 'Sergio'
  const nombrePareja = rutinas?.nombre_pareja || 'Olivia'

  const proteinasOrden = shuffle([...PROTEINAS]).join(', ')
  const snacksSugeridos = shuffle([...SNACKS]).slice(0, 7).join(' | ')
  const seed = Math.floor(Math.random() * 10000)

  const rutinaCtx = `
Datos de ${nombreYo}: 1,82m, 85kg, complexión atlética. Objetivo: ~2900 kcal/día, ~180g proteína/día.
Datos de ${nombrePareja}: 1,71m, 52kg, complexión delgada y atlética. Objetivo: ~1900 kcal/día, ~110g proteína/día.
Quién cocina: ${rutinas?.cocinero || 'uno de los dos'}
Días con menos tiempo: ${rutinas?.dias_faciles?.join(', ') || 'ninguno'}
Preferencias culinarias: ${rutinas?.preferencias || 'cocina española y mediterránea variada'}
Evitar: ${rutinas?.evitar || 'nada en especial'}
Día de compra habitual: ${rutinas?.dia_compra || 'sábado'}
`

  const feedbackCtx = feedback ? `\nFEEDBACK DEL USUARIO: ${feedback}\nAdapta el menú teniendo en cuenta este feedback.` : ''

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Eres nutricionista y chef español experto. Genera un menú semanal ÚNICO y VARIADO (seed: ${seed}).

PERFIL DE LA PAREJA:
${rutinaCtx}
${feedbackCtx}

REGLAS ESTRICTAS:
1. DESAYUNO cada día: variado (tostadas, avena, huevos revueltos, yogur con granola, tortitas proteicas, bocadillo, batido proteico...)
2. COMIDA: plato principal completo con guarnición
3. SNACK de tarde: usa estos como inspiración rotando cada día: ${snacksSugeridos}
4. CENA: más ligera que la comida
5. Proteína principal en este orden (no repetir hasta completar la lista): ${proteinasOrden}
6. Días fáciles: máximo 25 minutos de preparación
7. Fines de semana: recetas más elaboradas y especiales
8. Raciones DIFERENTES para cada persona según sus datos físicos
9. Ingredientes = suma de ambas raciones, con categoría correcta
10. Nota cariñosa y diferente cada día

CATEGORÍAS para ingredientes (usa EXACTAMENTE estas):
- fruta → frutas, verduras, hortalizas
- carne → carne, pollo, pescado, huevos, marisco
- lacteos → leche, yogur, queso, mantequilla, nata
- panaderia → pan, bollería, cereales
- despensa → pasta, arroz, legumbres, conservas, aceite, especias
- bebidas → agua, zumos, refrescos
- otros → cualquier otra cosa

Responde SOLO con JSON válido, sin backticks, sin texto extra:
{
  "menu": [
    {
      "dia": "Lunes",
      "tipo": "facil",
      "nota": "nota cariñosa única",
      "desayuno": {
        "plato": "descripción detallada del desayuno",
        "kcal": 420,
        "proteinas": 22,
        "carbos": 48,
        "grasas": 14
      },
      "comida": {
        "plato": "nombre y descripción del plato",
        "kcal": 680,
        "proteinas": 48,
        "carbos": 62,
        "grasas": 22,
        "racion_yo": "200g pollo + 150g arroz + ensalada",
        "racion_pareja": "130g pollo + 100g arroz + ensalada"
      },
      "snack": "descripción del snack con cantidad aproximada",
      "cena": {
        "plato": "nombre y descripción",
        "kcal": 420,
        "proteinas": 32,
        "carbos": 35,
        "grasas": 14,
        "racion_yo": "descripción ración Sergio",
        "racion_pareja": "descripción ración Olivia"
      },
      "ingredientes": [
        {
          "nombre": "Pechuga de pollo",
          "cantidad_total": "330g",
          "categoria": "carne"
        }
      ]
    }
  ],
  "generado_para": "Semana del ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}"
}
Genera los 7 días completos (Lunes a Domingo).`
      }]
    })

    const text = msg.content.map((b: any) => b.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
