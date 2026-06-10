'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import styles from './compra.module.css'

const CATS: Record<string, { emoji: string, label: string, color: string }> = {
  fruta:     { emoji: '🥦', label: 'Fruta y verdura', color: '#2E7D32' },
  carne:     { emoji: '🥩', label: 'Carne y pescado',  color: '#C2185B' },
  lacteos:   { emoji: '🥛', label: 'Lácteos',           color: '#F57C00' },
  panaderia: { emoji: '🍞', label: 'Pan',               color: '#795548' },
  despensa:  { emoji: '🥫', label: 'Despensa',           color: '#0288D1' },
  limpieza:  { emoji: '🧹', label: 'Limpieza',           color: '#7B1FA2' },
  bebidas:   { emoji: '🧃', label: 'Bebidas',            color: '#0097A7' },
  otros:     { emoji: '📦', label: 'Otros',              color: '#607D8B' },
}

const SUPERMERCADOS = [
  { id: 'mercadona',     nombre: 'Mercadona',         logo: '🟢', color: '#00A650' },
  { id: 'carrefour',     nombre: 'Carrefour',         logo: '🔵', color: '#004A97' },
  { id: 'dia',           nombre: 'Día',               logo: '🔴', color: '#E30613' },
  { id: 'alcampo',       nombre: 'Alcampo',           logo: '🟡', color: '#F5A800' },
  { id: 'elcorteingles', nombre: 'El Corte Inglés',   logo: '🟤', color: '#006633' },
]

const SEARCH_URLS: Record<string, string> = {
  mercadona:     'https://tienda.mercadona.es/search-results?query=',
  carrefour:     'https://www.carrefour.es/search?q=',
  dia:           'https://www.dia.es/search?q=',
  alcampo:       'https://www.alcampo.es/compra-online/search?q=',
  elcorteingles: 'https://www.elcorteingles.es/supermercado/search?term=',
}

export default function CompraPage() {
  const [items, setItems] = useState<any[]>([])
  const [superId, setSuperId] = useState('mercadona')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [rutinas, setRutinas] = useState<any>(null)

  useEffect(() => {
    loadItems()
    loadRutinas()
  }, [])

  async function loadItems() {
    const { data } = await supabase.from('items').select('*').eq('done', false).order('category')
    if (data) setItems(data)
  }

  async function loadRutinas() {
    const res = await fetch('/api/rutinas')
    if (res.ok) {
      const data = await res.json()
      if (data) {
        setRutinas(data)
        if (data.supermercado) setSuperId(data.supermercado)
      }
    }
  }

  function toggleCheck(id: string) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function getSearchUrl(item: any) {
    const nombre = item.name.split('—')[0].trim()
    return SEARCH_URLS[superId] + encodeURIComponent(nombre)
  }

  function getNombre(item: any) {
    return item.name.split('—')[0].trim()
  }

  function getCantidad(item: any) {
    return item.name.includes('—') ? item.name.split('—')[1]?.trim() : `x${item.quantity}`
  }

  const super_info = SUPERMERCADOS.find(s => s.id === superId) || SUPERMERCADOS[0]

  // Group by category
  const grouped: Record<string, any[]> = {}
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  const totalPendientes = items.length - checkedIds.size

  return (
    <div className={styles.page}>
      <header className={styles.header} style={{ background: `linear-gradient(160deg, ${super_info.color}dd, ${super_info.color})` }}>
        <h1 className={styles.title}>Haciendo la compra {super_info.logo}</h1>
        <p className={styles.subtitle}>{totalPendientes} productos pendientes</p>
      </header>

      <main className={styles.main}>
        {/* Selector de supermercado */}
        <div className={styles.superCard}>
          <div className={styles.superLabel}>¿Dónde vas a comprar?</div>
          <div className={styles.superRow}>
            {SUPERMERCADOS.map(s => (
              <button
                key={s.id}
                className={`${styles.superBtn} ${superId === s.id ? styles.superActive : ''}`}
                style={superId === s.id ? { borderColor: s.color, background: s.color + '15', color: s.color } : {}}
                onClick={() => setSuperId(s.id)}
              >
                {s.logo} {s.nombre}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎉</div>
            <p className={styles.emptyTitle}>¡Lista vacía!</p>
            <p className={styles.emptySub}>No hay nada pendiente por comprar</p>
          </div>
        )}

        {Object.entries(grouped).map(([catId, catItems]) => {
          const cat = CATS[catId] || CATS.otros
          return (
            <div key={catId} className={styles.section}>
              <div className={styles.sectionLabel} style={{ color: cat.color }}>
                <span>{cat.emoji} {cat.label}</span>
                <span className={styles.sectionLine} />
              </div>
              {catItems.map(item => {
                const isChecked = checkedIds.has(item.id)
                return (
                  <div key={item.id} className={`${styles.item} ${isChecked ? styles.itemChecked : ''}`}>
                    <button
                      className={`${styles.check} ${isChecked ? styles.checked : ''}`}
                      style={isChecked ? { background: cat.color, borderColor: cat.color } : {}}
                      onClick={() => toggleCheck(item.id)}
                    >{isChecked ? '✓' : ''}</button>
                    <div className={styles.itemBody}>
                      <div className={styles.itemNombre}>{getNombre(item)}</div>
                      <div className={styles.itemCantidad}>{getCantidad(item)}</div>
                    </div>
                    <a
                      href={getSearchUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.searchBtn}
                      style={{ background: super_info.color + '15', color: super_info.color, borderColor: super_info.color + '44' }}
                    >
                      Buscar →
                    </a>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div style={{ height: 100 }} />
      </main>

      <BottomNav />
    </div>
  )
}
