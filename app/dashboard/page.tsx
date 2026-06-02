'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

export default function DashboardPage() {
  const [user] = useState({ email: 'jugador@golf.com', user_metadata: { full_name: 'Bienvenido' } })

  function compartirWhatsApp() {
    const url = 'https://kriter-golf-club.vercel.app'
    const texto = `⛳ Únete a Kriter Golf Club!\n\nEntra directo aquí:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1a0f',
      fontFamily: 'Georgia, serif',
      color: '#e8f5e9',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)',
        borderBottom: '2px solid #2ECC71',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={compartirWhatsApp} style={{
            background: '#25D366', border: 'none',
            borderRadius: 8, color: '#fff',
            padding: '8px 14px', cursor: 'pointer',
            fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
          }}>
            📲 WhatsApp
          </button>
          <button onClick={() => window.location.replace('/login')} style={{
            background: 'transparent', border: '1px solid #2ECC71',
            borderRadius: 8, color: '#2ECC71', padding: '8px 14px',
            cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <div style={{
          background: '#1a2e1d', borderRadius: 14, padding: '20px',
          border: '1px solid #2ECC7133', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 8 }}>
            Bienvenido
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {user?.user_metadata?.full_name}
          </div>
          <div style={{ fontSize: 13, color: '#81c784' }}>{user?.email}</div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 12 }}>
          Menú Principal
        </div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '⛳', label: 'Nuevo Juego', desc: 'Iniciar una ronda', href: '/juego/nuevo' },
            { icon: '📊', label: 'Leaderboard', desc: 'Matches Fourball de hoy', href: '/leaderboard-fourball' },
            { icon: '📋', label: 'Mis Juegos', desc: 'Historial de rondas', href: '/juegos' },
            { icon: '👥', label: 'Jugadores', desc: 'Gestionar jugadores', href: '/jugadores' },
            { icon: '🏆', label: 'Resultados', desc: 'Ver marcadores', href: '/resultados' },
            { icon: '⚙️', label: 'Mi Perfil', desc: 'Datos y HCP', href: '/perfil' },
            { icon: '🏌️', label: 'Mi Club', desc: 'Info del club', href: '/club' },
          ].map((item, i) => (
            <div key={i} onClick={() => window.location.href = item.href} style={{
              background: '#1a2e1d', borderRadius: 12, padding: '16px',
              border: '1px solid #2ECC7122', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}