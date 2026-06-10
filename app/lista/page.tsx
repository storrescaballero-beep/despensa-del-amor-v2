'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Item } from '../../lib/supabase'
import { getHogarId } from '../../lib/auth'
import BottomNav from '../../components/BottomNav'
import { useRouter } from 'next/navigation'
import styles from './lista.module.css'

const CATS = [
  { id: 'fruta',     label: 'Fruta y verdura', emoji: '🥦', color: '#2E7D32' },
  { id: 'carne',     label: 'Carne y pescado',  emoji: '🥩', color: '#C2185B' },
  { id: 'lacteos',   label: 'Lácteos',           emoji: '🥛', color: '#F57C00' },
  { id: 'panaderia', label: 'Pan',               emoji: '🍞', color: '#795548' },
  { id: 'despensa',  label: 'Despensa',           emoji: '🥫', color: '#0288D1' },
  { id: 'limpieza',  label: 'Limpieza',           emoji: '🧹', color: '#7B1FA2' },
  { id: 'bebidas',   label: 'Bebidas',            emoji: '🧃', color: '#0097A7' },
  { id: 'otros',     label: 'Otros',              emoji: '📦', color: '#607D8B' },
]

export default function Lista() {
  const [items, setItems] = useState<Item[]>([])
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('otros')
  const [filterCat, setFilterCat] = useState('todo')
  const [addedBy, setAddedBy] = useState<string>('yo')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [nombres, setNombres] = useState({ yo: 'Yo', pareja: 'Mi pareja' })
  const [hogarId, setHogarId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const hId = await getHogarId()
    if (!hId) { router.push('/onboarding'); return }
    setHogarId(hId)

    loadItems(hId)
    loadNombres()

    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => loadItems(hId))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadItems(hId: string) {
    const { data } = await supabase.from('items').select('*').eq('hogar_id', hId).order('created_at', { ascending: true })
    if (data) setItems(data)
  }

  async function loadNombres() {
    const res = await fetch('/api/rutinas')
    if (res.ok) {
      const data = await res.json()
      if (data) setNombres({ yo: data.nombre_yo || 'Yo', pareja: data.nombre_pareja || 'Mi pareja' })
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function addItem() {
    const name = newName.trim()
    if (!name || !hogarId) return
    await supabase.from('items').insert({ name, category: newCat, quantity: 1, done: false, added_by: addedBy, hogar_id: hogarId })
    setNewName('')
    setShowAdd(false)
    showToast('✓ Añadido')
  }

  async function toggleDone(item: Item) {
    await supabase.from('items').update({ done: !item.done }).eq('id', item.id)
  }

  async function changeQty(item: Item, delta: number) {
    await supabase.from('items').update({ quantity: Math.max(1, item.quantity + delta) }).eq('id', item.id)
  }

  async function deleteItem(id: string) {
    await supabase.from('items').delete().eq('id', id)
  }

  async function clearDone() {
    const ids = items.filter(i => i.done).map(i => i.id)
    if (!ids.length) return
    await supabase.from('items').delete().in('id', ids)
    showToast('🗑️ Productos eliminados')
  }

  const filtered = filterCat === 'todo' ? items : items.filter(i => i.category === filterCat)
  const pending = filtered.filter(i => !i.done)
  const done = filtered.filter(i => i.done)
  const grouped: Record<string, Item[]> = {}
  pending.forEach(item => { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item) })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>La Despensa <span>del Amor</span></h1>
            <p className={styles.subtitle}>Lista compartida en tiempo real</p>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}><span className={styles.statN}>{items.filter(i=>!i.done).length}</span><span>pendientes</span></div>
            <div className={`${styles.stat} ${styles.statGreen}`}><span className={styles.statN}>{items.filter(i=>i.done).length}</span><span>en carro</span></div>
          </div>
        </div>
        <div className={styles.userRow}>
          <button className={`${styles.userBtn} ${addedBy==='yo'?styles.userActive:''}`} onClick={()=>setAddedBy('yo')}>👤 {nombres.yo}</button>
          <button className={`${styles.userBtn} ${addedBy==='pareja'?styles.userActive:''}`} onClick={()=>setAddedBy('pareja')}>💑 {nombres.pareja}</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.filterRow}>
          <button className={`${styles.chip} ${filterCat==='todo'?styles.chipActive:''}`} onClick={()=>setFilterCat('todo')}>🔍 Todo</button>
          {CATS.map(c=>(
            <button key={c.id} className={`${styles.chip} ${filterCat===c.id?styles.chipActive:''}`}
              style={filterCat===c.id?{background:c.color+'22',borderColor:c.color,color:c.color}:{}}
              onClick={()=>setFilterCat(filterCat===c.id?'todo':c.id)}>{c.emoji} {c.label}</button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🧺</div>
            <p className={styles.emptyTitle}>La despensa está vacía</p>
            <p className={styles.emptySub}>Pulsa el + para añadir productos</p>
          </div>
        )}

        {Object.entries(grouped).map(([catId, catItems]) => {
          const cat = CATS.find(c=>c.id===catId)
          return (
            <div key={catId}>
              <div className={styles.sectionLabel} style={{color: cat?.color}}>
                <span>{cat?.emoji} {cat?.label || catId}</span>
                <span className={styles.sectionLine} />
              </div>
              {catItems.map(item => (
                <ItemCard key={item.id} item={item} cats={CATS} nombres={nombres}
                  onToggle={()=>toggleDone(item)} onQty={d=>changeQty(item,d)} onDelete={()=>deleteItem(item.id)} />
              ))}
            </div>
          )
        })}

        {done.length > 0 && (
          <div>
            <div className={styles.sectionLabel} style={{color:'#888'}}>
              <span>✓ En el carro ({done.length})</span>
              <span className={styles.sectionLine} />
            </div>
            {done.map(item => (
              <ItemCard key={item.id} item={item} cats={CATS} nombres={nombres}
                onToggle={()=>toggleDone(item)} onQty={d=>changeQty(item,d)} onDelete={()=>deleteItem(item.id)} />
            ))}
            <button className={styles.clearBtn} onClick={clearDone}>🗑️ Vaciar carro</button>
          </div>
        )}
        <div style={{height:120}} />
      </main>

      {showAdd && (
        <div className={styles.modal} onClick={()=>setShowAdd(false)}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Añadir producto</h3>
            <input ref={inputRef} className={styles.modalInput} value={newName}
              onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="¿Qué falta?" autoFocus />
            <div className={styles.catGrid}>
              {CATS.map(c=>(
                <button key={c.id} className={`${styles.catBtn} ${newCat===c.id?styles.catBtnActive:''}`}
                  style={newCat===c.id?{background:c.color,color:'#fff',borderColor:c.color}:{}}
                  onClick={()=>setNewCat(c.id)}>{c.emoji} {c.label}</button>
              ))}
            </div>
            <button className={styles.modalAdd} onClick={addItem}>Añadir a la lista</button>
          </div>
        </div>
      )}

      <button className={styles.fab} onClick={()=>setShowAdd(true)}>+</button>
      {toast && <div className={styles.toast}>{toast}</div>}
      <BottomNav />
    </div>
  )
}

