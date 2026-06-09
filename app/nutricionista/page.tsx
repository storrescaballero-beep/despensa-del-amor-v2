'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import styles from './nutricionista.module.css'

type Msg = { role: 'user' | 'assistant', content: string }

const SUGERENCIAS = [
  '¿Estoy comiendo suficiente proteína esta semana?',
  '¿Qué como antes de entrenar?',
  'Dame ideas de snacks altos en proteína',
  '¿Está equilibrado el menú de esta semana?',
  '¿Qué ceno si quiero perder algo de grasa?',
  '¿Cuánta agua debería beber al día?',
]

export default function NutricionPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rutinas, setRutinas] = useState<any>(null)
  const [menuActual, setMenuActual] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadContext()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadContext() {
    try {
      const res = await fetch('/api/rutinas')
      if (res.ok) { const data = await res.json(); setRutinas(data) }
    } catch {}
    try {
      const { data } = await supabase.from('menus').select('*').order('created_at', { ascending: false }).limit(1).single()
      if (data?.week_data) setMenuActual(data.week_data)
    } catch {}
  }

  async function sendMessage(texto?: string) {
    const content = (texto || input).trim()
    if (!content || loading) return

    const newMsg: Msg = { role: 'user', content }
    const newMessages = [...messages, newMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/nutricionista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, rutinas, menuActual })
      })
      const data = await res.json()
      if (data.respuesta) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.respuesta }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha habido un error. Intenta de nuevo.' }])
    }
    setLoading(false)
  }

  const nombreYo = rutinas?.nombre_yo || ''
  const nombrePareja = rutinas?.nombre_pareja || ''

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.avatar}>🥗</div>
          <div>
            <h1 className={styles.title}>Nuria</h1>
            <p className={styles.subtitle}>Tu nutricionista personal con IA</p>
          </div>
          <div className={styles.statusDot} />
        </div>
        {(nombreYo || nombrePareja) && (
          <p className={styles.contexto}>
            Conoce a {[nombreYo, nombrePareja].filter(Boolean).join(' y ')} • Menú de la semana cargado
          </p>
        )}
      </header>

      <main className={styles.main}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeEmoji}>👋</div>
              <p className={styles.welcomeText}>
                Hola{nombreYo ? `, ${nombreYo}` : ''}! Soy Nuria, tu nutricionista. Conozco vuestro menú de la semana y vuestros datos físicos. Pregúntame lo que quieras.
              </p>
            </div>
            <div className={styles.sugerenciasTitle}>Puedes preguntarme...</div>
            <div className={styles.sugerencias}>
              {SUGERENCIAS.map((s, i) => (
                <button key={i} className={styles.sugerencia} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
            {msg.role === 'assistant' && <div className={styles.bubbleAvatar}>🥗</div>}
            <div className={`${styles.bubbleContent} ${msg.role === 'user' ? styles.bubbleContentUser : styles.bubbleContentAssistant}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
            <div className={styles.bubbleAvatar}>🥗</div>
            <div className={`${styles.bubbleContent} ${styles.bubbleContentAssistant}`}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 100 }} />
      </main>

      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Pregúntale a Nuria..."
          disabled={loading}
        />
        <button className={`${styles.sendBtn} ${(!input.trim() || loading) ? styles.sendDisabled : ''}`} onClick={() => sendMessage()} disabled={!input.trim() || loading}>
          ➤
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
