'use client'
import { useEffect, useState } from 'react'
import { supabase, type WeekMenu, type MenuDay } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import styles from './menu.module.css'

const EMOJIS = ['🌙','🌟','🍀','⚡','🎉','🌹','☀️']
const TIPO_COLORS: Record<string, string> = { facil: '#0288D1', elaborado: '#C2185B' }
const TIPO_LABELS: Record<string, string> = { facil: '⚡ Rápido', elaborado: '👨‍🍳 Elaborado' }

function MacroBadge({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className={styles.macroBadge} style={{ borderColor: color + '44', background: color + '11' }}>
      <span className={styles.macroVal} style={{ color }}>{value}{unit}</span>
      <span className={styles.macroLabel}>{label}</span>
    </div>
  )
}

export default function MenuPage() {
  const [menu, setMenu] = useState<WeekMenu | null>(null)
  const [loading, setLoading] = useState(false)
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null)
  const [addedDays, setAddedDays] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const [rutinas, setRutinas] = useState<any>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [instruccionDia, setInstruccionDia] = useState<Record<number, string>>({})
  const [showInstruccion, setShowInstruccion] = useState<number | null>(null)

  useEffect(() => {
    loadSavedMenu()
    loadRutinas()
  }, [])

  async function loadSavedMenu() {
    try {
      const { data } = await supabase.from('menus').select('*').order('created_at', { ascending: false }).limit(1).single()
      if (data?.week_data) setMenu(data.week_data as WeekMenu)
    } catch {}
  }

  async function loadRutinas() {
    try {
      const res = await fetch('/api/rutinas')
      if (res.ok) { const data = await res.json(); setRutinas(data) }
    } catch {}
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2800) }

  async function generateMenu() {
    setLoading(true)
    setAddedDays([])
    setExpandedDay(0)
    setShowFeedback(false)
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rutinas, feedback: feedback || undefined })
      })
      const data = await res.json()
      if (data.menu) {
        setMenu(data)
        setFeedback('')
        await supabase.from('menus').insert({ week_data: data })
        showToast('✓ Menú generado')
      } else {
        showToast('Error generando menú, intenta de nuevo')
      }
    } catch {
      showToast('Error de conexión')
    }
    setLoading(false)
  }

  async function regenerarDia(idx: number, dia: string) {
    setRegeneratingDay(dia)
    try {
      const instruccion = instruccionDia[idx] || ''
      const res = await fetch('/api/regenerar-dia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia, menuActual: menu?.menu || [], rutinas, instruccion })
      })
      const newDay = await res.json()
      if (newDay.dia && menu) {
        const newMenu = {
          ...menu,
          menu: menu.menu.map((d, i) => i === idx ? newDay : d)
        }
        setMenu(newMenu)
        await supabase.from('menus').insert({ week_data: newMenu })
        setShowInstruccion(null)
        setInstruccionDia(prev => { const n = {...prev}; delete n[idx]; return n })
        showToast(`✓ ${dia} regenerado`)
      }
    } catch {
      showToast('Error regenerando día')
    }
    setRegeneratingDay(null)
  }

  async function addDayToList(dayIdx: number, day: MenuDay) {
    if (!day.ingredientes?.length) { showToast('Sin ingredientes'); return }
    const { data: existing } = await supabase.from('items').select('name')
    const existingNames = new Set((existing || []).map((i: any) => i.name.toLowerCase()))
    const toAdd = day.ingredientes.filter((ing: any) => !existingNames.has(ing.nombre.toLowerCase()))
    if (!toAdd.length) { showToast('Ya están todos en la lista 👍'); return }
    await supabase.from('items').insert(toAdd.map((ing: any) => ({
      name: `${ing.nombre} — ${ing.cantidad_total}`,
      category: ing.categoria || 'despensa',
      quantity: 1, done: false, added_by: 'menu'
    })))
    setAddedDays(prev => prev.includes(dayIdx) ? prev : [...prev, dayIdx])
    showToast(`✓ ${toAdd.length} ingredientes añadidos`)
  }

  async function addAllToList() {
    if (!menu) return
    const { data: existing } = await supabase.from('items').select('name')
    const existingNames = new Set((existing || []).map((i: any) => i.name.toLowerCase()))
    const seen = new Set<string>()
    const allIngs: any[] = []
    menu.menu.forEach(day => {
      ;(day.ingredientes || []).forEach((ing: any) => {
        const key = ing.nombre.toLowerCase()
        if (!seen.has(key) && !existingNames.has(key)) { seen.add(key); allIngs.push(ing) }
      })
    })
    if (!allIngs.length) { showToast('Todo ya está en la lista'); return }
    await supabase.from('items').insert(allIngs.map((ing: any) => ({
      name: `${ing.nombre} — ${ing.cantidad_total}`,
      category: ing.categoria || 'despensa',
      quantity: 1, done: false, added_by: 'menu'
    })))
    setAddedDays([0,1,2,3,4,5,6])
    showToast(`✓ ${allIngs.length} productos añadidos`)
  }

  async function sendEmail() {
    const { data: items } = await supabase.from('items').select('*').eq('done', false)
    if (!items?.length) { showToast('No hay productos en la lista'); return }
    const emails = rutinas?.email_yo ? [rutinas.email_yo, rutinas.email_pareja].filter(Boolean).join(',') : ''
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, emails })
    })
    if (res.ok) showToast('📧 Lista enviada')
    else showToast('Error al enviar')
  }

  const nombreYo = rutinas?.nombre_yo || 'Tú'
  const nombrePareja = rutinas?.nombre_pareja || 'Tu pareja'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Menú <span>semanal</span> 🍽️</h1>
        <p className={styles.subtitle}>{rutinas?.nombre_yo ? `Para ${nombreYo} y ${nombrePareja}` : 'Generado con IA'}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.heroCard}>
          <button className={`${styles.genBtn} ${loading ? styles.loading : ''}`} onClick={generateMenu} disabled={loading}>
            {loading ? '⏳ Calculando menú y nutrición...' : menu ? '🔄 Nuevo menú semanal' : '✨ Generar menú semanal'}
          </button>

          <button className={styles.feedbackToggle} onClick={() => setShowFeedback(!showFeedback)}>
            {showFeedback ? '✕ Cancelar' : '💬 Dile algo a la IA antes de generar'}
          </button>

          {showFeedback && (
            <div className={styles.feedbackBox}>
              <textarea
                className={styles.feedbackInput}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Ej: Esta semana quiero más pescado, menos pasta, y algo especial el sábado..."
                rows={3}
              />
            </div>
          )}

          {menu && (
            <div className={styles.actionRow}>
              <button className={styles.addAllBtn} onClick={addAllToList}>🛒 Todo a la lista</button>
              <button className={styles.emailBtn} onClick={sendEmail}>📧 Email</button>
            </div>
          )}
          {menu?.generado_para && <div className={styles.weekLabel}>📅 {menu.generado_para}</div>}
        </div>

        {!menu && !loading && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍳</div>
            <p className={styles.emptyTitle}>Sin menú todavía</p>
            <p className={styles.emptySub}>Pulsa el botón para empezar</p>
          </div>
        )}

        {loading && (
          <div className={styles.loadingCards}>
            {['Calculando necesidades nutricionales...','Diseñando menú variado...','Ajustando raciones personalizadas...','Añadiendo snacks y detalles...'].map((t, i) => (
              <div key={i} className={styles.loadingLine} style={{ animationDelay: `${i * 0.5}s` }}>
                <div className={styles.loadingDot} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}

        {menu && !loading && menu.menu.map((day, idx) => {
          const isExpanded = expandedDay === idx
          const isRegenerating = regeneratingDay === day.dia
          const totalKcal = (day.desayuno?.kcal || 0) + (day.comida?.kcal || 0) + (day.cena?.kcal || 0)
          const totalProt = (day.desayuno?.proteinas || 0) + (day.comida?.proteinas || 0) + (day.cena?.proteinas || 0)

          return (
            <div key={idx} className={`${styles.dayCard} ${isRegenerating ? styles.regenerating : ''}`}>
              <div className={styles.dayHeader} onClick={() => setExpandedDay(isExpanded ? null : idx)}>
                <span className={styles.dayEmoji}>{isRegenerating ? '⏳' : EMOJIS[idx]}</span>
                <div className={styles.dayInfo}>
                  <span className={styles.dayName}>{day.dia}</span>
                  {day.tipo && <span className={styles.tipoTag} style={{ background: TIPO_COLORS[day.tipo] + '22', color: TIPO_COLORS[day.tipo] }}>{TIPO_LABELS[day.tipo]}</span>}
                </div>
                <div className={styles.daySummary}>
                  <span className={styles.kcalBadge}>🔥 {totalKcal}</span>
                  <span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && !isRegenerating && (
                <div className={styles.dayBody}>
                  {day.nota && <div className={styles.nota}>💕 {day.nota}</div>}

                  <div className={styles.mealBlock}>
                    <div className={styles.mealTitle}>☀️ Desayuno</div>
                    <div className={styles.mealPlato}>{day.desayuno?.plato}</div>
                    <div className={styles.macrosRow}>
                      <MacroBadge label="kcal" value={day.desayuno?.kcal || 0} unit="" color="#F57C00" />
                      <MacroBadge label="prot" value={day.desayuno?.proteinas || 0} unit="g" color="#C2185B" />
                      <MacroBadge label="carbos" value={day.desayuno?.carbos || 0} unit="g" color="#0288D1" />
                      <MacroBadge label="grasas" value={day.desayuno?.grasas || 0} unit="g" color="#7B1FA2" />
                    </div>
                  </div>

                  <div className={styles.mealBlock}>
                    <div className={styles.mealTitle}>🌞 Comida</div>
                    <div className={styles.mealPlato}>{day.comida?.plato}</div>
                    <div className={styles.macrosRow}>
                      <MacroBadge label="kcal" value={day.comida?.kcal || 0} unit="" color="#F57C00" />
                      <MacroBadge label="prot" value={day.comida?.proteinas || 0} unit="g" color="#C2185B" />
                      <MacroBadge label="carbos" value={day.comida?.carbos || 0} unit="g" color="#0288D1" />
                      <MacroBadge label="grasas" value={day.comida?.grasas || 0} unit="g" color="#7B1FA2" />
                    </div>
                    {(day.comida?.racion_yo || day.comida?.racion_pareja) && (
                      <div className={styles.raciones}>
                        <div className={styles.racion}><span className={styles.racionNombre}>{nombreYo}</span><span className={styles.racionVal}>{day.comida?.racion_yo}</span></div>
                        <div className={styles.racion}><span className={styles.racionNombre}>{nombrePareja}</span><span className={styles.racionVal}>{day.comida?.racion_pareja}</span></div>
                      </div>
                    )}
                  </div>

                  {day.snack && (
                    <div className={styles.snackBlock}>
                      <span className={styles.snackIcon}>🍿</span>
                      <span className={styles.snackText}><strong>Snack:</strong> {day.snack}</span>
                    </div>
                  )}

                  <div className={styles.mealBlock}>
                    <div className={styles.mealTitle}>🌙 Cena</div>
                    <div className={styles.mealPlato}>{day.cena?.plato}</div>
                    <div className={styles.macrosRow}>
                      <MacroBadge label="kcal" value={day.cena?.kcal || 0} unit="" color="#F57C00" />
                      <MacroBadge label="prot" value={day.cena?.proteinas || 0} unit="g" color="#C2185B" />
                      <MacroBadge label="carbos" value={day.cena?.carbos || 0} unit="g" color="#0288D1" />
                      <MacroBadge label="grasas" value={day.cena?.grasas || 0} unit="g" color="#7B1FA2" />
                    </div>
                    {(day.cena?.racion_yo || day.cena?.racion_pareja) && (
                      <div className={styles.raciones}>
                        <div className={styles.racion}><span className={styles.racionNombre}>{nombreYo}</span><span className={styles.racionVal}>{day.cena?.racion_yo}</span></div>
                        <div className={styles.racion}><span className={styles.racionNombre}>{nombrePareja}</span><span className={styles.racionVal}>{day.cena?.racion_pareja}</span></div>
                      </div>
                    )}
                  </div>

                  <div className={styles.dayTotal}>
                    <span className={styles.dayTotalTitle}>Total del día</span>
                    <div className={styles.macrosRow}>
                      <MacroBadge label="kcal" value={totalKcal} unit="" color="#F57C00" />
                      <MacroBadge label="proteína" value={totalProt} unit="g" color="#C2185B" />
                    </div>
                  </div>

                  {day.ingredientes?.length > 0 && (
                    <div className={styles.ingsBlock}>
                      <div className={styles.ingsTitle}>🛒 Ingredientes del día</div>
                      <div className={styles.ings}>
                        {day.ingredientes.map((ing: any, i: number) => (
                          <span key={i} className={styles.ingChip}>{ing.nombre} <strong>{ing.cantidad_total}</strong></span>
                        ))}
                      </div>
                      <button className={`${styles.addDayBtn} ${addedDays.includes(idx) ? styles.added : ''}`} onClick={() => addDayToList(idx, day)}>
                        {addedDays.includes(idx) ? '✓ Añadido a la lista' : '+ Añadir a la lista'}
                      </button>
                    </div>
                  )}

                  <div className={styles.regenerateSection}>
                    {showInstruccion === idx ? (
                      <div className={styles.instruccionBox}>
                        <textarea
                          className={styles.instruccionInput}
                          value={instruccionDia[idx] || ''}
                          onChange={e => setInstruccionDia(prev => ({ ...prev, [idx]: e.target.value }))}
                          placeholder="Ej: Quiero algo con pescado, o más ligero, o sin gluten..."
                          rows={2}
                        />
                        <div className={styles.instruccionBtns}>
                          <button className={styles.regenConfirmBtn} onClick={() => regenerarDia(idx, day.dia)}>
                            🔄 Regenerar este día
                          </button>
                          <button className={styles.regenCancelBtn} onClick={() => setShowInstruccion(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className={styles.regenBtn} onClick={() => setShowInstruccion(idx)}>
                        😕 No me convence este día
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isExpanded && isRegenerating && (
                <div className={styles.regenLoading}>
                  <div className={styles.loadingDot} />
                  <span>Regenerando {day.dia}...</span>
                </div>
              )}
            </div>
          )
        })}

        <div style={{ height: 100 }} />
      </main>

      {toast && <div className={styles.toast}>{toast}</div>}
      <BottomNav />
    </div>
  )
}
