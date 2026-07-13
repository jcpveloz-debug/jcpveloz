'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Jugador {
  id: string
  nombre: string
  hcp: number
  pareja: number
}
interface Hoyo { hole_number: number; par: number; si: number }

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

function romano(n: number): string {
  const mapa: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let r = ''; let num = n
  for (const [valor, simbolo] of mapa) { while (num >= valor) { r += simbolo; num -= valor } }
  return r
}

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('game')
}

export default function BolaBajaTarjetaPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [clubId, setClubId] = useState<string>('')
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [tramo, setTramo] = useState<'front' | 'back'>('front')
  const [panel, setPanel] = useState<{ jugadorId: string; hole: number } | null>(null)
  const [nombreCampo, setNombreCampo] = useState('')

  useEffect(() => {
    const id = leerGameId()
    setGameId(id)
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      if (!id) { setLoading(false); return }

      const { data: rondaData } = await supabase
        .from('game_rounds')
        .select('course_id, club_id')
        .eq('id', id)
        .single()
      const cursoDelJuego = rondaData?.course_id
      setClubId(rondaData?.club_id || '')

      // nombre del campo (para el texto de compartir)
      if (cursoDelJuego) {
        const { data: cData } = await supabase
          .from('golf_courses')
          .select('name')
          .eq('id', cursoDelJuego)
          .single()
        setNombreCampo(cData?.name || '')
      }

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
          const hcp = g.hcp_index !== null && g.hcp_index !== undefined ? g.hcp_index : (p?.hcp_base ?? 0)
          return { id: g.player_id, nombre: p?.golf_name || 'Jugador', hcp, pareja: Number(g.team_number) || 0 }
        })
        jugs.sort((a, b) => a.pareja - b.pareja)
      }
      setJugadores(jugs)

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
      Cargando tarjeta...
    </div>
  )

  if (!gameId || jugadores.length < 1) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontro el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>Dashboard</button>
    </div>
  )

  const front = hoyos.filter(h => h.hole_number <= 9)
  const back = hoyos.filter(h => h.hole_number >= 10)
  const tramoActual = tramo === 'front' ? front : back

  function getScore(jid: string, hole: number): string {
    return scores[jid]?.[hole] ?? ''
  }

  function netoGolpes(j: Jugador, h: Hoyo): number | null {
    const g = getScore(j.id, h.hole_number)
    if (g === '') return null
    const v = ventajaEnHoyo(j.hcp, h.si)
    return Number(g) - v
  }

  const numerosPareja = Array.from(new Set(jugadores.map(j => j.pareja))).sort((a, b) => a - b)

  function jugadoresDePareja(num: number): Jugador[] {
    return jugadores.filter(j => j.pareja === num)
  }

  function bolaBajaHoyo(num: number, h: Hoyo): number | null {
    const js = jugadoresDePareja(num)
    const netos = js.map(j => netoGolpes(j, h)).filter(n => n !== null) as number[]
    if (netos.length === 0) return null
    return Math.min(...netos)
  }

  function totalParejaTramo(num: number, tr: Hoyo[]): number {
    let s = 0
    tr.forEach(h => { const b = bolaBajaHoyo(num, h); if (b !== null) s += b })
    return s
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
        club_id: clubId,
        hole_number: hole,
        par: h.par,
        si: h.si,
        gross_score: valor,
        net_score: valor - ventajaEnHoyo(jugadores.find(j => j.id === jid)?.hcp ?? 0, h.si),
        strokes_given: ventajaEnHoyo(jugadores.find(j => j.id === jid)?.hcp ?? 0, h.si),
      }, { onConflict: 'game_round_id,player_id,hole_number', ignoreDuplicates: false })
      if (error) throw error
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  async function borrarGolpe(jid: string, hole: number) {
    setScores(prev => ({ ...prev, [jid]: { ...prev[jid], [hole]: '' } }))
    setPanel(null)
    setGuardando(true)
    try {
      const { error } = await supabase.from('hole_scores')
        .delete()
        .eq('game_round_id', gameId)
        .eq('player_id', jid)
        .eq('hole_number', hole)
      if (error) throw error
    } catch (err: any) {
      alert('Error al borrar: ' + (err?.message || err))
    } finally {
      setGuardando(false)
    }
  }

  function abrirPanel(jid: string, hole: number) {
    if (!esAdmin) return
    setPanel({ jugadorId: jid, hole })
  }

  // ---- COMPARTIR RESULTADOS ----
  async function compartirResultados() {
    // parejas ordenadas por total neto (menor gana)
    const filas = numerosPareja.map(num => {
      const total = totalParejaTramo(num, front) + totalParejaTramo(num, back)
      const nombres = jugadoresDePareja(num).map(j => j.nombre.split(' ')[0]).join(' / ')
      return { num, total, nombres }
    }).sort((a, b) => a.total - b.total)

    let texto = 'Resultados Bola Baja en Parejas'
    if (nombreCampo) texto += ' - ' + nombreCampo
    texto += '\n\n'
    filas.forEach((f, i) => {
      texto += (i + 1) + '. Pareja ' + romano(f.num) + ' (' + f.nombres + ') - Neto ' + f.total + '\n'
    })
    texto += '\nJuega tu tambien en Kriter Golf Club:\nhttps://kriter-golf-club.vercel.app'

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Kriter Golf Club', text: texto })
      } catch (err) {
        // usuario cancelo
      }
    } else {
      const url = 'https://wa.me/?text=' + encodeURIComponent(texto)
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Bola Baja en Parejas</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>Dashboard</button>
      </div>

      {/* Etiqueta de modo */}
      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? 'Modo Edicion - toca una celda para capturar' : 'Modo Solo Lectura'}
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

        {/* Una tabla por PAREJA */}
        {numerosPareja.map(num => {
          const js = jugadoresDePareja(num)
          const totalTr = totalParejaTramo(num, tramoActual)
          return (
            <div key={num} style={{ background: '#1a2e1d', borderRadius: 14, padding: '12px', border: '1px solid #2ECC7133', marginBottom: 16, overflowX: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#F39C12', marginBottom: 8, letterSpacing: 1 }}>PAREJA {romano(num)}</div>
              <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 'max-content' }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, background: '#1a2e1d', padding: '6px 10px', textAlign: 'left', color: '#81c784', fontWeight: 'normal', minWidth: 90, zIndex: 2 }}>Hoyo</th>
                    {tramoActual.map(h => (
                      <th key={h.hole_number} style={{ padding: '6px 6px', textAlign: 'center', color: '#e8f5e9', minWidth: 42 }}>{h.hole_number}</th>
                    ))}
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: '#2ECC71', fontWeight: 'bold' }}>{tramo === 'front' ? 'F' : 'B'}</th>
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
                  {js.map((j, idx) => (
                    <tr key={j.id} style={{ background: idx % 2 === 0 ? '#162a1a' : 'transparent' }}>
                      <td style={{ position: 'sticky', left: 0, background: idx % 2 === 0 ? '#162a1a' : '#0a1a0f', padding: '6px 10px', textAlign: 'left', whiteSpace: 'nowrap', zIndex: 2 }}>
                        <div style={{ fontWeight: 'bold' }}>{j.nombre.split(' ')[0]}</div>
                        <div style={{ fontSize: 9, color: '#81c784', fontWeight: 'normal', marginTop: 2 }}>HCP {j.hcp}</div>
                      </td>
                      {tramoActual.map(h => {
                        const g = getScore(j.id, h.hole_number)
                        const v = ventajaEnHoyo(j.hcp, h.si)
                        const nGolpes = netoGolpes(j, h)
                        const bb = bolaBajaHoyo(j.pareja, h)
                        const esBolaBaja = nGolpes !== null && bb !== null && nGolpes === bb
                        return (
                          <td key={h.hole_number} style={{ padding: '4px 0', textAlign: 'center', borderLeft: '1px solid #2ECC7122' }}>
                            <div onClick={() => abrirPanel(j.id, h.hole_number)} style={{
                              width: 42, minHeight: 40, margin: '0 auto', padding: '3px 0',
                              cursor: esAdmin ? 'pointer' : 'default', position: 'relative',
                              background: esBolaBaja ? '#2ECC7122' : 'transparent', borderRadius: 6,
                            }}>
                              <div style={{ position: 'relative', width: 26, height: 26, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 16, fontWeight: 'bold', color: g !== '' ? '#e8f5e9' : '#4a7a50', lineHeight: '16px' }}>
                                  {g !== '' ? g : '-'}
                                </span>
                              </div>
                              {nGolpes !== null && (
                                <div style={{ fontSize: 9, fontWeight: 'bold', color: esBolaBaja ? '#2ECC71' : '#81c784', lineHeight: '11px', marginTop: 2 }}>
                                  {nGolpes}
                                </div>
                              )}
                              {v > 0 && (<span style={{ position: 'absolute', top: 3, right: 6, width: 4, height: 4, borderRadius: '50%', background: '#F39C12' }} />)}
                            </div>
                          </td>
                        )
                      })}
                      <td style={{ padding: '4px 10px' }}></td>
                    </tr>
                  ))}
                  {/* Fila BOLA BAJA de la pareja */}
                  <tr style={{ background: '#0d2410', borderTop: '2px solid #2ECC7144' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#0d2410', padding: '6px 10px', textAlign: 'left', whiteSpace: 'nowrap', zIndex: 2, fontWeight: 'bold', color: '#2ECC71', fontSize: 11 }}>BOLA BAJA</td>
                    {tramoActual.map(h => {
                      const bb = bolaBajaHoyo(num, h)
                      return (
                        <td key={h.hole_number} style={{ padding: '6px 0', textAlign: 'center', borderLeft: '1px solid #2ECC7122', fontWeight: 'bold', color: '#2ECC71', fontSize: 14 }}>
                          {bb !== null ? bb : '-'}
                        </td>
                      )
                    })}
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', color: '#2ECC71', fontSize: 15 }}>{totalTr}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Tabla resumen: total neto por pareja */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>Totales por Pareja (bola baja neta)</div>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#4a7a50', fontWeight: 'normal' }}>Pareja</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: '#81c784', fontWeight: 'normal' }}>Front</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: '#81c784', fontWeight: 'normal' }}>Back</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: '#2ECC71', fontWeight: 'bold' }}>Total Neto</th>
              </tr>
            </thead>
            <tbody>
              {numerosPareja.map((num, idx) => {
                const tf = totalParejaTramo(num, front)
                const tb = totalParejaTramo(num, back)
                const tt = tf + tb
                const js = jugadoresDePareja(num)
                return (
                  <tr key={num} style={{ background: idx % 2 === 0 ? '#0d2410' : 'transparent' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {romano(num)} <span style={{ fontSize: 10, color: '#81c784', fontWeight: 'normal' }}>({js.map(j => j.nombre.split(' ')[0]).join(' / ')})</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#81c784' }}>{tf}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#81c784' }}>{tb}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#2ECC71', fontWeight: 'bold', fontSize: 15 }}>{tt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 10, color: '#81c784', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F39C12', display: 'inline-block' }} />
              Punto naranja: hoyo donde el jugador recibe ventaja
            </div>
            <div>El numero bajo el gross es el neto (gross - ventaja). La bola baja es el menor neto de la pareja. Fondo verde = ese jugador aporto la bola baja.</div>
          </div>
        </div>

        {/* Boton COMPARTIR */}
        <button onClick={compartirResultados} style={{
          width: '100%', background: '#25D366', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>&#128241;</span> Compartir Resultados
        </button>

        {/* Boton ranking */}
        <button onClick={() => window.location.href = `/juego/bola-baja-ranking?game=${gameId}${adminSuffix}`} style={{
          width: '100%', background: '#F39C12', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
        }}>Ver Ranking de Parejas</button>
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
                {jugadores.find(j => j.id === panel.jugadorId)?.nombre} - Hoyo {panel.hole}
              </div>
              <div style={{ fontSize: 11, color: '#81c784', marginTop: 2 }}>
                Par {hoyos.find(h => h.hole_number === panel.hole)?.par} - Toca los golpes
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
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={() => borrarGolpe(panel.jugadorId, panel.hole)} style={{
                flex: 1, background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c',
                borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold',
              }}>Borrar</button>
              <button onClick={() => setPanel(null)} style={{
                flex: 1, background: 'transparent', color: '#81c784', border: '1px solid #2ECC7144',
                borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
              }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}