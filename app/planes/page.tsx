'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [hcp, setHcp] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function planDesdeURL(): string {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('plan') || ''
  }

  async function registrar() {
    setError('')

    // Validaciones
    if (!nombre.trim()) { setError('Escribe tu nombre.'); return }
    const telLimpio = telefono.replace(/\D/g, '')  // solo digitos
    if (telLimpio.length < 10) { setError('Escribe un telefono valido (10 digitos).'); return }
    const hcpNum = hcp === '' ? 0 : Number(hcp)
    if (isNaN(hcpNum)) { setError('El HCP debe ser un numero (ej. 12.5).'); return }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('El PIN debe ser de 4 digitos.'); return }
    if (pin !== pin2) { setError('Los PIN no coinciden.'); return }

    setGuardando(true)
    try {
      // Verificar que no exista ya alguien con el mismo PIN + ultimos 4 del telefono
      const ultimos4 = telLimpio.slice(-4)
      const { data: existentes } = await supabase
        .from('players')
        .select('id, phone, pin')
        .eq('pin', pin)

      const choca = (existentes || []).some(p => {
        const t = (p.phone || '').replace(/\D/g, '')
        return t.slice(-4) === ultimos4
      })
      if (choca) {
        setError('Ya existe una cuenta con ese PIN y telefono. Intenta con otro PIN.')
        setGuardando(false)
        return
      }

      // Crear el jugador (registro de acceso). Sin campo (club_id null) - el campo se elige al jugar.
      const { error: e1 } = await supabase.from('players').insert({
        golf_name: nombre.trim(),
        phone: telLimpio,
        pin: pin,
        hcp_base: hcpNum,
        active: true,
      })
      if (e1) throw e1

      // Guardar sesion simple en el navegador para recordarlo
      try {
        localStorage.setItem('kgc_user', JSON.stringify({ nombre: nombre.trim(), tel4: ultimos4 }))
      } catch (_) {}

      // Entra al menu
      router.push('/dashboard')
    } catch (err: any) {
      setError('Error al registrar: ' + (err?.message || err))
      setGuardando(false)
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

        {/* Cerrar / volver */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '20px 0 0' }}>
          <button onClick={() => window.location.href = '/planes'} style={{
            background: 'transparent', border: '1px solid #2ECC7144', color: '#81c784',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>&#8592; Volver</button>
        </div>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 26, fontWeight: 'bold' }}>Crea tu cuenta</div>
          <div style={{ fontSize: 13, color: '#81c784', marginTop: 8 }}>
            15 dias gratis &middot; Sin tarjeta de credito ni debito
          </div>
        </div>

        {/* Formulario */}
        <div style={{ background: '#12241a', borderRadius: 16, border: '1px solid #2ECC7133', padding: '20px 18px' }}>

          <Campo label="NOMBRE">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
              style={inputStyle} />
          </Campo>

          <Campo label="TELEFONO">
            <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="10 digitos"
              inputMode="numeric" style={inputStyle} />
          </Campo>

          <Campo label="HCP (ej. 12.5)">
            <input value={hcp} onChange={e => setHcp(e.target.value)} placeholder="0"
              type="number" step="0.1" inputMode="decimal" style={inputStyle} />
          </Campo>

          <Campo label="PIN (4 digitos)">
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="&bull;&bull;&bull;&bull;" inputMode="numeric" type="password" style={inputStyle} />
          </Campo>

          <Campo label="CONFIRMA TU PIN">
            <input value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="&bull;&bull;&bull;&bull;" inputMode="numeric" type="password" style={inputStyle} />
          </Campo>

          {error && (
            <div style={{ background: '#e74c3c22', border: '1px solid #e74c3c66', borderRadius: 8, padding: '10px 12px', color: '#e74c3c', fontSize: 13, marginBottom: 14, marginTop: 4 }}>
              {error}
            </div>
          )}

          <button onClick={registrar} disabled={guardando} style={{
            width: '100%', background: guardando ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none',
            borderRadius: 12, padding: '16px', cursor: guardando ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'bold', marginTop: 6,
            boxShadow: '0 10px 30px rgba(46,204,113,.25)',
          }}>
            {guardando ? 'Creando tu cuenta...' : 'Iniciar mis 15 dias gratis'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#81c784', lineHeight: 1.6 }}>
          Para entrar despues usaras tu PIN<br />y los ultimos 4 digitos de tu telefono.
        </div>

      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8,
  padding: '12px 14px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 15,
  boxSizing: 'border-box',
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      {children}
    </div>
  )
}