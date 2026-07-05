'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Jugador {
  id: string
  golf_name: string
  hcp_base: number
  active: boolean
  integrantes?: string
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
  const [clubSel, setClubSel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState<'individual' | 'grupo'>('individual')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHcp, setNuevoHcp] = useState('')
  const [nuevoIntegrantes, setNuevoIntegrantes] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function init() {
      setLoading(true)
      const { data: cData } = await supabase
        .from('golf_courses')
        .select('id, name, club_id')
        .eq('active', true)
        .order('name')
      const lista = cData || []
      setCampos(lista)

      const porDefecto = lista.find(c => c.name?.includes('Misiones')) || lista[0]
      const clubInicial = porDefecto ? porDefecto.club_id : ''
      setClubSel(clubInicial)
      // NO cargamos jugadores viejos: la lista arranca vacia.
      // Solo se ven los que el usuario agregue en esta sesion.
      setJugadores([])
      setLoading(false)
    }
    init()
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  function cambiarClub(clubId: string) {
    setClubSel(clubId)
    setMostrarForm(false)
    // Al cambiar de campo, limpiamos la lista de la sesion
    setJugadores([])
  }

  async function agregarJugador() {
    if (!clubSel) { alert('Selecciona un campo primero.'); return }
    if (!nuevoNombre.trim()) { alert(tipoRegistro === 'grupo' ? 'Escribe el nombre del grupo.' : 'Escribe el nombre del jugador.'); return }
    const hcpNum = nuevoHcp === '' ? 0 : Number(nuevoHcp)
    if (isNaN(hcpNum)) { alert('El HCP debe ser un numero (ej. 12.5).'); return }
    if (tipoRegistro === 'grupo' && !nuevoIntegrantes.trim()) { alert('Escribe los integrantes del grupo.'); return }
    setGuardando(true)
    try {
      const { data, error } = await supabase.from('players').insert({
        golf_name: nuevoNombre.trim(),
        hcp_base: hcpNum,
        club_id: clubSel,
        active: true,
        integrantes: tipoRegistro === 'grupo' ? (nuevoIntegrantes.trim() || null) : null,
      }).select().single()
      if (error) throw error
      // Lo agregamos a la lista de la sesion (para que el usuario lo vea)
      if (data) setJugadores(prev => [...prev, data as Jugador])
      setNuevoNombre('')
      setNuevoHcp('')
      setNuevoIntegrantes('')
      setMostrarForm(false)
    } catch (err: any) {
      alert('Error al agregar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  const nombreCampoSel = campos.find(c => c.club_id === clubSel)?.name || ''
  const esGrupo = tipoRegistro === 'grupo'

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>&#128101; Jugadores</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + adminSuffix} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>&#8592; Dashboard</button>
      </div>

      <div style={{ padding: '20px 16px 60px' }}>

        <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7144', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8, letterSpacing: 1 }}>CAMPO</div>
          <select
            value={clubSel}
            onChange={e => cambiarClub(e.target.value)}
            style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC71', borderRadius: 8, padding: '12px 12px', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            {campos.map(c => (
              <option key={c.id} value={c.club_id} style={{ background: '#0d2410', color: '#e8f5e9' }}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Boton agregar */}
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ width: '100%', marginBottom: 16, background: mostrarForm ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold' }}>
          {mostrarForm ? '\u2715 Cancelar' : `+ Agregar a ${nombreCampoSel}`}
        </button>

        {/* Formulario */}
        {mostrarForm && (
          <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7144', marginBottom: 16 }}>

            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8, letterSpacing: 1 }}>&#191;QUE VAS A REGISTRAR?</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setTipoRegistro('individual')} style={{ flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 'bold', background: !esGrupo ? '#2ECC71' : 'transparent', color: !esGrupo ? '#0a1a0f' : '#2ECC71', border: '1px solid #2ECC71' }}>&#128100; Individual</button>
              <button onClick={() => setTipoRegistro('grupo')} style={{ flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 'bold', background: esGrupo ? '#2ECC71' : 'transparent', color: esGrupo ? '#0a1a0f' : '#2ECC71', border: '1px solid #2ECC71' }}>&#128101; Grupo</button>
            </div>

            <div style={{ fontSize: 10, color: '#F39C12', marginBottom: 10, letterSpacing: 1 }}>Se agregara a: {nombreCampoSel}</div>

            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>{esGrupo ? 'NOMBRE DEL GRUPO' : 'NOMBRE'}</div>
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={esGrupo ? 'Ej. Grupo 1' : 'Ej. Juan Perez'} style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }} />

            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>HCP (ej. 12.5)</div>
            <input type="number" step="0.1" value={nuevoHcp} onChange={e => setNuevoHcp(e.target.value)} placeholder="0" style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 }} />

            {esGrupo && (
              <>
                <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6, letterSpacing: 1 }}>INTEGRANTES DEL GRUPO</div>
                <div style={{ fontSize: 10, color: '#4a7a50', marginBottom: 6 }}>Separalos con comas (de 2 a 6 jugadores).</div>
                <input value={nuevoIntegrantes} onChange={e => setNuevoIntegrantes(e.target.value)} placeholder="Ej. Julio, Juan, Arturo, Jose" style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 }} />
              </>
            )}

            <button onClick={agregarJugador} disabled={guardando} style={{ width: '100%', background: guardando ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 8, padding: '12px', cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold' }}>
              {guardando ? 'Guardando...' : (esGrupo ? '\u2713 Guardar Grupo' : '\u2713 Guardar Jugador')}
            </button>
          </div>
        )}

        {/* Lista: solo lo que se agrega en esta sesion */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#2ECC71', padding: 40 }}>Cargando...</div>
        ) : jugadores.length === 0 ? (
          <div style={{ background: '#1a2e1d', borderRadius: 12, padding: 30, textAlign: 'center', color: '#81c784', border: '1px solid #2ECC7122' }}>
            Agrega tus jugadores o grupos para este torneo.
          </div>
        ) : (
          jugadores.map(j => (
            <div key={j.id} style={{ background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7122', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 'bold' }}>{j.golf_name}</div>
              {j.integrantes ? (
                <div style={{ fontSize: 11, color: '#81c784', marginTop: 2 }}>{j.integrantes}</div>
              ) : (
                <div style={{ fontSize: 12, color: '#81c784', marginTop: 2 }}>HCP {j.hcp_base}</div>
              )}
            </div>
          ))
        )}

        <button onClick={() => window.location.href = '/juego/nuevo' + adminSuffix} style={{ width: '100%', marginTop: 20, background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 12, padding: '16px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 'bold', boxShadow: '0 8px 24px rgba(46,204,113,.3)' }}>
          Siguiente: Nuevo Juego &#8594;
        </button>
      </div>
    </div>
  )
}