'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EntrarPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [tel4, setTel4] = useState('')
  const [error, setError] = useState('')
  const [verificando, setVerificando] = useState(false)

  async function entrar() {
    setError('')
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('El PIN debe ser de 4 dígitos.'); return }
    if (tel4.length !== 4 || !/^\d{4}$/.test(tel4)) { setError('Escribe los últimos 4 dígitos de tu teléfono.'); return }

    setVerificando(true)
    try {
      // Buscar registrados con ese PIN
      const { data, error: e1 } = await supabase
        .from('players')
        .select('id, golf_name, phone, pin')
        .eq('pin', pin)
      if (e1) throw e1

      // De esos, el que tenga esos últimos 4 del teléfono
      const encontrado = (data || []).find(p => {
        const t = (p.phone || '').replace(/\D/g, '')
        return t.slice(-4) === tel4
      })

      if (!encontrado) {
        setError('No encontramos una cuenta con esos datos. Revisa tu PIN y los últimos 4 dígitos.')
        setVerificando(false)
        return
      }

      // Recordar sesión simple
      try {
        localStorage.setItem('kgc_user', JSON.stringify({ nombre: encontrado.golf_name, tel4 }))
      } catch (_) {}

      router.push('/dashboard')
    } catch (err: any) {
      setError('Error al entrar: ' + (err?.message || err))
      setVerificando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#e8f5e9',
      background: 'radial-gradient(1200px 600px at 50% -10%, #16361f 0%, transparent 60%), #0a1a0f',
    }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 22px 50px' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '20px 0 0' }}>
          <button onClick={() => router.push('/')} style={{
            background: 'transparent', border: '1px solid #2ECC7144', color: '#81c784',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>← Volver</button>
        </div>

        <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 26, fontWeight: 'bold' }}>Entrar</div>
          <div style={{ fontSize: 13, color: '#81c784', marginTop: 8 }}>
            Usa tu PIN y los últimos 4 dígitos de tu teléfono
          </div>
        </div>

        <div style={{ background: '#12241a', borderRadius: 16, border: '1px solid #2ECC7133', padding: '20px 18px' }}>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>PIN (4 dígitos)</div>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" inputMode="numeric" type="password"
              style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '14px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 20, boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8 }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>ÚLTIMOS 4 DEL TELÉFONO</div>
            <input value={tel4} onChange={e => setTel4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234" inputMode="numeric"
              style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '14px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 20, boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8 }} />
          </div>

          {error && (
            <div style={{ background: '#e74c3c22', border: '1px solid #e74c3c66', borderRadius: 8, padding: '10px 12px', color: '#e74c3c', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button onClick={entrar} disabled={verificando} style={{
            width: '100%', background: verificando ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none',
            borderRadius: 12, padding: '16px', cursor: verificando ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'bold',
            boxShadow: '0 10px 30px rgba(46,204,113,.25)',
          }}>
            {verificando ? 'Verificando...' : 'Entrar'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#81c784' }}>
          ¿No tienes cuenta?{' '}
          <a href="/planes" style={{ color: '#2ECC71', textDecoration: 'underline' }}>Regístrate gratis</a>
        </div>

      </div>
    </div>
  )
}