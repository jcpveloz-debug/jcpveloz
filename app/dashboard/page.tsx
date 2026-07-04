'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

const ADMIN_PIN = '9080'

export default function DashboardPage() {
  const [user] = useState({ email: 'jugador@golf.com', user_metadata: { full_name: 'Bienvenido' } })
  const [esAdmin, setEsAdmin] = useState(false)
  const [mostrarPin, setMostrarPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  function compartirWhatsApp() {
    const url = 'https://kriter-golf-club.vercel.app'
    const texto = `⛳ Únete a Kriter Golf Club!\n\nEntra directo aquí:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function verificarPin() {
    if (pin === ADMIN_PIN) {
      window.location.href = '/dashboard?admin=1'
    } else {
      setError('PIN incorrecto')
    }
  }

  function salirAdmin() {
    window.location.href = '/dashboard'
  }

  // items activos (con pantalla real)
const items = [
    { paso: 1, icon: '👥', label: 'Jugadores', desc: 'Registra jugadores o grupos', href: '/jugadores' },
    { paso: 2, icon: '⛳', label: 'Nuevo Juego', desc: 'Inicia una ronda', href: '/juego/nuevo' },
    { paso: 3, icon: '📊', label: 'Leaderboard', desc: 'Resultados en vivo', href: '/leaderboard-fourball' },
    { paso: 4, icon: '📋', label: 'Mis Juegos', desc: 'Historial de rondas', href: '/juegos' },
  ]

  // items próximamente (sin pantalla aún)
  const proximamente = [
    { icon: '⚙️', label: 'Mi Perfil', desc: 'Datos y HCP' },
    { icon: '🏌️', label: 'Mi Club', desc: 'Info del club' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)',
        borderBottom: '2px solid #2ECC71',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={compartirWhatsApp} style={{
            background: '#25D366', border: 'none', borderRadius: 8, color: '#fff',
            padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
          }}>
            📲 WhatsApp
          </button>
          {esAdmin ? (
            <button onClick={salirAdmin} style={{
              background: '#F39C12', border: 'none', borderRadius: 8, color: '#0a1a0f',
              padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
            }}>
              🔓 Salir Admin
            </button>
          ) : (
            <button onClick={() => { setMostrarPin(true); setError(''); setPin('') }} style={{
              background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
              padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
            }}>
              🔒 Admin
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición — puedes crear y capturar' : '👁️ Modo Solo Lectura — solo puedes ver'}
      </div>

      {mostrarPin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ background: '#1a2e1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 280, border: '1px solid #2ECC71' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2ECC71' }}>🔒 Acceso Admin</div>
              <div style={{ fontSize: 11, color: '#81c784', marginTop: 4 }}>Ingresa tu PIN de 4 dígitos</div>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') verificarPin() }}
              placeholder="••••" autoFocus
              style={{
                width: '100%', background: '#0d2410', border: '1px solid #2ECC7144',
                borderRadius: 8, color: '#e8f5e9', textAlign: 'center', fontSize: 24,
                letterSpacing: 8, padding: '12px', outline: 'none', marginBottom: 12, boxSizing: 'border-box',
                fontFamily: 'Georgia, serif',
              }}
            />
            {error && <div style={{ color: '#e74c3c', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{error}</div>}
            <button onClick={verificarPin} disabled={pin.length !== 4} style={{
              width: '100%', background: pin.length === 4 ? '#2ECC71' : '#4a7a50', color: '#0a1a0f',
              border: 'none', borderRadius: 8, padding: '12px', cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
              fontFamily: 'Georgia, serif', fontWeight: 'bold', marginBottom: 8,
            }}>
              Entrar
            </button>
            <button onClick={() => setMostrarPin(false)} style={{
              width: '100%', background: 'transparent', color: '#81c784', border: 'none',
              padding: '8px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 16px' }}>
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '20px', border: '1px solid #2ECC7133', marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 8 }}>Bienvenido</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{user?.user_metadata?.full_name}</div>
          <div style={{ fontSize: 13, color: '#81c784' }}>{user?.email}</div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 12 }}>Menú Principal</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
{items.map((item, i) => (
            <div key={i}
              onClick={() => window.location.href = item.href + adminSuffix}
              style={{
                background: '#1a2e1d', borderRadius: 12, padding: '16px',
                border: '1px solid #2ECC7122', cursor: 'pointer', position: 'relative',
              }}>
              <div style={{
                position: 'absolute', top: 8, left: 8,
                width: 20, height: 20, borderRadius: '50%',
                background: '#F39C12', color: '#0a1a0f',
                fontSize: 12, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{item.paso}</div>
              <div style={{ fontSize: 24, marginBottom: 8, textAlign: 'right' }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{item.desc}</div>
            </div>
          ))}

          {/* Próximamente — apagados, no clicables */}
          {proximamente.map((item, i) => (
            <div key={`prox-${i}`}
              style={{
                background: '#12201580', borderRadius: 12, padding: '16px',
                border: '1px dashed #2ECC7122', cursor: 'default', opacity: 0.5, position: 'relative',
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{item.desc}</div>
              <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 8, letterSpacing: 1, color: '#F39C12', textTransform: 'uppercase', border: '1px solid #F39C1244', borderRadius: 4, padding: '2px 5px' }}>Pronto</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}