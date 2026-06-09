import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { items, emails } = await req.json()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  const CATS: Record<string, string> = {
    fruta: '🥦 Fruta y verdura', carne: '🥩 Carne y pescado', lacteos: '🥛 Lácteos',
    panaderia: '🍞 Pan', despensa: '🥫 Despensa', limpieza: '🧹 Limpieza',
    bebidas: '🧃 Bebidas', otros: '📦 Otros',
  }

  // Group by category
  const grouped: Record<string, typeof items> = {}
  items.forEach((item: any) => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  const listHtml = Object.entries(grouped).map(([cat, catItems]: [string, any]) => `
    <div style="margin-bottom:16px">
      <div style="font-weight:700;color:#C2185B;font-size:14px;margin-bottom:8px">${CATS[cat] || cat}</div>
      ${catItems.map((i: any) => `
        <div style="padding:8px 12px;background:#FFF8F0;border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between">
          <span style="font-weight:600">${i.name}</span>
          <span style="color:#888">x${i.quantity}</span>
        </div>
      `).join('')}
    </div>
  `).join('')

  const html = `
    <div style="font-family:'Lato',sans-serif;max-width:500px;margin:0 auto;background:#FFF8F0;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#880E4F,#C2185B);padding:32px 24px;text-align:center">
        <h1 style="color:#fff;font-size:28px;margin:0">🛒 La Despensa del Amor</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Lista de la compra — ${new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</p>
      </div>
      <div style="padding:24px">
        <p style="color:#7A5A5A;margin-bottom:20px;font-size:14px">Hola 💕 Aquí tienes la lista de la compra de esta semana con <strong>${items.length} productos</strong>.</p>
        ${listHtml}
        <div style="background:#FCE4EC;border-radius:12px;padding:16px;margin-top:20px;text-align:center">
          <p style="color:#C2185B;font-weight:700;margin:0">¡A por la compra! 🎉</p>
        </div>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `La Despensa del Amor <${process.env.EMAIL_FROM}>`,
      to: (emails || process.env.EMAIL_TO || '').split(',').join(', '),
      subject: `🛒 Lista de la compra — ${items.length} productos`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