function ItemCard({ item, cats, nombres, onToggle, onQty, onDelete }: {
  item: Item, cats: typeof CATS | any[], nombres: {yo: string, pareja: string},
  onToggle:()=>void, onQty:(d:number)=>void, onDelete:()=>void
}) {
  const cat = cats.find((c:any)=>c.id===item.category)
  const addedByName = item.added_by === 'yo' ? nombres.yo : item.added_by === 'pareja' ? nombres.pareja : 'menú'
  return (
    <div className={`${styles.item} ${item.done?styles.itemDone:''}`}>
      <button className={`${styles.check} ${item.done?styles.checked:''}`}
        style={item.done?{background:cat?.color||'#888',borderColor:cat?.color||'#888'}:{}}
        onClick={onToggle}>{item.done?'✓':''}</button>
      <div className={styles.itemBody}>
        <div className={styles.itemName}>{item.name}</div>
        <div className={styles.itemMeta}>
          <span className={styles.catDot} style={{background:cat?.color||'#888'}} />
          {cat?.emoji} {cat?.label} · {addedByName}
        </div>
      </div>
      <div className={styles.qty}>
        <button className={styles.qtyBtn} onClick={()=>onQty(-1)}>−</button>
        <span className={styles.qtyNum}>{item.quantity}</span>
        <button className={styles.qtyBtn} onClick={()=>onQty(1)}>+</button>
      </div>
      <button className={styles.delBtn} onClick={onDelete}>×</button>
    </div>
  )
}
