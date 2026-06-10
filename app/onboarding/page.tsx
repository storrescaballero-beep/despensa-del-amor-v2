'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { crearHogar, unirseAHogar, getPerfil } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import styles from './onboarding.module.css'

export default function OnboardingPage() {
  const [step, setStep] = useState<'check' | 'nombre' | 'elegir' | 'codigo' | 'listo'>('check')
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Si ya tiene perfil con hogar, ir directo
    const perfil = await getPerfil()
    if (perfil?.hogar_id) { router.push('/lista'); return }

    // Si tiene nombre en metadata (Google OAuth)
    const nombreMeta = user.user_metadata?.nombre || user.user_metadata?.full_name || ''
    if (nombreMeta) setNombre(nombreMeta)

    setStep('nombre')
  }

  async function handleNombre() {
    if (!nombre.trim()) { setError('Pon tu nombre'); return }
    setError('')
    setStep('elegir')
  }

  async function handleCrearHogar() {
    setLoading(true)
    const hogarId = await crearHogar(nombre)
    if (!hogarId) { setError('Error creando el hogar'); setLoading(false); return }

    // Obtener el código de invitación
    const { data } = await supabase.from('hogares').select('invite_code').eq('id', hogarId).single()
    setInviteCode(data?.invite_code || '')
    setStep('listo')
    setLoading(false)
  }

  async function handleUnirse() {
    if (!codigo.trim()) { setError('Pon el código de invitación'); return }
    setLoading(true)
    const ok = await unirseAHogar(codigo, nombre)
    if (!ok) { setError('Código incorrecto, pídele el código a tu pareja'); setLoading(false); return }
    router.push('/lista')
    setLoading(false)
  }

  if (step === 'check') return (
    <div className={styles.page}><div className={styles.loading}><div className={styles.spinner} /></div></div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEmoji}>🛒</div>
        <h1 className={styles.heroTitle}>La Despensa <span>del Amor</span></h1>
      </div>

      <div className={styles.card}>
        {step === 'nombre' && (
          <>
            <h2 className={styles.cardTitle}>¿Cómo te llamas?</h2>
            <p className={styles.cardSub}>Así sabremos quién añade cada producto</p>
            <input className={styles.input} type="text" placeholder="Tu nombre" value={nombre}
              onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNombre()} autoFocus />
            {error && <div className={styles.error}>{error}</div>}
            <button className={styles.btn} onClick={handleNombre}>Continuar →</button>
          </>
        )}

        {step === 'elegir' && (
          <>
            <h2 className={styles.cardTitle}>Hola, {nombre} 👋</h2>
            <p className={styles.cardSub}>¿Eres el primero en registrarte o tu pareja ya tiene cuenta?</p>
            <button className={styles.optionBtn} onClick={handleCrearHogar} disabled={loading}>
              <span className={styles.optionEmoji}>🏠</span>
              <div>
                <div className={styles.optionTitle}>Soy el primero</div>
                <div className={styles.optionSub}>Crear un hogar nuevo e invitar a mi pareja</div>
              </div>
            </button>
            <button className={styles.optionBtn} onClick={() => setStep('codigo')}>
              <span className={styles.optionEmoji}>🔗</span>
              <div>
                <div className={styles.optionTitle}>Mi pareja ya tiene cuenta</div>
                <div className={styles.optionSub}>Unirme con el código de invitación</div>
              </div>
            </button>
          </>
        )}

        {step === 'codigo' && (
          <>
            <h2 className={styles.cardTitle}>Código de invitación</h2>
            <p className={styles.cardSub}>Pídele a tu pareja el código que aparece en su app</p>
            <input className={styles.input} type="text" placeholder="Ej: ABC12345" value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleUnirse()}
              autoFocus style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }} />
            {error && <div className={styles.error}>{error}</div>}
            <button className={`${styles.btn} ${loading ? styles.loading : ''}`} onClick={handleUnirse} disabled={loading}>
              {loading ? '...' : 'Unirme al hogar'}
            </button>
            <button className={styles.backBtn} onClick={() => { setStep('elegir'); setError('') }}>← Volver</button>
          </>
        )}

        {step === 'listo' && (
          <>
            <div className={styles.listoEmoji}>🎉</div>
            <h2 className={styles.cardTitle}>¡Hogar creado!</h2>
            <p className={styles.cardSub}>Comparte este código con tu pareja para que se una</p>
            <div className={styles.codeBox}>{inviteCode}</div>
            <p className={styles.codeHint}>Tu pareja lo necesita al registrarse</p>
            <button className={styles.btn} onClick={() => router.push('/lista')}>
              Ir a la app →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
