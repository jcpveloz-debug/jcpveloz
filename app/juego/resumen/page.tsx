'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Jugador { id: string; nombre: string; hcp: number; team: string }
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

const COLOR1 = '#2ECC71'
const COLOR2 = '#3498DB'

export default function ResumenSinglesPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [j1, setJ1] = useState<Jugador | null>(null)
  const [j2, setJ2] = useState<Jugador | null>(null)
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setHoyos(hData || [])

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
          return { id: g.player_id, nombre: p?.golf_name || 'Jugador', hcp, team: String(g.team_number) }
        })
      }
      jugs.sort((a, b) => a.team.localeCompare(b.team))
      setJ1(jugs[0] || null)
      setJ2(jugs[1] || null)

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('*')
        .eq('game_round_id', id)
        .order('hole_number')
      setScores(sData || [])
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando resultados...
    </div>
  )

  if (!gameId || !j1 || !j2) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  const hcpDiff = Math.abs(j1.hcp - j2.hcp)
  const idConVentaja = j1.hcp > j2.hcp ? j1.id : j2.id
  const nombreConVentaja = j1.hcp > j2.hcp ? j1.nombre : j2.nombre

  let acumulado = 0
  let holesWonJ1 = 0
  let holesWonJ2 = 0
  let holesHalved = 0
  let totalBrutoJ1 = 0
  let totalBrutoJ2 = 0

  const detalle = hoyos.map(h => {
    const s1 = scores.find(s => s.player_id === j1.id && s.hole_number === h.hole_number)
    const s2 = scores.find(s => s.player_id === j2.id && s.hole_number === h.hole_number)
    if (!s1 || !s2) return { ...h, s1: null, s2: null, ganador: null, acumulado: null as number | null, net1: null, net2: null, v: 0 }

    const v = ventajaEnHoyo(hcpDiff, h.si)
    const net1 = s1.gross_score - (idConVentaja === j1.id ? v : 0)
    const net2 = s2.gross_score - (idConVentaja === j2.id ? v : 0)
    totalBrutoJ1 += s1.gross_score
    totalBrutoJ2 += s2.gross_score

    let ganador: string | null = null
    if (net1 < net2) { acumulado++; holesWonJ1++; ganador = 'j1' }
    else if (net2 < net1) { acumulado--; holesWonJ2++; ganador = 'j2' }
    else { holesHalved++; ganador = 'halved' }

    return { ...h, s1, s2, net1, net2, v, ganador, acumulado }
  })

  const hoyosJugados = detalle.filter(h => h.s1 !== null).length
  const absAc = Math.abs(acumulado)
  const holesLeft = hoyos.length - hoyosJugados
  const finished = absAc > holesLeft
  const marcadorLabel = acumulado === 0 ? 'All Square' : finished ? `${absAc}&${holesLeft}` : `${absAc} UP`
  const ganadorFinal = acumulado > 0 ? j1 : acumulado < 0 ? j2 : null
  const marcadorColor = acumulado === 0 ? '#2ECC71' : acumulado > 0 ? COLOR1 : COLOR2

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>🏆 Resumen Final</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '20px 16px 60px' }}>
        {/* Tarjeta resultado */}
        <div style={{ background: 'linear-gradient(135deg, #1a2e1d, #0d2410)', borderRadius: 16, padding: '20px', border: `1px solid ${marcadorColor}44`, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: marcadorColor + '15', pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#81c784', textTransform: 'uppercase', marginBottom: 14 }}>Match Play Singles — Club Las Misiones</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: COLOR1 + '33', border: `2px solid ${COLOR1}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏌️</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j1.nombre.split(' ')[0]}</div>
              <div style={{ fontSize: 12, color: '#81c784' }}>HCP {j1.hcp}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: 26, fontWeight: 'bold', color: marcadorColor, marginBottom: 4 }}>{marcadorLabel}</div>
              {ganadorFinal ? (
                <div style={{ background: marcadorColor + '22', color: marcadorColor, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 'bold' }}>🏆 {ganadorFinal.nombre.split(' ')[0]}</div>
              ) : (
                <div style={{ fontSize: 12, color: '#81c784' }}>Empate</div>
              )}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: COLOR2 + '33', border: `2px solid ${COLOR2}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏌️</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j2.nombre.split(' ')[0]}</div>
              <div style={{ fontSize: 12, color: '#81c784' }}>HCP {j2.hcp}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Hoyos ganados</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: COLOR1 }}>{holesWonJ1}</span>
                <span style={{ color: '#4a7a50' }}>–</span>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: COLOR2 }}>{holesWonJ2}</span>
              </div>
            </div>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Golpes brutos</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: COLOR1 }}>{totalBrutoJ1}</span>
                <span style={{ color: '#4a7a50' }}>–</span>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: COLOR2 }}>{totalBrutoJ2}</span>
              </div>
            </div>
            <div style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Halved</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#F39C12' }}>{holesHalved}</div>
            </div>
          </div>

          {hcpDiff > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#81c784', textAlign: 'center' }}>
              {nombreConVentaja.split(' ')[0]} recibió {hcpDiff} ventaja{hcpDiff !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Tabla detalle */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>Detalle por Hoyo</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'left', fontWeight: 'normal' }}>Hoyo</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Par</th>
                  <th style={{ padding: '4px 6px', color: COLOR1, textAlign: 'center', fontWeight: 'bold' }}>{j1.nombre.split(' ')[0]}</th>
                  <th style={{ padding: '4px 4px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Res.</th>
                  <th style={{ padding: '4px 6px', color: COLOR2, textAlign: 'center', fontWeight: 'bold' }}>{j2.nombre.split(' ')[0]}</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Acc.</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((h, i) => {
                  if (!h.s1) return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent', opacity: 0.4 }}>
                      <td style={{ padding: '5px 6px', color: '#81c784', fontWeight: 'bold' }}>{h.hole_number}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.par}</td>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#4a7a50', fontSize: 11 }}>Sin jugar</td>
                    </tr>
                  )
                  const resBg = h.ganador === 'j1' ? COLOR1 + '33' : h.ganador === 'j2' ? COLOR2 + '33' : '#2ECC7122'
                  const resColor = h.ganador === 'j1' ? COLOR1 : h.ganador === 'j2' ? COLOR2 : '#2ECC71'
                  const resLabel = h.ganador === 'j1' ? '▲' : h.ganador === 'j2' ? '▼' : '='
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent' }}>
                      <td style={{ padding: '5px 6px', color: '#81c784', fontWeight: 'bold' }}>{h.hole_number}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.par}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {h.s1.gross_score}
                        {h.v > 0 && idConVentaja === j1.id && (<sup style={{ color: '#F39C12', fontSize: 8 }}>+{h.v}</sup>)}
                        <span style={{ color: COLOR1, fontSize: 10 }}> ({h.net1})</span>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                        <span style={{ background: resBg, color: resColor, borderRadius: 4, padding: '2px 6px', fontSize: 13 }}>{resLabel}</span>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {h.s2.gross_score}
                        {h.v > 0 && idConVentaja === j2.id && (<sup style={{ color: '#F39C12', fontSize: 8 }}>+{h.v}</sup>)}
                        <span style={{ color: COLOR2, fontSize: 10 }}> ({h.net2})</span>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <span style={{ color: h.acumulado === 0 ? '#2ECC71' : (h.acumulado || 0) > 0 ? COLOR1 : COLOR2, fontWeight: 'bold', fontSize: 11 }}>
                          {h.acumulado === 0 ? 'AS' : `${Math.abs(h.acumulado || 0)}`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => window.location.href = `/juego/scorecard?game=${gameId}${esAdmin ? '&admin=1' : ''}`} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>← Scorecard</button>
          <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{ flex: 1, background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold' }}>Dashboard →</button>
        </div>
      </div>
    </div>
  )
}