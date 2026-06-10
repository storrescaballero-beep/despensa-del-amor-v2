'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const TABS = [
  { href: '/lista',         icon: '🛒', label: 'Lista' },
  { href: '/compra',        icon: '🏪', label: 'Comprar' },
  { href: '/menu',          icon: '🍽️', label: 'Menú' },
  { href: '/nutricionista', icon: '🥗', label: 'Nuria' },
  { href: '/rutinas',       icon: '⚙️', label: 'Ajustes' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className={styles.nav}>
      {TABS.map(t => (
        <Link key={t.href} href={t.href} className={`${styles.btn} ${path.startsWith(t.href) ? styles.active : ''}`}>
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </Link>
      ))}
    </nav>
  )
}
