'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'

interface Jugador {
  id: string
  golf_name: string
  hcp_base: number
  active: boolean
}

export default function JugadoresPage() {
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHcp, setNuevoHcp] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)
    cargar()
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('id, golf_name, hcp_base, active')
      .eq('club_id', CLUB_ID)
      .order('golf_name')
    setJugadores(data || [])
    setLoading(false)
  }

  async function agregarJugador() {
    if (!nuevoNombre.trim()) { alert('Escribe el nombre del jugador.'); return }
    const hcpNum = nuevoHcp === '' ? 0 : Number(nuevoHcp)
    if (isNaN(hcpNum)) { alert('El HCP debe ser un número (ej. 12.5).'); return }
    setGuardando(true)
    try {
      const { error } = await supabase.from('players').insert({
        golf_name: nuevoNombre.trim(),
        hcp_base: hcpNum,
        club_id: CLUB_ID,
        active: true,
      })
      if (error) throw error
      setNuevoNombre('')
      setNuevoHcp('')
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      alert('Error al agregar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(jug: Jugador, nuevoActivo: boolean) {
    try {
      const { error } = await supabase.from('players').update({ active: nuevoActivo }).eq('id', jug.id)
      if (error) throw error
      await cargar()
    } catch (err: any) {
      alert('Error: ' + (err?.message || err))
    }
  }

  const activos = jugadores.filter(j => j.active)
  const archivados = jugadores.filter(j => !j.active)
  const lista = verArchivados ? archivados : activos

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>👥 Jugadores</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + adminSuffix} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
      </div>

      {/* Etiqueta de modo */}
      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición' : '👁️ Modo Solo Lectura — no se puede agregar ni archivar'}
      </div>

      <div style={{ padding: '20px 16px 60px' }}>
        {/* Controles */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setVerArchivados(false)} style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
            background: !verArchivados ? '#2ECC71' : 'transparent', color: !verArchivados ? '#0a1a0f' : '#2ECC71',
            border: '1px solid #2ECC71',
          }}>Activos ({activos.length})</button>
          <button onClick={() => setVerArchivados(true)} style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
            background: verArchivados ? '#F39C12' : 'transparent', color: verArchivados ? '#0a1a0f' : '#F39C12',
            border: '1px solid #F39C12',
          }}>Archivados ({archivados.length})</button>
        </div>

        {/* Botón agregar (solo admin, solo en vista activos) */}
        {esAdmin && !verArchivados && (
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{
            width: '100%', marginBottom: 16, background: mostrarForm ? '#4a7a50' : '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
          }}>
            {mostrarForm ? '✕ Cancelar' : '+ Agregar Jugador'}
          </button>
        )}

        {/* Formulario */}
        {esAdmin && mostrarForm && !verArchivados && (
          <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7144', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>NOMBRE</div>
            <input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>HCP (ej. 12.5)</div>
            <input
              type="number" step="0.1"
              value={nuevoHcp}
              onChange={e => setNuevoHcp(e.target.value)}
              placeholder="0"
              style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 }}
            />
            <button onClick={agregarJugador} disabled={guardando} style={{
              width: '100%', background: guardando ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 8,
              padding: '12px', cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
            }}>
              {guardando ? 'Guardando...' : '✓ Guardar Jugador'}
            </button>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#2ECC71', padding: 40 }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div style={{ background: '#1a2e1d', borderRadius: 12, padding: 30, textAlign: 'center', color: '#81c784', border: '1px solid #2ECC7122' }}>
            {verArchivados ? 'No hay jugadores archivados.' : 'No hay jugadores activos. Agrega el primero.'}
          </div>
        ) : (
          lista.map(j => (
            <div key={j.id} style={{
              background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7122',
              marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 'bold' }}>{j.golf_name}</div>
                <div style={{ fontSize: 12, color: '#81c784', marginTop: 2 }}>HCP {j.hcp_base}</div>
              </div>
              {esAdmin && (
                verArchivados ? (
                  <button onClick={() => cambiarEstado(j, true)} style={{
                    background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 8, padding: '8px 14px',
                    cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 'bold',
                  }}>♻️ Reactivar</button>
                ) : (
                  <button onClick={() => cambiarEstado(j, false)} style={{
                    background: 'transparent', color: '#F39C12', border: '1px solid #F39C12', borderRadius: 8, padding: '8px 14px',
                    cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
                  }}>❄️ Archivar</button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}