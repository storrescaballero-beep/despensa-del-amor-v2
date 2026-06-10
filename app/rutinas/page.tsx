'use client'
import { useEffect, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
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
  const [inviteCode, setInviteCode] = useState('')
  const router = useRouter()

  useEffect(() => { loadRutinas(); loadInviteCode() }, [])

  async function loadInviteCode() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: perfil } = await supabase.from('perfiles').select('hogar_id').eq('id', user.id).single()
    if (!perfil?.hogar_id) return
    const { data: hogar } = await supabase.from('hogares').select('invite_code').eq('id', perfil.hogar_id).single()
    if (hogar) setInviteCode(hogar.invite_code)
  }

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
    if (res.ok) { setSaved(true); showToast('✓ Guardado') }
    else showToast('Error al guardar')
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Ajustes <span>⚙️</span></h1>
            <p className={styles.subtitle}>Rutinas y preferencias del hogar</p>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </header>

      <main className={styles.main}>

        <div className={styles.card}>
          <div className={styles.cardTitle}>💑 Vuestros nombres</div>
          <Field label="Tu nombre">
            <input className={styles.input} type="text" value={form.nombre_yo}
              onChange={e=>setForm((prev: any) => ({...prev, nombre_yo: e.target.value}))} placeholder="Ej: Sergio" />
          </Field>
          <Field label="Nombre de tu pareja">
            <input className={styles.input} type="text" value={form.nombre_pareja}
              onChange={e=>setForm((prev: any) => ({...prev, nombre_pareja: e.target.value}))} placeholder="Ej: Olivia" />
          </Field>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>👨‍🍳 Quién cocina</div>
          <div className={styles.optRow}>
            {[form.nombre_yo || 'Yo siempre', form.nombre_pareja || 'Mi pareja siempre', 'Los dos por igual', 'Depende del día'].map((opt, i) => (
              <button key={i} className={`${styles.optBtn} ${form.cocinero===opt?styles.optActive:''}`}
                onClick={()=>setForm((prev: any) => ({...prev, cocinero: opt}))}>{opt}</button>
            ))}
          </div>
        </div>

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

        <div className={styles.card}>
          <Field label="🍽️ Preferencias culinarias" sub="Tipos de cocina, ingredientes favoritos...">
            <textarea className={styles.textarea} value={form.preferencias}
              onChange={e=>setForm((prev: any) => ({...prev, preferencias: e.target.value}))}
              placeholder="Ej: Nos encanta la pasta, el pescado a la plancha..." rows={3} />
          </Field>
          <Field label="🚫 Qué evitar" sub="Alergias, cosas que no os gustan...">
            <textarea className={styles.textarea} value={form.evitar}
              onChange={e=>setForm((prev: any) => ({...prev, evitar: e.target.value}))}
              placeholder="Ej: No nos gusta el picante..." rows={2} />
          </Field>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>📧 Emails</div>
          <Field label={`Email de ${form.nombre_yo || 'ti'}`}>
            <input className={styles.input} type="email" value={form.email_yo}
              onChange={e=>setForm((prev: any) => ({...prev, email_yo: e.target.value}))} placeholder="tu@email.com" />
          </Field>
          <Field label={`Email de ${form.nombre_pareja || 'tu pareja'}`}>
            <input className={styles.input} type="email" value={form.email_pareja}
              onChange={e=>setForm((prev: any) => ({...prev, email_pareja: e.target.value}))} placeholder="pareja@email.com" />
          </Field>
        </div>

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
            {[
              {id:'mercadona', label:'🟢 Mercadona'},
              {id:'carrefour', label:'🔵 Carrefour'},
              {id:'dia', label:'🔴 Día'},
              {id:'alcampo', label:'🟡 Alcampo'},
              {id:'elcorteingles', label:'🟤 El Corte Inglés'},
            ].map(s => (
              <button key={s.id} className={`${styles.optBtn} ${form.supermercado===s.id?styles.optActive:''}`}
                onClick={()=>setForm((prev: any) => ({...prev, supermercado: s.id}))}>{s.label}</button>
            ))}
          </div>
        </div>

        {inviteCode && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>🔗 Código de invitación</div>
            <p className={styles.cardSub}>Compártelo con tu pareja para que se una al hogar</p>
            <div className={styles.inviteCode}>{inviteCode}</div>
          </div>
        )}

        <button className={`${styles.saveBtn} ${loading?styles.loadingBtn:''}`} onClick={save} disabled={loading}>
          {loading ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar'}
        </button>

        <div style={{height:100}} />
      </main>

      {toast && <div className={styles.toast}>{toast}</div>}
      <BottomNav />
    </div>
  )
}
