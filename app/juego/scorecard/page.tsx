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
  team: string
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

const COLOR1 = '#2ECC71'
const COLOR2 = '#3498DB'

export default function ScorecardSinglesPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [j1, setJ1] = useState<Jugador | null>(null)
  const [j2, setJ2] = useState<Jugador | null>(null)
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [panel, setPanel] = useState<{ jugadorId: string; hole: number } | null>(null)

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
      // ordenar: team 1 primero
      jugs.sort((a, b) => a.team.localeCompare(b.team))
      setJ1(jugs[0] || null)
      setJ2(jugs[1] || null)

      const init: Record<string, Record<number, string>> = {}
      jugs.forEach(j => { init[j.id] = Object.fromEntries(holes.map(h => [h.hole_number, ''])) })

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', id)
      sData?.forEach(s => {
        if (init[s.player_id] && s.gross_score !== null && s.gross_score !== undefined) {
          init[s.player_id][s.hole_number] = String(s.gross_score)
        }
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

  if (!gameId || !j1 || !j2) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró un juego de Match Play válido.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  // diferencia de hcp: el de mayor hcp recibe ventaja
  const hcpDiff = Math.abs(j1.hcp - j2.hcp)
  const idConVentaja = j1.hcp > j2.hcp ? j1.id : j2.id

  function getScore(jid: string, hole: number): string {
    return scores[jid]?.[hole] ?? ''
  }

  function netoHoyo(j: Jugador, h: Hoyo): number | null {
    const g = getScore(j.id, h.hole_number)
    if (g === '') return null
    const v = j.id === idConVentaja ? ventajaEnHoyo(hcpDiff, h.si) : 0
    return Number(g) - v
  }

  async function setGolpe(jid: string, hole: number, valor: number) {
    setScores(prev => ({ ...prev, [jid]: { ...prev[jid], [hole]: String(valor) } }))
    setPanel(null)
    const h = hoyos.find(x => x.hole_number === hole)
    if (!h) return
    const jug = jid === j1!.id ? j1! : j2!
    const v = jid === idConVentaja ? ventajaEnHoyo(hcpDiff, h.si) : 0
    setGuardando(true)
    try {
      const { error } = await supabase.from('hole_scores').upsert({
        game_round_id: gameId,
        player_id: jid,
        club_id: CLUB_ID,
        hole_number: hole,
        par: h.par,
        si: h.si,
        gross_score: valor,
        net_score: valor - v,
        strokes_given: v,
      }, { onConflict: 'game_round_id,player_id,hole_number', ignoreDuplicates: false })
      if (error) throw error
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  // marcador match play
  let acumulado = 0
  let jugados = 0
  const resultadoHoyo: Record<number, 'j1' | 'j2' | 'halved' | null> = {}
  hoyos.forEach(h => {
    const n1 = netoHoyo(j1, h)
    const n2 = netoHoyo(j2, h)
    if (n1 === null || n2 === null) { resultadoHoyo[h.hole_number] = null; return }
    jugados++
    if (n1 < n2) { acumulado++; resultadoHoyo[h.hole_number] = 'j1' }
    else if (n2 < n1) { acumulado--; resultadoHoyo[h.hole_number] = 'j2' }
    else resultadoHoyo[h.hole_number] = 'halved'
  })
  const absAc = Math.abs(acumulado)
  const restantes = hoyos.length - jugados
  const finished = jugados > 0 && absAc > restantes
  const marcadorLabel = acumulado === 0 ? 'All Square' : finished ? `${absAc}&${restantes}` : `${absAc} UP`
  const marcadorColor = acumulado === 0 ? '#2ECC71' : acumulado > 0 ? COLOR1 : COLOR2

  function abrirPanel(jid: string, hole: number) {
    if (!esAdmin) return
    setPanel({ jugadorId: jid, hole })
  }

  function celdaJugador(j: Jugador, color: string, h: Hoyo) {
    const g = getScore(j.id, h.hole_number)
    const v = j.id === idConVentaja ? ventajaEnHoyo(hcpDiff, h.si) : 0
    const n = netoHoyo(j, h)
    return (
      <td style={{ padding: '4px 0', textAlign: 'center', borderLeft: '1px solid #2ECC7122' }}>
        <div onClick={() => abrirPanel(j.id, h.hole_number)} style={{
          width: 42, minHeight: 40, margin: '0 auto', padding: '3px 0',
          cursor: esAdmin ? 'pointer' : 'default', position: 'relative',
        }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: g !== '' ? '#e8f5e9' : '#4a7a50', lineHeight: '18px' }}>
            {g !== '' ? g : '–'}
          </div>
          {n !== null && (
            <div style={{ fontSize: 9, color: color, lineHeight: '11px' }}>n{n}</div>
          )}
          {v > 0 && (<span style={{ position: 'absolute', top: 3, right: 6, width: 4, height: 4, borderRadius: '50%', background: '#F39C12' }} />)}
        </div>
      </td>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{
            background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
            padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>← Dashboard</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase' }}>Match Play Singles</div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>Club Las Misiones</div>
          </div>
          <div style={{ padding: '6px 16px', borderRadius: 20, background: marcadorColor + '33', color: marcadorColor, fontSize: 16, fontWeight: 'bold' }}>
            {marcadorLabel}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR1 }} />
            <span style={{ fontSize: 13, fontWeight: 'bold' }}>{j1.nombre.split(' ')[0]}</span>
            <span style={{ fontSize: 11, color: '#81c784' }}>({j1.hcp})</span>
          </div>
          <span style={{ fontSize: 11, color: '#4a7a50' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#81c784' }}>({j2.hcp})</span>
            <span style={{ fontSize: 13, fontWeight: 'bold' }}>{j2.nombre.split(' ')[0]}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR2 }} />
          </div>
        </div>
      </div>

      {/* Etiqueta de modo */}
      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición — toca una celda para capturar' : '👁️ Modo Solo Lectura'}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {hcpDiff > 0 && (
          <div style={{ fontSize: 11, color: '#81c784', marginBottom: 12, textAlign: 'center' }}>
            {(idConVentaja === j1.id ? j1.nombre : j2.nombre).split(' ')[0]} recibe {hcpDiff} ventaja{hcpDiff !== 1 ? 's' : ''} (punto naranja)
          </div>
        )}

        {/* Cuadrícula FRONT */}
        {[{ tit: 'FRONT (1-9)', hs: hoyos.filter(h => h.hole_number <= 9) }, { tit: 'BACK (10-18)', hs: hoyos.filter(h => h.hole_number >= 10) }].map((tramo, ti) => (
          <div key={ti} style={{ background: '#1a2e1d', borderRadius: 14, padding: '12px', border: '1px solid #2ECC7133', marginBottom: 14, overflowX: 'auto' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 8 }}>{tramo.tit}</div>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 'max-content' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '6px 10px', textAlign: 'left', color: '#81c784', fontWeight: 'normal', minWidth: 70, zIndex: 2 }}>Hoyo</th>
                  {tramo.hs.map(h => (<th key={h.hole_number} style={{ padding: '6px 0', textAlign: 'center', color: '#e8f5e9', minWidth: 42, borderLeft: '1px solid #2ECC7122' }}>{h.hole_number}</th>))}
                </tr>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '2px 10px', textAlign: 'left', color: '#4a7a50', fontSize: 9, zIndex: 2 }}>Par/SI</td>
                  {tramo.hs.map(h => (<td key={h.hole_number} style={{ padding: '2px 0', textAlign: 'center', color: '#4a7a50', fontSize: 9, borderLeft: '1px solid #2ECC7122' }}>{h.par}/{h.si}</td>))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: '#162a1a', padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', color: COLOR1, zIndex: 2 }}>{j1.nombre.split(' ')[0]}</td>
                  {tramo.hs.map(h => <td key={h.hole_number} style={{ padding: 0 }}>{celdaJugador(j1, COLOR1, h)}</td>)}
                </tr>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: '#0a1a0f', padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', color: COLOR2, zIndex: 2 }}>{j2.nombre.split(' ')[0]}</td>
                  {tramo.hs.map(h => <td key={h.hole_number} style={{ padding: 0 }}>{celdaJugador(j2, COLOR2, h)}</td>)}
                </tr>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '4px 10px', textAlign: 'left', color: '#81c784', fontSize: 10, zIndex: 2 }}>Gana</td>
                  {tramo.hs.map(h => {
                    const r = resultadoHoyo[h.hole_number]
                    const txt = r === 'j1' ? j1.nombre.split(' ')[0][0] : r === 'j2' ? j2.nombre.split(' ')[0][0] : r === 'halved' ? '=' : ''
                    const col = r === 'j1' ? COLOR1 : r === 'j2' ? COLOR2 : '#F39C12'
                    return <td key={h.hole_number} style={{ padding: '4px 0', textAlign: 'center', borderLeft: '1px solid #2ECC7122', color: col, fontSize: 11, fontWeight: 'bold' }}>{txt}</td>
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Botón resumen siempre visible */}
        <button
          onClick={() => window.location.href = `/juego/resumen?game=${gameId}${adminSuffix}`}
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
      </div>

      {/* Mini-panel de captura */}
      {panel && (
        <div onClick={() => setPanel(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a2e1d', borderTop: '2px solid #2ECC71', borderRadius: '16px 16px 0 0',
            padding: 20, width: '100%', maxWidth: 480,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2ECC71' }}>
                {(panel.jugadorId === j1.id ? j1.nombre : j2.nombre)} — Hoyo {panel.hole}
              </div>
              <div style={{ fontSize: 11, color: '#81c784', marginTop: 2 }}>
                Par {hoyos.find(h => h.hole_number === panel.hole)?.par} · Toca los golpes
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <button key={n} onClick={() => setGolpe(panel.jugadorId, panel.hole, n)} style={{
                  height: 52, fontSize: 20, fontWeight: 'bold', borderRadius: 10, cursor: 'pointer',
                  background: '#0d2410', color: '#e8f5e9', border: '1px solid #2ECC7144', fontFamily: 'Georgia, serif',
                }}>{n}</button>
              ))}
            </div>
            <button onClick={() => setPanel(null)} style={{
              width: '100%', marginTop: 14, background: 'transparent', color: '#81c784', border: '1px solid #2ECC7144',
              borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
            }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}