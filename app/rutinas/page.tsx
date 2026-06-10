'use client'
import { useEffect, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import styles from './rutinas.module.css'

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const DEFAULT: any = {
  nombre_yo: '',
  nombre_pareja: '',
  cocinero: 'uno de los dos',
  dias_faciles: [],
  preferencias: 'Cocina española y mediterránea, variada',
  evitar: '',
  email_yo: '',
  email_pareja: '',
  dia_compra: 'Sábado',
  supermercado: 'mercadona',
}

function Field({ label, sub, children }: { label: string, sub?: string, children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {sub && <p className={styles.fieldSub}>{sub}</p>}
      {children}
    </div>
  )
}

export default function RutinasPage() {
  const [form, setForm] = useState(DEFAULT)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadRutinas() }, [])

  async function loadRutinas() {
    const res = await fetch('/api/rutinas')
    if (res.ok) { const data = await res.json(); if (data) setForm({ ...DEFAULT, ...data }) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  function toggleDia(dia: string) {
    setForm((prev: any) => ({
      ...prev,
      dias_faciles: prev.dias_faciles.includes(dia)
        ? prev.dias_faciles.filter((d: string) => d !== dia)
        : [...prev.dias_faciles, dia]
    }))
  }

  async function save() {
    setLoading(true)
    const res = await fetch('/api/rutinas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setSaved(true); showToast('✓ Rutinas guardadas') }
    else showToast('Error al guardar')
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vuestras <span>rutinas</span> ⚙️</h1>
        <p className={styles.subtitle}>La IA las usa para personalizar vuestros menús</p>
      </header>

      <main className={styles.main}>

        {/* NOMBRES */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>💑 Vuestros nombres</div>
          <Field label="Tu nombre">
            <input className={styles.input} type="text" value={form.nombre_yo}
              onChange={e=>setForm((prev: any) => ({...prev, nombre_yo: e.target.value}))}
              placeholder="Ej: Sergio" />
          </Field>
          <Field label="Nombre de tu pareja">
            <input className={styles.input} type="text" value={form.nombre_pareja}
              onChange={e=>setForm((prev: any) => ({...prev, nombre_pareja: e.target.value}))}
              placeholder="Ej: Olivia" />
          </Field>
        </div>

        {/* QUIÉN COCINA */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>👨‍🍳 Quién cocina</div>
          <div className={styles.optRow}>
            {[
              form.nombre_yo || 'Yo siempre',
              form.nombre_pareja || 'Mi pareja siempre',
              'Los dos por igual',
              'Depende del día'
            ].map((opt, i) => {
              const val = i === 0 ? (form.nombre_yo || 'Yo siempre')
                        : i === 1 ? (form.nombre_pareja || 'Mi pareja siempre')
                        : opt
              return (
                <button key={i} className={`${styles.optBtn} ${form.cocinero===val?styles.optActive:''}`}
                  onClick={()=>setForm((prev: any) => ({...prev, cocinero: val}))}>{val}</button>
              )
            })}
          </div>
        </div>

        {/* DÍAS FÁCILES */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>⚡ Días con menos tiempo</div>
          <p className={styles.cardSub}>La IA propondrá platos rápidos estos días</p>
          <div className={styles.diasGrid}>
            {DIAS.map(dia => (
              <button key={dia} className={`${styles.diaBtn} ${form.dias_faciles.includes(dia)?styles.diaActive:''}`}
                onClick={()=>toggleDia(dia)}>{dia}</button>
            ))}
          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className={styles.card}>
          <Field label="🍽️ Preferencias culinarias" sub="Tipos de cocina, ingredientes favoritos...">
            <textarea className={styles.textarea} value={form.preferencias}
              onChange={e=>setForm((prev: any) => ({...prev, preferencias: e.target.value}))}
              placeholder="Ej: Nos encanta la pasta, el pescado a la plancha..." rows={3} />
          </Field>
          <Field label="🚫 Qué evitar" sub="Alergias, cosas que no os gustan...">
            <textarea className={styles.textarea} value={form.evitar}
              onChange={e=>setForm((prev: any) => ({...prev, evitar: e.target.value}))}
              placeholder="Ej: No nos gusta el picante, alergia al marisco..." rows={2} />
          </Field>
        </div>

        {/* EMAIL */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>📧 Email para la lista de la compra</div>
          <Field label={`Email de ${form.nombre_yo || 'ti'}`}>
            <input className={styles.input} type="email" value={form.email_yo}
              onChange={e=>setForm((prev: any) => ({...prev, email_yo: e.target.value}))}
              placeholder="tu@email.com" />
          </Field>
          <Field label={`Email de ${form.nombre_pareja || 'tu pareja'}`}>
            <input className={styles.input} type="email" value={form.email_pareja}
              onChange={e=>setForm((prev: any) => ({...prev, email_pareja: e.target.value}))}
              placeholder="pareja@email.com" />
          </Field>
        </div>

        {/* DÍA COMPRA */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>🛒 Día habitual de compra</div>
          <div className={styles.optRow}>
            {['Lunes','Miércoles','Viernes','Sábado','Domingo'].map(d => (
              <button key={d} className={`${styles.optBtn} ${form.dia_compra===d?styles.optActive:''}`}
                onClick={()=>setForm((prev: any) => ({...prev, dia_compra: d}))}>{d}</button>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>🏪 Supermercado favorito</div>
          <div className={styles.optRow}>
            {['mercadona','carrefour','dia','alcampo','elcorteingles'].map((s, i) => {
              const labels = ['🟢 Mercadona','🔵 Carrefour','🔴 Día','🟡 Alcampo','🟤 El Corte Inglés']
              return <button key={s} className={`${styles.optBtn} ${form.supermercado===s?styles.optActive:''}`} onClick={()=>setForm((prev: any) => ({...prev, supermercado: s}))}>{labels[i]}</button>
            })}
          </div>
        </div>

        <button className={`${styles.saveBtn} ${loading?styles.loading:''}`} onClick={save} disabled={loading}>
          {loading ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar rutinas'}
        </button>

        {saved && (
          <div className={styles.savedNote}>
            🎉 ¡Perfecto! La próxima vez que generes un menú, la IA tendrá en cuenta todo esto.
          </div>
        )}

        <div style={{height:100}} />
      </main>

      {toast && <div className={styles.toast}>{toast}</div>}
      <BottomNav />
    </div>
  )
}
