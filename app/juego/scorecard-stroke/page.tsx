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
}

interface Hoyo {
  hole_number: number
  par: number
  si: number
}

const COLORES = ['#2ECC71', '#3498DB', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#E67E22', '#FF6B9D']

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('game')
}

export default function ScorecardStrokePage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
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

      const { data: hData } = await supabase
        .from('course_holes')
        .select('hole_number, par, si')
        .eq('course_id', COURSE_ID)
        .order('hole_number')
      const holes = hData || []
      setHoyos(holes)

      const { data: grp } = await supabase
        .from('game_round_players')
        .select('player_id, hcp_index')
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
          const hcp = g.hcp_index !== null && g.hcp_index !== undefined ? g.hcp_index : (p?.hcp_base ?? 0)
          return { id: g.player_id, nombre: p?.golf_name || 'Jugador', hcp }
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

  if (!gameId || jugadores.length < 2) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró un juego Stroke Play válido (faltan jugadores o el enlace).</div>
      <button onClick={() => window.location.href = '/juego/nuevo'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
        ← Crear nuevo juego
      </button>
    </div>
  )

  const hoyo = hoyos[hoyoActivo]

  function updateScore(playerId: string, valor: string) {
    setScores(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [hoyo.hole_number]: valor },
    }))
  }

  // total gross acumulado de un jugador
  function totalGross(j: Jugador): number {
    let t = 0
    hoyos.forEach(h => {
      const g = scores[j.id]?.[h.hole_number]
      if (g !== undefined && g !== '') t += Number(g)
    })
    return t
  }

  // cuántos hoyos lleva capturados
  function hoyosCapturados(j: Jugador): number {
    let n = 0
    hoyos.forEach(h => {
      const g = scores[j.id]?.[h.hole_number]
      if (g !== undefined && g !== '') n++
    })
    return n
  }

  async function guardarHoyo() {
    setGuardando(true)
    try {
      for (const j of jugadores) {
        const g = scores[j.id]?.[hoyo.hole_number]
        if (g === undefined || g === '') continue
        const { error } = await supabase.from('hole_scores').upsert({
          game_round_id: gameId,
          player_id: j.id,
          club_id: CLUB_ID,
          hole_number: hoyo.hole_number,
          par: hoyo.par,
          si: hoyo.si,
          gross_score: Number(g),
          net_score: Number(g), // en stroke el neto real se calcula al final (gross total - HCP)
          strokes_given: 0,
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

  const totalHoyosJugados = hoyos.filter(h =>
    jugadores.every(j => {
      const g = scores[j.id]?.[h.hole_number]
      return g !== undefined && g !== ''
    })
  ).length

  function colorDe(i: number) { return COLORES[i % COLORES.length] }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase' }}>Stroke Play</div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>Club Las Misiones</div>
          </div>
          <div style={{ padding: '6px 16px', borderRadius: 20, background: '#2ECC7133', color: '#2ECC71', fontSize: 13, fontWeight: 'bold' }}>
            {jugadores.length} jugadores
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
        {/* Selector de hoyos */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>Hoyo</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {hoyos.map((h, i) => {
              const jugado = jugadores.every(j => {
                const g = scores[j.id]?.[h.hole_number]
                return g !== undefined && g !== ''
              })
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

        {/* Captura del hoyo */}
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

          {/* Lista vertical de jugadores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jugadores.map((j, i) => {
              const g = scores[j.id]?.[hoyo.hole_number] ?? ''
              return (
                <div key={j.id} style={{
                  background: '#0d2410', borderRadius: 10, padding: '10px 12px',
                  border: `1px solid ${colorDe(i)}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorDe(i), flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.nombre}</span>
                    <span style={{ fontSize: 11, color: '#81c784', flexShrink: 0 }}>HCP {j.hcp}</span>
                  </div>
                  <input
                    type="number" min={1} max={15}
                    value={g}
                    onChange={e => updateScore(j.id, e.target.value)}
                    disabled={!esAdmin}
                    placeholder={`${hoyo.par}`}
                    style={{
                      width: 64, background: '#162a1a', border: `1px solid ${colorDe(i)}66`,
                      borderRadius: 8, color: '#e8f5e9', fontFamily: 'Georgia, serif',
                      fontSize: 22, fontWeight: 'bold', textAlign: 'center', padding: '8px 0',
                      flexShrink: 0, opacity: esAdmin ? 1 : 0.6,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {esAdmin && todosCapturados && (
            <button onClick={guardarHoyo} disabled={guardando} style={{
              width: '100%', marginTop: 14, background: guardando ? '#4a7a50' : '#2ECC71',
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

        {/* Botón resumen al terminar */}
{totalHoyosJugados === hoyos.length && hoyos.length > 0 && (
          <button
            onClick={() => window.location.href = `/juego/tarjeta-stroke?game=${gameId}${adminSuffix}`}
            style={{
              width: '100%', marginBottom: 16, background: '#F39C12', color: '#0a1a0f',
              border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
            }}
          >
            📋 Ver Tarjeta y Resultados
          </button>
        )}

        {/* Marcador acumulado (total gross) */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>Total Gross acumulado</div>
          {jugadores.map((j, i) => (
            <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < jugadores.length - 1 ? '1px solid #2ECC7111' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorDe(i) }} />
                <span style={{ fontSize: 13 }}>{j.nombre}</span>
                <span style={{ fontSize: 10, color: '#4a7a50' }}>({hoyosCapturados(j)}/18)</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: colorDe(i) }}>{totalGross(j) || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}