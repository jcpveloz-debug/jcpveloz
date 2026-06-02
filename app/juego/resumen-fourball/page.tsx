'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Jugador {
  id: string
  nombre: string
  hcp: number
  pareja: 'A' | 'B'
}
interface Hoyo { hole_number: number; par: number; si: number }

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('game')
}

export default function ResumenFourballPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = leerGameId()
    setGameId(id)
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
          const hcp = g.hcp_index !== null && g.hcp_index !== undefined ? g.hcp_index : (p?.hcp_base ?? 0)
          return {
            id: g.player_id,
            nombre: p?.golf_name || 'Jugador',
            hcp,
            pareja: (String(g.team_number) === '1' ? 'A' : 'B') as 'A' | 'B',
          }
        })
      }
      setJugadores(jugs)

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', id)

      const sc: Record<string, Record<number, number>> = {}
      sData?.forEach(s => {
        if (!sc[s.player_id]) sc[s.player_id] = {}
        sc[s.player_id][s.hole_number] = s.gross_score
      })
      setScores(sc)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando resultados...
    </div>
  )

  if (!gameId || jugadores.length < 4) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  const colorA = '#2ECC71'
  const colorB = '#3498DB'
  const colorHalved = '#F39C12'
  const parejaA = jugadores.filter(j => j.pareja === 'A')
  const parejaB = jugadores.filter(j => j.pareja === 'B')

  function mejorNeto(pareja: Jugador[], h: Hoyo): number | null {
    const netos: number[] = []
    pareja.forEach(j => {
      const g = scores[j.id]?.[h.hole_number]
      if (g !== undefined) netos.push(g - ventajaEnHoyo(j.hcp, h.si))
    })
    return netos.length ? Math.min(...netos) : null
  }

  let acumulado = 0
  let ganA = 0, ganB = 0, halved = 0
  const detalle = hoyos.map(h => {
    const nA = mejorNeto(parejaA, h)
    const nB = mejorNeto(parejaB, h)
    let res: 'A' | 'B' | 'halved' | null = null
    if (nA !== null && nB !== null) {
      if (nA < nB) { acumulado++; ganA++; res = 'A' }
      else if (nB < nA) { acumulado--; ganB++; res = 'B' }
      else { halved++; res = 'halved' }
    }
    return { h, nA, nB, res }
  })

  const jugados = detalle.filter(d => d.res !== null).length
  const absAc = Math.abs(acumulado)
  const restantes = hoyos.length - jugados
  const finished = jugados > 0 && absAc > restantes
  const ganador = acumulado > 0 ? 'A' : acumulado < 0 ? 'B' : null
  const marcadorLabel = acumulado === 0 ? 'All Square' : finished ? `${absAc}&${restantes}` : `${absAc} UP`
  const marcadorColor = acumulado === 0 ? colorHalved : acumulado > 0 ? colorA : colorB
  const nombresA = parejaA.map(j => j.nombre.split(' ')[0]).join(' / ')
  const nombresB = parejaB.map(j => j.nombre.split(' ')[0]).join(' / ')

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>🏆 Resumen Fourball</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '20px 16px 60px' }}>
        {/* Tarjeta resultado */}
        <div style={{ background: 'linear-gradient(135deg, #1a2e1d, #0d2410)', borderRadius: 16, padding: '20px', border: `1px solid ${marcadorColor}44`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#81c784', textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' }}>
            Fourball — Club Las Misiones
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: colorA + '33', border: `2px solid ${colorA}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⛳</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>Pareja A</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{nombresA}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: 26, fontWeight: 'bold', color: marcadorColor, marginBottom: 4 }}>{marcadorLabel}</div>
              {ganador && (
                <div style={{ background: marcadorColor + '22', color: marcadorColor, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 'bold' }}>
                  🏆 Pareja {ganador}
                </div>
              )}
              {!ganador && <div style={{ fontSize: 12, color: '#81c784' }}>Empate</div>}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: colorB + '33', border: `2px solid ${colorB}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⛳</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>Pareja B</div>
              <div style={{ fontSize: 11, color: '#81c784' }}>{nombresB}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Ganó A</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: colorA }}>{ganA}</div>
            </div>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Empatados</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: colorHalved }}>{halved}</div>
            </div>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Ganó B</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: colorB }}>{ganB}</div>
            </div>
          </div>
        </div>

        {/* Tabla detalle */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>Detalle por Hoyo (mejor bola neta)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'left', fontWeight: 'normal' }}>Hoyo</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Par</th>
                  <th style={{ padding: '4px 6px', color: colorA, textAlign: 'center', fontWeight: 'bold' }}>A</th>
                  <th style={{ padding: '4px 6px', color: colorB, textAlign: 'center', fontWeight: 'bold' }}>B</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Res.</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d, i) => {
                  const bg = d.res === 'A' ? colorA + '22' : d.res === 'B' ? colorB + '22' : d.res === 'halved' ? colorHalved + '22' : 'transparent'
                  const label = d.res === 'A' ? '▲ A' : d.res === 'B' ? '▼ B' : d.res === 'halved' ? '= ' : '—'
                  const labelColor = d.res === 'A' ? colorA : d.res === 'B' ? colorB : d.res === 'halved' ? colorHalved : '#4a7a50'
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent' }}>
                      <td style={{ padding: '5px 6px', color: '#81c784', fontWeight: 'bold' }}>{d.h.hole_number}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{d.h.par}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: colorA }}>{d.nA !== null ? d.nA : '—'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: colorB }}>{d.nB !== null ? d.nB : '—'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <span style={{ background: bg, color: labelColor, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 'bold' }}>{label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => window.location.href = `/juego/scorecard-fourball?game=${gameId}`} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>← Scorecard</button>
          <button onClick={() => window.location.href = '/dashboard'} style={{ flex: 1, background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold' }}>Dashboard →</button>
        </div>
      </div>
    </div>
  )
}