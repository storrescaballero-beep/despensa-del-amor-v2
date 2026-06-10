'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setError('')
    setMensaje('')
    if (!email || !password) { setError('Rellena todos los campos'); return }
    if (mode === 'registro' && !nombre) { setError('Pon tu nombre'); return }
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email o contraseña incorrectos'); setLoading(false); return }
      router.push('/onboarding')
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nombre } }
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMensaje('✓ Revisa tu email para confirmar tu cuenta')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroEmoji}>🛒</div>
        <h1 className={styles.heroTitle}>La Despensa<br /><span>del Amor</span></h1>
        <p className={styles.heroSub}>La app de la compra para los dos</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode==='login'?styles.tabActive:''}`} onClick={()=>{setMode('login');setError('')}}>Entrar</button>
          <button className={`${styles.tab} ${mode==='registro'?styles.tabActive:''}`} onClick={()=>{setMode('registro');setError('')}}>Registrarse</button>
        </div>

        {mode === 'registro' && (
          <input className={styles.input} type="text" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} />
        )}
        <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
        <input className={styles.input} type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />

        {error && <div className={styles.error}>{error}</div>}
        {mensaje && <div className={styles.success}>{mensaje}</div>}

        <button className={`${styles.btn} ${loading?styles.loading:''}`} onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : mode==='login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <div className={styles.divider}><span>o</span></div>

        <button className={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>
      </div>
    </div>
  )
}
