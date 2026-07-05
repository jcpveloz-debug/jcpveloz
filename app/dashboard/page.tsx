'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

const ADMIN_PIN = '9080'

export default function DashboardPage() {
  const [nombreUser, setNombreUser] = useState('Bienvenido')
  const [esAdmin, setEsAdmin] = useState(false)
  const [mostrarPin, setMostrarPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)
    try {
      const u = JSON.parse(localStorage.getItem('kgc_user') || '{}')
      if (u && u.nombre) setNombreUser(u.nombre)
    } catch (_) {}
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  function compartirWhatsApp() {
    const url = 'https://kriter-golf-club.vercel.app'
    const texto = 'Unete a Kriter Golf Club!\n\nEntra directo aqui:\n' + url
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
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

  const items = [
    { paso: 1, icon: 'GOLF', label: 'Nuevo Juego', desc: 'Inicia una ronda', href: '/juego/nuevo' },
    { paso: 2, icon: 'RANK', label: 'Leaderboard', desc: 'Resultados en vivo', href: '/leaderboard-fourball' },
    { paso: 3, icon: 'LIST', label: 'Mis Juegos', desc: 'Historial de rondas', href: '/juegos' },
  ]

  const proximamente = [
    { icon: 'PERFIL', label: 'Mi Perfil', desc: 'Datos y HCP' },
    { icon: 'CLUB', label: 'Mi Club', desc: 'Info del club' },
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
            WhatsApp
          </button>
          {esAdmin ? (
            <button onClick={salirAdmin} style={{
              background: '#F39C12', border: 'none', borderRadius: 8, color: '#0a1a0f',
              padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
            }}>
              Salir Admin
            </button>
          ) : (
            <button onClick={() => { setMostrarPin(true); setError(''); setPin('') }} style={{
              background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
              padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
            }}>
              Admin
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: '#2ECC7122',
        color: '#2ECC71',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        Listo para jugar
      </div>

      {mostrarPin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ background: '#1a2e1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 280, border: '1px solid #2ECC71' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2ECC71' }}>Acceso Admin</div>
              <div style={{ fontSize: 11, color: '#81c784', marginTop: 4 }}>Ingresa tu PIN de 4 digitos</div>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') verificarPin() }}
              placeholder="----" autoFocus
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
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{nombreUser}</div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 12 }}>Menu Principal</div>

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
                width: 22, height: 22, borderRadius: '50%',
                background: '#F39C12', color: '#0a1a0f',
                fontSize: 13, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{item.paso}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4, marginTop: 18 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{item.desc}</div>
            </div>
          ))}

          {proximamente.map((item, i) => (
            <div key={`prox-${i}`}
              style={{
                background: '#12201580', borderRadius: 12, padding: '16px',
                border: '1px dashed #2ECC7122', cursor: 'default', opacity: 0.5, position: 'relative',
              }}>
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