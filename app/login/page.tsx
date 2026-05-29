'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function handleLogin() {
    setMensaje('Ingresando...')
    
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key!,
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.access_token) {
    window.location.replace('/dashboard')
      } else {
        setMensaje('Email o contraseña incorrectos')
      }
      
    } catch(e: any) {
      setMensaje('Error: ' + e.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      padding: '20px',
      color: '#e8f5e9',
    }}>
      <div style={{
        background: '#1a2e1d',
        borderRadius: 16,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 400,
        border: '1px solid #2ECC7133',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 6 }}>
            Bienvenido a
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e8f5e9' }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 13, color: '#81c784', marginTop: 4 }}>
            ⛳ Inicia sesión para continuar
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#81c784', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                background: '#0d2410',
                border: '1px solid #2ECC7144',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#e8f5e9',
                fontFamily: 'Georgia, serif',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#81c784', display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#0d2410',
                border: '1px solid #2ECC7144',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#e8f5e9',
                fontFamily: 'Georgia, serif',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mensaje && (
            <div style={{
              background: '#E74C3C22',
              border: '1px solid #E74C3C44',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#81c784',
              fontSize: 13,
            }}>
              {mensaje}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              background: '#2ECC71',
              color: '#0a1a0f',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontFamily: 'Georgia, serif',
              fontSize: 15,
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: 6,
            }}
          >
            Iniciar Sesión
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#81c784' }}>
            ¿No tienes cuenta?{' '}
            <a href="/registro" style={{ color: '#2ECC71', textDecoration: 'none' }}>
              Regístrate aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}