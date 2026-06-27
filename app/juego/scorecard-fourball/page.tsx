'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'
const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Jugador {
  id: string
  nombre: string
  hcp: number
  pareja: 'A' | 'B'
}

interface Hoyo {
  hole_number: number
  par: number
  si: number
}

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('game')
}

export default function ScorecardFourballPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [nombreCampo, setNombreCampo] = useState('')
  const [loading, setLoading] = useState(true)
  const [hoyoActivo, setHoyoActivo] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})

  useEffect(() => {
    const id = leerGameId()
    setGameId(id)
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      if (!id) { setLoading(false); return }

// Leer el campo (course_id) del juego, no usar el fijo
const { data: rondaData } = await supabase
        .from('game_rounds')
        .select('course_id')
        .eq('id', id)
        .single()
      const cursoDelJuego = rondaData?.course_id || COURSE_ID

      // traer el nombre del campo para el título
      const { data: campoData } = await supabase
        .from('golf_courses')
        .select('name')
        .eq('id', cursoDelJuego)
        .single()
      setNombreCampo(campoData?.name || '')

      const { data: hData } = await supabase
        .from('course_holes')
        .select('hole_number, par, si')
        .eq('course_id', cursoDelJuego)
        .order('hole_number')
      const holes = hData || []
      setHoyos(holes)


      const { data: grp } = await supabase
        .from('game_round_players')
        .select('player_id, hcp_index, team_number')
        .eq('game_round_id', id)

      let jugs: Jugador[] = []
      if (grp && grp.length > 0) {
        const ids = grp.map(g => g.player_id)
        const { data: pData } = await supabase
          .from('players')
          .select('id, golf_name, hcp_base')
          .in('id', ids)

        jugs = grp.map(g => {
          const p = pData?.find(x => x.id === g.player_id)
          const hcp = g.hcp_index !== null && g.hcp_index !== undefined
            ? g.hcp_index
            : (p?.hcp_base ?? 0)
          return {
            id: g.player_id,
            nombre: p?.golf_name || 'Jugador',
            hcp,
            pareja: (String(g.team_number) === '1' ? 'A' : 'B') as 'A' | 'B',
          }
        })
      }
      setJugadores(jugs)

      const init: Record<string, Record<number, string>> = {}
      jugs.forEach(j => {
        init[j.id] = Object.fromEntries(holes.map(h => [h.hole_number, '']))
      })

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', id)

      sData?.forEach(s => {
        if (init[s.player_id]) init[s.player_id][s.hole_number] = String(s.gross_score)
      })

      setScores(init)
      setLoading(false)
    }
    cargar()
  }, [])

  const adminSuffix = esAdmin ? '&admin=1' : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando...
    </div>
  )

  if (!gameId || jugadores.length < 4) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró un juego Fourball válido (faltan jugadores o el enlace).</div>
      <button onClick={() => window.location.href = '/juego/nuevo'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
        ← Crear nuevo juego
      </button>
    </div>
  )

  const parejaA = jugadores.filter(j => j.pareja === 'A')
  const parejaB = jugadores.filter(j => j.pareja === 'B')
  const hoyo = hoyos[hoyoActivo]

  function updateScore(playerId: string, valor: string) {
    setScores(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [hoyo.hole_number]: valor },
    }))
  }

  function mejorNetoPareja(pareja: Jugador[], h: Hoyo): number | null {
    const netos: number[] = []
    pareja.forEach(j => {
      const g = scores[j.id]?.[h.hole_number]
      if (g !== undefined && g !== '') {
        const v = ventajaEnHoyo(j.hcp, h.si)
        netos.push(Number(g) - v)
      }
    })
    if (netos.length === 0) return null
    return Math.min(...netos)
  }

  function calcularMarcador() {
    let acumulado = 0
    let jugados = 0
    const resultadoHoyo: Record<number, 'A' | 'B' | 'halved' | null> = {}

    hoyos.forEach(h => {
      const nA = mejorNetoPareja(parejaA, h)
      const nB = mejorNetoPareja(parejaB, h)
      if (nA === null || nB === null) { resultadoHoyo[h.hole_number] = null; return }
      jugados++
      if (nA < nB) { acumulado++; resultadoHoyo[h.hole_number] = 'A' }
      else if (nB < nA) { acumulado--; resultadoHoyo[h.hole_number] = 'B' }
      else resultadoHoyo[h.hole_number] = 'halved'
    })

    return { acumulado, jugados, resultadoHoyo }
  }

  const { acumulado, jugados, resultadoHoyo } = calcularMarcador()
  const absAc = Math.abs(acumulado)
  const restantes = hoyos.length - jugados
  const finished = jugados > 0 && absAc > restantes
  const marcadorLabel = acumulado === 0 ? 'All Square' : finished ? `${absAc}&${restantes}` : `${absAc} UP`
  const colorA = '#2ECC71'
  const colorB = '#3498DB'
  const marcadorColor = acumulado === 0 ? '#2ECC71' : acumulado > 0 ? colorA : colorB

  async function guardarHoyo() {
    setGuardando(true)
    try {
      for (const j of jugadores) {
        const g = scores[j.id]?.[hoyo.hole_number]
        if (g === undefined || g === '') continue
        const v = ventajaEnHoyo(j.hcp, hoyo.si)
        const { error } = await supabase.from('hole_scores').upsert({
          game_round_id: gameId,
          player_id: j.id,
          club_id: CLUB_ID,
          hole_number: hoyo.hole_number,
          par: hoyo.par,
          si: hoyo.si,
          gross_score: Number(g),
          net_score: Number(g) - v,
          strokes_given: v,
        }, { onConflict: 'game_round_id,player_id,hole_number', ignoreDuplicates: false })
        if (error) throw error
      }
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  const todosCapturados = jugadores.every(j => {
    const g = scores[j.id]?.[hoyo.hole_number]
    return g !== undefined && g !== ''
  })

  const nA = mejorNetoPareja(parejaA, hoyo)
  const nB = mejorNetoPareja(parejaB, hoyo)

  function tarjetaJugador(j: Jugador, colorPareja: string, esMejor: boolean) {
    const v = ventajaEnHoyo(j.hcp, hoyo.si)
    const g = scores[j.id]?.[hoyo.hole_number] ?? ''
    const net = g !== '' ? Number(g) - v : null
    return (
      <div key={j.id} style={{
        background: '#0d2410', borderRadius: 10, padding: '10px',
        border: `1px solid ${esMejor ? colorPareja : colorPareja + '33'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 'bold' }}>{j.nombre.split(' ')[0]}</span>
          {v > 0 && (
            <span style={{ background: colorPareja + '22', color: colorPareja, borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>+{v}</span>
          )}
        </div>
        <input
          type="number" min={1} max={15}
          value={g}
          onChange={e => updateScore(j.id, e.target.value)}
          disabled={!esAdmin}
          placeholder={`Par ${hoyo.par}`}
          style={{
            width: '100%', background: '#162a1a', border: `1px solid ${colorPareja}44`,
            borderRadius: 8, color: '#e8f5e9', fontFamily: 'Georgia, serif',
            fontSize: 22, fontWeight: 'bold', textAlign: 'center', padding: '8px 0', boxSizing: 'border-box',
            opacity: esAdmin ? 1 : 0.6,
          }}
        />
        {net !== null && (
          <div style={{ textAlign: 'center', marginTop: 4, fontSize: 11, color: esMejor ? colorPareja : '#81c784', fontWeight: esMejor ? 'bold' : 'normal' }}>
            Neto: {net}{esMejor ? ' ✓' : ''}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
<div style={{ marginBottom: 10 }}>
          <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{
            background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
            padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>← Dashboard</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase' }}>Fourball — 2 vs 2</div>
           <div style={{ fontSize: 16, fontWeight: 'bold' }}>{nombreCampo || 'Campo'}</div>
          </div>
          <div style={{ padding: '6px 16px', borderRadius: 20, background: marcadorColor + '33', color: marcadorColor, fontSize: 16, fontWeight: 'bold' }}>
            {marcadorLabel}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorA }} />
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>Pareja A</span>
            <span style={{ fontSize: 10, color: '#81c784' }}>{parejaA.map(j => j.nombre.split(' ')[0]).join(' / ')}</span>
          </div>
          <span style={{ fontSize: 11, color: '#4a7a50' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#81c784' }}>{parejaB.map(j => j.nombre.split(' ')[0]).join(' / ')}</span>
            <span style={{ fontSize: 12, fontWeight: 'bold' }}>Pareja B</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorB }} />
          </div>
        </div>
      </div>

      {/* Etiqueta de modo */}
      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición' : '👁️ Modo Solo Lectura — no se puede capturar'}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>Hoyo</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {hoyos.map((h, i) => {
              const jugado = resultadoHoyo[h.hole_number] != null
              return (
                <button key={i} onClick={() => setHoyoActivo(i)} style={{
                  width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                  background: hoyoActivo === i ? '#2ECC71' : jugado ? '#1a3a1f' : '#162a1a',
                  color: hoyoActivo === i ? '#0a1a0f' : jugado ? '#81c784' : '#4a7a50',
                  fontWeight: hoyoActivo === i ? 'bold' : 'normal', fontSize: 12,
                  border: (jugado && hoyoActivo !== i ? '1px solid #2ECC7155' : '1px solid transparent') as any,
                }}>{h.hole_number}</button>
              )
            })}
          </div>
        </div>

        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 22, fontWeight: 'bold' }}>Hoyo {hoyo.hole_number}</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: '#81c784' }}>Par {hoyo.par}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#81c784' }}>SI</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2ECC71' }}>{hoyo.si}</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: colorA, letterSpacing: 2, marginBottom: 6 }}>PAREJA A</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {parejaA.map(j => {
              const g = scores[j.id]?.[hoyo.hole_number] ?? ''
              const net = g !== '' ? Number(g) - ventajaEnHoyo(j.hcp, hoyo.si) : null
              const esMejor = nA !== null && net !== null && net === nA
              return tarjetaJugador(j, colorA, !!esMejor)
            })}
          </div>

          <div style={{ fontSize: 11, color: colorB, letterSpacing: 2, marginBottom: 6 }}>PAREJA B</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {parejaB.map(j => {
              const g = scores[j.id]?.[hoyo.hole_number] ?? ''
              const net = g !== '' ? Number(g) - ventajaEnHoyo(j.hcp, hoyo.si) : null
              const esMejor = nB !== null && net !== null && net === nB
              return tarjetaJugador(j, colorB, !!esMejor)
            })}
          </div>

          {esAdmin && todosCapturados && (
            <button onClick={guardarHoyo} disabled={guardando} style={{
              width: '100%', marginTop: 12, background: guardando ? '#4a7a50' : '#2ECC71',
              color: '#0a1a0f', border: 'none', borderRadius: 8, padding: '10px',
              cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold',
            }}>
              {guardando ? 'Guardando...' : '💾 Guardar Hoyo'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setHoyoActivo(h => Math.max(0, h - 1))} disabled={hoyoActivo === 0} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #2ECC7144', background: 'transparent', color: '#2ECC71',
              cursor: hoyoActivo === 0 ? 'not-allowed' : 'pointer', opacity: hoyoActivo === 0 ? 0.3 : 1, fontSize: 13,
            }}>← Anterior</button>
            <button onClick={() => setHoyoActivo(h => Math.min(hoyos.length - 1, h + 1))} disabled={hoyoActivo === hoyos.length - 1} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#2ECC71', color: '#0a1a0f',
              cursor: hoyoActivo === hoyos.length - 1 ? 'not-allowed' : 'pointer', opacity: hoyoActivo === hoyos.length - 1 ? 0.5 : 1, fontSize: 13, fontWeight: 'bold',
            }}>Siguiente →</button>
          </div>
        </div>

<button
          onClick={() => window.location.href = `/juego/resumen-fourball?game=${gameId}${adminSuffix}`}
          style={{
            width: '100%', marginBottom: 16,
            background: jugados === hoyos.length && hoyos.length > 0 ? '#F39C12' : 'transparent',
            color: jugados === hoyos.length && hoyos.length > 0 ? '#0a1a0f' : '#F39C12',
            border: jugados === hoyos.length && hoyos.length > 0 ? 'none' : '1px solid #F39C12',
            borderRadius: 10, padding: '12px', cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
          }}
        >
          {jugados === hoyos.length && hoyos.length > 0 ? '🏆 Ver Resumen Final' : '🏆 Ver Resumen (parcial)'}
        </button>

        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 10 }}>Marcador (mejor bola de cada pareja)</div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
              {hoyos.map((h, i) => {
                const r = resultadoHoyo[h.hole_number]
                const jugado = r != null
                const color = r === 'A' ? colorA : r === 'B' ? colorB : '#F39C12'
                return (
                  <div key={i} onClick={() => setHoyoActivo(i)} style={{
                    width: 32, flexShrink: 0, cursor: 'pointer',
                    background: hoyoActivo === i ? '#2ECC7133' : jugado ? color + '22' : '#0d2410',
                    borderRadius: 6, padding: '4px 0', textAlign: 'center',
                    border: (hoyoActivo === i ? '1px solid #2ECC71' : '1px solid transparent') as any,
                  }}>
                    <div style={{ fontSize: 9, color: '#81c784' }}>{h.hole_number}</div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', margin: '2px auto', background: jugado ? color : '#4a7a50' }} />
                    <div style={{ fontSize: 9, color: '#4a7a50' }}>{r === 'A' ? 'A' : r === 'B' ? 'B' : r === 'halved' ? '=' : ''}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}