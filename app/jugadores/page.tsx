'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Jugador {
  id: string
  golf_name: string
  hcp_base: number
  active: boolean
}

interface Campo {
  id: string
  name: string
  club_id: string
}

export default function JugadoresPage() {
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [campos, setCampos] = useState<Campo[]>([])
  const [clubSel, setClubSel] = useState<string>('')   // club_id seleccionado
  const [loading, setLoading] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHcp, setNuevoHcp] = useState('')
  const [nuevoIntegrantes, setNuevoIntegrantes] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function init() {
      setLoading(true)
      // Cargar campos (cada uno con su club_id)
      const { data: cData } = await supabase
        .from('golf_courses')
        .select('id, name, club_id')
        .eq('active', true)
        .order('name')
      const lista = cData || []
      setCampos(lista)

      // Club por defecto: Las Misiones si está, si no el primero
      const porDefecto = lista.find(c => c.name?.includes('Misiones')) || lista[0]
      const clubInicial = porDefecto ? porDefecto.club_id : ''
      setClubSel(clubInicial)

      if (clubInicial) await cargarJugadores(clubInicial)
      setLoading(false)
    }
    init()
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

async function cargarJugadores(clubId: string) {
    const { data } = await supabase
      .from('players')
      .select('id, golf_name, hcp_base, active, integrantes')
      .eq('club_id', clubId)
      .order('golf_name')
    // Mostrar solo los GRUPOS (los que tienen integrantes)
    const soloGrupos = (data || []).filter(j => j.integrantes && j.integrantes.trim() !== '')
    setJugadores(soloGrupos)
  }

  async function cambiarClub(clubId: string) {
    setClubSel(clubId)
    setMostrarForm(false)
    setLoading(true)
    await cargarJugadores(clubId)
    setLoading(false)
  }

  async function agregarJugador() {
    if (!clubSel) { alert('Selecciona un campo primero.'); return }
    if (!nuevoNombre.trim()) { alert('Escribe el nombre del jugador.'); return }
    const hcpNum = nuevoHcp === '' ? 0 : Number(nuevoHcp)
    if (isNaN(hcpNum)) { alert('El HCP debe ser un número (ej. 12.5).'); return }
    setGuardando(true)
    try {
const { error } = await supabase.from('players').insert({
        golf_name: nuevoNombre.trim(),
        hcp_base: hcpNum,
        club_id: clubSel,
        active: true,
        integrantes: nuevoIntegrantes.trim() || null,
      })
      if (error) throw error
      setNuevoNombre('')
      setNuevoHcp('')
      setNuevoIntegrantes('')
      setMostrarForm(false)
      await cargarJugadores(clubSel)
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
      await cargarJugadores(clubSel)
    } catch (err: any) {
      alert('Error: ' + (err?.message || err))
    }
  }

  const activos = jugadores.filter(j => j.active)
  const archivados = jugadores.filter(j => !j.active)
  const lista = verArchivados ? archivados : activos
  const nombreCampoSel = campos.find(c => c.club_id === clubSel)?.name || ''

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

        {/* SELECTOR DE CAMPO (dropdown) */}
        <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7144', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8, letterSpacing: 1 }}>CAMPO</div>
          <select
            value={clubSel}
            onChange={e => cambiarClub(e.target.value)}
            style={{
              width: '100%', background: '#0d2410', border: '1px solid #2ECC71', borderRadius: 8,
              padding: '12px 12px', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
              boxSizing: 'border-box', cursor: 'pointer',
            }}
          >
            {campos.map(c => (
              <option key={c.id} value={c.club_id} style={{ background: '#0d2410', color: '#e8f5e9' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

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
            {mostrarForm ? '✕ Cancelar' : `+ Agregar Jugador a ${nombreCampoSel}`}
          </button>
        )}

        {/* Formulario */}
        {esAdmin && mostrarForm && !verArchivados && (
          <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7144', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#F39C12', marginBottom: 10, letterSpacing: 1 }}>
              Se agregará a: {nombreCampoSel}
            </div>
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
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>INTEGRANTES (solo si es un grupo)</div>
            <div style={{ fontSize: 10, color: '#4a7a50', marginBottom: 6 }}>Sepáralos con comas. Déjalo vacío si es un jugador normal.</div>
            <input
              value={nuevoIntegrantes}
              onChange={e => setNuevoIntegrantes(e.target.value)}
              placeholder="Ej. Julio, Juan, Arturo, José"
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
            {verArchivados ? 'No hay jugadores archivados.' : `No hay jugadores activos en ${nombreCampoSel}. Agrega el primero.`}
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

        {/* Botón Siguiente: va directo al Paso 2 (Nuevo Juego) */}
        <button
          onClick={() => window.location.href = '/juego/nuevo' + adminSuffix}
          style={{
            width: '100%', marginTop: 20, background: '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 12, padding: '16px', cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'bold',
            boxShadow: '0 8px 24px rgba(46,204,113,.3)',
          }}
        >
          Siguiente: Nuevo Juego →
        </button>
      </div>
    </div>
  )
}