'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface JugadorCapturado {
  id: string          // id temporal local
  nombre: string
  hcp: number
  pareja: number | null   // numero de pareja (1,2,3...) o null si no asignado
}

// Convierte 1->I, 2->II, 3->III, etc.
function romano(n: number): string {
  const mapa: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let r = ''
  let num = n
  for (const [valor, simbolo] of mapa) {
    while (num >= valor) { r += simbolo; num -= valor }
  }
  return r
}

export default function BolaBajaPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [tipo, setTipo] = useState('informal')
  const [pctHcp, setPctHcp] = useState('100')
  const [campos, setCampos] = useState<any[]>([])
  const [campoSel, setCampoSel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [esAdmin, setEsAdmin] = useState(true)
  const [paso, setPaso] = useState(1)

  const [jugadores, setJugadores] = useState<JugadorCapturado[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHcp, setNuevoHcp] = useState('')

  // cuantas parejas mostrar como botones (crece segun jugadores)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      setLoading(true)
      const { data: cData } = await supabase
        .from('golf_courses')
        .select('id, name, club_id, city, state')
        .eq('active', true)
        .order('name')
      const lista = cData || []
      setCampos(lista)
      const porDefecto = lista.find(c => c.name?.includes('Misiones')) || lista[0] || null
      setCampoSel(porDefecto)
      setLoading(false)
    }
    cargar()
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  function agregarJugador() {
    if (!nuevoNombre.trim()) { alert('Escribe el nombre del jugador.'); return }
    const hcpNum = nuevoHcp === '' ? 0 : Number(nuevoHcp)
    if (isNaN(hcpNum)) { alert('El HCP debe ser un numero.'); return }
    const nuevo: JugadorCapturado = {
      id: 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nombre: nuevoNombre.trim(),
      hcp: hcpNum,
      pareja: null,
    }
    setJugadores(prev => [...prev, nuevo])
    setNuevoNombre('')
    setNuevoHcp('')
  }

  function quitarJugador(id: string) {
    setJugadores(prev => prev.filter(j => j.id !== id))
  }

  function asignarPareja(id: string, numPareja: number) {
    setJugadores(prev => prev.map(j =>
      j.id === id ? { ...j, pareja: j.pareja === numPareja ? null : numPareja } : j
    ))
  }

  // cuantos botones de pareja mostrar: al menos ceil(jugadores/2), minimo 1
  const numParejasBotones = Math.max(1, Math.ceil(jugadores.length / 2))
  const botonesPareja = Array.from({ length: numParejasBotones }, (_, i) => i + 1)

  // Validacion: cada pareja asignada debe tener exactamente 2 jugadores
  function parejasValidas(): boolean {
    const conteo: Record<number, number> = {}
    let algunaPareja = false
    for (const j of jugadores) {
      if (j.pareja !== null) {
        conteo[j.pareja] = (conteo[j.pareja] || 0) + 1
        algunaPareja = true
      }
    }
    if (!algunaPareja) return false
    // toda pareja usada debe tener exactamente 2
    for (const k of Object.keys(conteo)) {
      if (conteo[Number(k)] !== 2) return false
    }
    // no debe haber jugadores sin asignar
    if (jugadores.some(j => j.pareja === null)) return false
    return true
  }

  async function handleArrancar() {
    if (!campoSel) { alert('Selecciona un campo.'); return }
    if (!parejasValidas()) { alert('Cada pareja debe tener exactamente 2 jugadores, y todos deben estar asignados.'); return }
    setGuardando(true)
    try {
      // 1) Crear la ronda
      const { data: ronda, error: e1 } = await supabase
        .from('game_rounds')
        .insert({
          club_id: campoSel.club_id,
          course_id: campoSel.id,
          name: `Bola Baja ${fecha}`,
          date: fecha,
          type: tipo,
          format: 'bola_baja',
          status: 'in_progress',
        })
        .select()
        .single()
      if (e1 || !ronda) throw e1 || new Error('No se creo el juego')

      // 2) Crear cada jugador en players (ligado al club) y luego a game_round_players
      // El % de HCP lo define el organizador. Se ajusta cada HCP y se redondea al 0.5 mas cercano.
      const pct = pctHcp === '' ? 100 : Number(pctHcp)
      const factorPct = (isNaN(pct) ? 100 : pct) / 100
      const filas: any[] = []
      for (const j of jugadores) {
        const hcpAjustado = Math.round((j.hcp * factorPct) * 2) / 2
        const { data: pl, error: ep } = await supabase.from('players').insert({
          golf_name: j.nombre,
          hcp_base: j.hcp,
          club_id: campoSel.club_id,
          active: true,
        }).select().single()
        if (ep || !pl) throw ep || new Error('No se creo un jugador')
        filas.push({
          game_round_id: ronda.id,
          player_id: pl.id,
          club_id: campoSel.club_id,
          hcp_index: hcpAjustado,   // HCP ya ajustado por el % del torneo
          team_number: j.pareja,   // el numero de pareja
        })
      }

      const { error: e2 } = await supabase.from('game_round_players').insert(filas)
      if (e2) throw e2

      // 3) Ir al scorecard de bola baja (se construira en la Etapa 2)
      window.location.href = `/juego/bola-baja-tarjeta?game=${ronda.id}&admin=1`
    } catch (err: any) {
      alert('Error al crear el juego: ' + (err?.message || err))
      setGuardando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8,
    padding: '10px 12px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14,
    boxSizing: 'border-box',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Bola Baja en Parejas</div>
        </div>
        <button onClick={() => window.location.href = '/juego/nuevo' + adminSuffix} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>
          Atras
        </button>
      </div>

      <div style={{ display: 'flex', padding: '16px 24px', gap: 8 }}>
        {[1, 2].map(p => (
          <div key={p} style={{ flex: 1, height: 4, borderRadius: 2, background: paso >= p ? '#2ECC71' : '#1a2e1d' }} />
        ))}
      </div>

      <div style={{ padding: '8px 16px 80px' }}>

        {/* PASO 1: Campo + fecha */}
        {paso === 1 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>Paso 1 - Campo y Fecha</div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 10 }}>CAMPO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campos.map(c => {
                  const sel = campoSel?.id === c.id
                  return (
                    <div key={c.id} onClick={() => setCampoSel(c)} style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: sel ? '#2ECC7122' : '#0d2410',
                      border: `2px solid ${sel ? '#2ECC71' : '#2ECC7133'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 'bold', color: sel ? '#2ECC71' : '#e8f5e9' }}>{c.name}</div>
                      {sel && <span style={{ color: '#2ECC71', fontSize: 18, fontWeight: 'bold' }}>OK</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>TIPO</div>
              <div style={{ display: 'flex', gap: 0, border: '1px solid #2ECC7144', borderRadius: 8, overflow: 'hidden' }}>
                {['informal', 'semanal', 'mensual', 'especial'].map(t => (
                  <button key={t} onClick={() => setTipo(t)} style={{
                    flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                    background: tipo === t ? '#2ECC71' : 'transparent',
                    color: tipo === t ? '#0a1a0f' : '#2ECC71', fontWeight: 'bold', fontSize: 10, textTransform: 'capitalize',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>FECHA</div>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #F39C1244', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#F39C12', marginBottom: 8, letterSpacing: 1 }}>% DE HCP (regla del torneo)</div>
              <div style={{ fontSize: 10, color: '#4a7a50', marginBottom: 8 }}>Define a que porcentaje del HCP se juega. 100 = HCP completo. Ej. 80 = ochenta por ciento.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" step="1" min="1" max="100"
                  value={pctHcp}
                  onChange={e => setPctHcp(e.target.value)}
                  placeholder="100"
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#F39C12' }}>%</span>
              </div>
            </div>

            <button onClick={() => setPaso(2)} style={{ width: '100%', background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold' }}>
              Siguiente
            </button>
          </div>
        )}

        {/* PASO 2: Jugadores + parejas */}
        {paso === 2 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>Paso 2 - Jugadores y Parejas</div>

            {/* Alta de jugador */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>AGREGAR JUGADOR</div>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6 }}>NOMBRE</div>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej. Juan Perez" style={{ ...inputStyle, marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 6 }}>HCP (ej. 12.5)</div>
              <input type="number" step="0.1" value={nuevoHcp} onChange={e => setNuevoHcp(e.target.value)} placeholder="0" style={{ ...inputStyle, marginBottom: 12 }} />
              <button onClick={agregarJugador} style={{ width: '100%', background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold' }}>
                + Agregar Jugador
              </button>
            </div>

            {/* Lista de jugadores con asignacion de pareja */}
            {jugadores.length > 0 && (
              <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 6, letterSpacing: 2 }}>ASIGNA CADA JUGADOR A SU PAREJA</div>
                <div style={{ fontSize: 10, color: '#4a7a50', marginBottom: 12 }}>Toca el numero romano de la pareja. Cada pareja lleva 2 jugadores.</div>

                {jugadores.map(j => (
                  <div key={j.id} style={{ background: '#0d2410', borderRadius: 8, padding: '10px 12px', border: '1px solid #2ECC7133', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 'bold' }}>{j.nombre}</span>
                        <span style={{ fontSize: 12, color: '#81c784', marginLeft: 8 }}>HCP {j.hcp}</span>
                        {pctHcp !== '' && Number(pctHcp) !== 100 && !isNaN(Number(pctHcp)) && (
                          <span style={{ fontSize: 11, color: '#F39C12', marginLeft: 8 }}>
                            &rarr; juega {Math.round((j.hcp * Number(pctHcp) / 100) * 2) / 2} ({pctHcp}%)
                          </span>
                        )}
                      </div>
                      <button onClick={() => quitarJugador(j.id)} style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c55', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Quitar</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {botonesPareja.map(num => {
                        const activo = j.pareja === num
                        return (
                          <button key={num} onClick={() => asignarPareja(j.id, num)} style={{
                            minWidth: 40, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
                            background: activo ? '#F39C12' : '#1a2e1d',
                            color: activo ? '#0a1a0f' : '#F39C12',
                            border: '1px solid #F39C12',
                          }}>{romano(num)}</button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(1)} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14 }}>
                Anterior
              </button>
              <button onClick={handleArrancar} disabled={guardando || !parejasValidas()} style={{
                flex: 2, background: (guardando || !parejasValidas()) ? '#4a7a50' : '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px',
                cursor: (guardando || !parejasValidas()) ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
              }}>
                {guardando ? 'Creando...' : 'Arrancar Juego'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}