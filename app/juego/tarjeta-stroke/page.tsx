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
interface Hoyo { hole_number: number; par: number; si: number }

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

// formatea el neto vs par: negativo tal cual, 0 = "E", positivo con "+"
function fmtNeto(n: number): string {
  if (n === 0) return 'E'
  if (n > 0) return '+' + n
  return String(n)
}

function colorNeto(n: number): string {
  if (n < 0) return '#2ECC71'   // bajo par = verde
  if (n === 0) return '#F39C12' // par = naranja (destacado)
  return '#e8f5e9'              // sobre par = blanco
}

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('game')
}

export default function TarjetaStrokePage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [tramo, setTramo] = useState<'front' | 'back'>('front')
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
      jugs.forEach(j => { init[j.id] = Object.fromEntries(holes.map(h => [h.hole_number, ''])) })

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', id)
      // OJO: usamos '' como vacío. Un gross de 0 se guarda como '0', nunca se confunde con vacío.
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
      Cargando tarjeta...
    </div>
  )

  if (!gameId || jugadores.length < 2) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  const front = hoyos.filter(h => h.hole_number <= 9)
  const back = hoyos.filter(h => h.hole_number >= 10)
  const tramoActual = tramo === 'front' ? front : back

  function getScore(jid: string, hole: number): string {
    return scores[jid]?.[hole] ?? ''
  }

  // neto vs par de un hoyo (solo si hay gross capturado)
  function netoHoyo(j: Jugador, h: Hoyo): number | null {
    const g = getScore(j.id, h.hole_number)
    if (g === '') return null
    const v = ventajaEnHoyo(j.hcp, h.si)
    return Number(g) - v - h.par
  }

  async function setGolpe(jid: string, hole: number, valor: number) {
    setScores(prev => ({ ...prev, [jid]: { ...prev[jid], [hole]: String(valor) } }))
    setPanel(null)
    const h = hoyos.find(x => x.hole_number === hole)
    if (!h) return
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
        net_score: valor,
        strokes_given: ventajaEnHoyo(jugadores.find(j => j.id === jid)?.hcp ?? 0, h.si),
      }, { onConflict: 'game_round_id,player_id,hole_number', ignoreDuplicates: false })
      if (error) throw error
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  // gross de un tramo
  function grossTramo(jid: string, tr: Hoyo[]): number {
    let s = 0
    tr.forEach(h => { const g = getScore(jid, h.hole_number); if (g !== '') s += Number(g) })
    return s
  }
  // neto vs par de un tramo (suma de netos de hoyo)
  function netoTramo(j: Jugador, tr: Hoyo[]): number {
    let s = 0
    tr.forEach(h => { const n = netoHoyo(j, h); if (n !== null) s += n })
    return s
  }

  function abrirPanel(jid: string, hole: number) {
    if (!esAdmin) return
    setPanel({ jugadorId: jid, hole })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>📋 Tarjeta Stroke Play</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
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
        {/* Botones FRONT / BACK */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTramo('front')} style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: 13,
            background: tramo === 'front' ? '#2ECC71' : 'transparent', color: tramo === 'front' ? '#0a1a0f' : '#2ECC71', border: '1px solid #2ECC71',
          }}>FRONT (1-9)</button>
          <button onClick={() => setTramo('back')} style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: 13,
            background: tramo === 'back' ? '#2ECC71' : 'transparent', color: tramo === 'back' ? '#0a1a0f' : '#2ECC71', border: '1px solid #2ECC71',
          }}>BACK (10-18)</button>
        </div>

        {/* Cuadrícula */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '12px', border: '1px solid #2ECC7133', marginBottom: 16, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '6px 10px', textAlign: 'left', color: '#81c784', fontWeight: 'normal', minWidth: 80, zIndex: 2 }}>Hoyo</th>
                {tramoActual.map(h => (
                  <th key={h.hole_number} style={{ padding: '6px 6px', textAlign: 'center', color: '#e8f5e9', minWidth: 42 }}>{h.hole_number}</th>
                ))}
                <th style={{ padding: '6px 10px', textAlign: 'center', color: '#2ECC71', fontWeight: 'bold' }}>{tramo === 'front' ? 'FRONT' : 'BACK'}</th>
              </tr>
              <tr>
                <td style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '2px 10px', textAlign: 'left', color: '#4a7a50', fontSize: 9, zIndex: 2 }}>Par</td>
                {tramoActual.map(h => (<td key={h.hole_number} style={{ padding: '2px 6px', textAlign: 'center', color: '#4a7a50', fontSize: 10 }}>{h.par}</td>))}
                <td style={{ padding: '2px 10px', textAlign: 'center', color: '#4a7a50', fontSize: 10 }}>{tramoActual.reduce((a, h) => a + h.par, 0)}</td>
              </tr>
              <tr>
                <td style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '2px 10px', textAlign: 'left', color: '#4a7a50', fontSize: 9, zIndex: 2 }}>SI</td>
                {tramoActual.map(h => (<td key={h.hole_number} style={{ padding: '2px 6px', textAlign: 'center', color: '#4a7a50', fontSize: 10 }}>{h.si}</td>))}
                <td style={{ padding: '2px 10px' }}></td>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((j, idx) => {
                const netoTr = netoTramo(j, tramoActual)
                return (
                  <tr key={j.id} style={{ background: idx % 2 === 0 ? '#162a1a' : 'transparent' }}>
                    <td style={{ position: 'sticky', left: 0, background: idx % 2 === 0 ? '#162a1a' : '#0a1a0f', padding: '6px 10px', textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 2 }}>{j.nombre.split(' ')[0]}</td>
                    {tramoActual.map(h => {
                      const g = getScore(j.id, h.hole_number)
                      const v = ventajaEnHoyo(j.hcp, h.si)
                      const n = netoHoyo(j, h)
                      return (
                        <td key={h.hole_number} style={{ padding: '4px 4px', textAlign: 'center' }}>
                          <div onClick={() => abrirPanel(j.id, h.hole_number)} style={{
                            width: 40, minHeight: 40, margin: '0 auto', padding: '3px 0',
                            border: `1px solid ${g !== '' ? '#2ECC71' : '#2ECC7144'}`,
                            borderRadius: 8, cursor: esAdmin ? 'pointer' : 'default',
                            background: g !== '' ? '#0d2410' : 'transparent', position: 'relative',
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 'bold', color: g !== '' ? '#e8f5e9' : '#4a7a50', lineHeight: '18px' }}>
                              {g !== '' ? g : '–'}
                            </div>
                            {n !== null && (
                              <div style={{ fontSize: 9, fontWeight: 'bold', color: colorNeto(n), lineHeight: '11px' }}>
                                {fmtNeto(n)}
                              </div>
                            )}
                            {v > 0 && (<span style={{ position: 'absolute', top: 3, right: 4, width: 4, height: 4, borderRadius: '50%', background: '#F39C12' }} />)}
                          </div>
                        </td>
                      )
                    })}
                    <td style={{ padding: '4px 10px', textAlign: 'center', fontWeight: 'bold', color: colorNeto(netoTr), fontSize: 15 }}>{fmtNeto(netoTr)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Tabla de resultados: Net FRONT, Net BACK, Net TOTAL */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>Resultados (neto vs par)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 'max-content', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#4a7a50', fontWeight: 'normal' }}>Jugador</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#4a7a50', fontWeight: 'normal' }}>HCP</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#e8f5e9', fontWeight: 'normal' }}>Gross</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#81c784', fontWeight: 'normal' }}>Net F</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#81c784', fontWeight: 'normal' }}>Net B</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#2ECC71', fontWeight: 'bold' }}>Net Total</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j, idx) => {
                  const gross = grossTramo(j.id, hoyos)
                  const nf = netoTramo(j, front)
                  const nb = netoTramo(j, back)
                  const nt = nf + nb
                  return (
                    <tr key={j.id} style={{ background: idx % 2 === 0 ? '#0d2410' : 'transparent' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{j.nombre.split(' ')[0]}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#81c784' }}>{j.hcp}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{gross}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: colorNeto(nf), fontWeight: 'bold' }}>{fmtNeto(nf)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: colorNeto(nb), fontWeight: 'bold' }}>{fmtNeto(nb)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: colorNeto(nt), fontWeight: 'bold', fontSize: 14 }}>{fmtNeto(nt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#81c784', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F39C12', display: 'inline-block' }} />
              Punto naranja: hoyo donde el jugador recibe ventaja
            </div>
            <div>Neto = gross − ventaja − par. &nbsp; E = par (even), verde = bajo par.</div>
          </div>
        </div>

        {/* Botón ranking */}
        <button onClick={() => window.location.href = `/juego/resumen-stroke?game=${gameId}${adminSuffix}`} style={{
          width: '100%', background: '#F39C12', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
        }}>🏆 Ver Ranking de Ganadores</button>
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
                {jugadores.find(j => j.id === panel.jugadorId)?.nombre} — Hoyo {panel.hole}
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