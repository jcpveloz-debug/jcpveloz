'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GAME_ROUND_ID = '8a41f62c-fa39-47cf-bb96-acf922aee206'
const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

const J1 = { 
  id: '68ca849f-3e9d-4283-bccc-e60413bf1136',
  nombre: 'Carlos Martínez', 
  hcp: 12, 
  color: '#2ECC71' 
}
const J2 = { 
  id: 'a48a2b69-5858-473f-bb5f-e85bde218d5c',
  nombre: 'Rodrigo Pérez', 
  hcp: 18, 
  color: '#3498DB' 
}

const HOYOS = [
  { hole_number: 1,  par: 4, si: 4  },
  { hole_number: 2,  par: 4, si: 18 },
  { hole_number: 3,  par: 3, si: 8  },
  { hole_number: 4,  par: 4, si: 16 },
  { hole_number: 5,  par: 5, si: 10 },
  { hole_number: 6,  par: 4, si: 2  },
  { hole_number: 7,  par: 4, si: 14 },
  { hole_number: 8,  par: 5, si: 12 },
  { hole_number: 9,  par: 3, si: 6  },
  { hole_number: 10, par: 4, si: 3  },
  { hole_number: 11, par: 4, si: 17 },
  { hole_number: 12, par: 3, si: 5  },
  { hole_number: 13, par: 4, si: 7  },
  { hole_number: 14, par: 5, si: 9  },
  { hole_number: 15, par: 4, si: 1  },
  { hole_number: 16, par: 4, si: 15 },
  { hole_number: 17, par: 5, si: 13 },
  { hole_number: 18, par: 3, si: 11 },
]

function calcularVentajas(hcpDiff: number) {
  const ventajas: Record<number, number> = {}
  HOYOS.forEach(h => {
    const vueltasCompletas = Math.floor(hcpDiff / 18)
    const residuo = hcpDiff % 18
    ventajas[h.hole_number] = vueltasCompletas + (h.si <= residuo ? 1 : 0)
  })
  return ventajas
}

export default function ScorecardPage() {
  const [hoyoActivo, setHoyoActivo] = useState(0)
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({
    j1: Object.fromEntries(HOYOS.map(h => [h.hole_number, ''])),
    j2: Object.fromEntries(HOYOS.map(h => [h.hole_number, ''])),
  })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState<Record<string, Record<number, boolean>>>({
    j1: {}, j2: {}
  })
useEffect(() => {
    async function cargarScores() {
      const { data } = await supabase
        .from('hole_scores')
        .select('*')
        .eq('game_round_id', GAME_ROUND_ID)

      if (data && data.length > 0) {
        const newScores = {
          j1: Object.fromEntries(HOYOS.map(h => [h.hole_number, ''])),
          j2: Object.fromEntries(HOYOS.map(h => [h.hole_number, ''])),
        }
        data.forEach(s => {
          const jk = s.player_id === J1.id ? 'j1' : 'j2'
          newScores[jk][s.hole_number] = String(s.gross_score)
        })
        setScores(newScores)
      }
    }
    cargarScores()
  }, [])
  const hcpDiff = Math.abs(J1.hcp - J2.hcp)
  const jugadorConVentaja = J1.hcp > J2.hcp ? 'j1' : 'j2'
  const ventajas = calcularVentajas(hcpDiff)
  const hoyo = HOYOS[hoyoActivo]

async function guardarScore(jugador: 'j1' | 'j2', holeNumber: number, grossScore: string) {
    if (grossScore === '') return
    setGuardando(true)

    const j = jugador === 'j1' ? J1 : J2
    const v = jugadorConVentaja === jugador ? (ventajas[holeNumber] || 0) : 0
    const hole = HOYOS.find(h => h.hole_number === holeNumber)!
    const netScore = Number(grossScore) - v

    const { error } = await supabase
      .from('hole_scores')
      .upsert({
        game_round_id: GAME_ROUND_ID,
        player_id: j.id,
        club_id: '209f9af7-a863-4967-b6fe-9c3bb96dcafe',
        hole_number: holeNumber,
        par: hole.par,
        si: hole.si,
        gross_score: Number(grossScore),
        net_score: netScore,
        strokes_given: v,
    }, { onConflict: 'game_round_id,player_id,hole_number', ignoreDuplicates: false })

    if (error) alert('Error: ' + error.message)

    setGuardado(prev => ({
      ...prev,
      [jugador]: { ...prev[jugador], [holeNumber]: true }
    }))
    setGuardando(false)
  }
  function updateScore(jugador: 'j1' | 'j2', valor: string) {
    setScores(prev => ({
      ...prev,
      [jugador]: { ...prev[jugador], [hoyo.hole_number]: valor }
    }))
    setGuardado(prev => ({
      ...prev,
      [jugador]: { ...prev[jugador], [hoyo.hole_number]: false }
    }))
  }

  function calcularMarcador() {
    let acumulado = 0
    const resultados: Record<number, string> = {}

    HOYOS.forEach(h => {
      const g1 = scores.j1[h.hole_number]
      const g2 = scores.j2[h.hole_number]
      if (g1 === '' || g2 === '') return

      const v = ventajas[h.hole_number] || 0
      const net1 = Number(g1) - (jugadorConVentaja === 'j1' ? v : 0)
      const net2 = Number(g2) - (jugadorConVentaja === 'j2' ? v : 0)

      if (net1 < net2) acumulado++
      else if (net2 < net1) acumulado--

      resultados[h.hole_number] = acumulado === 0 ? 'AS' : `${Math.abs(acumulado)}`
    })

    return { acumulado, resultados }
  }

  const { acumulado, resultados } = calcularMarcador()
  const hoyosJugados = HOYOS.filter(h => scores.j1[h.hole_number] !== '' && scores.j2[h.hole_number] !== '').length
  const absAcumulado = Math.abs(acumulado)
  const finished = hoyosJugados > 0 && absAcumulado > (18 - hoyosJugados)

  const marcadorLabel = acumulado === 0 ? 'All Square'
    : finished ? `${absAcumulado}&${18 - hoyosJugados}`
    : `${absAcumulado} UP`

  const marcadorColor = acumulado === 0 ? '#2ECC71'
    : acumulado > 0 ? J1.color : J2.color

  const ambosCapturados = scores.j1[hoyo.hole_number] !== '' && scores.j2[hoyo.hole_number] !== ''

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1a0f',
      fontFamily: 'Georgia, serif',
      color: '#e8f5e9',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)',
        borderBottom: '2px solid #2ECC71',
        padding: '16px 20px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase' }}>Match Play Singles</div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>Club Las Misiones</div>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 20,
            background: marcadorColor + '33',
            color: marcadorColor,
            fontSize: 16, fontWeight: 'bold',
          }}>
            {marcadorLabel}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: J1.color }} />
            <span style={{ fontSize: 13, fontWeight: 'bold' }}>{J1.nombre}</span>
            <span style={{ fontSize: 11, color: '#81c784' }}>({J1.hcp})</span>
          </div>
          <span style={{ fontSize: 11, color: '#4a7a50' }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#81c784' }}>({J2.hcp})</span>
            <span style={{ fontSize: 13, fontWeight: 'bold' }}>{J2.nombre}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: J2.color }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 80px' }}>

        {/* Selector de hoyos */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>Hoyo</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {HOYOS.map((h, i) => {
              const jugado = scores.j1[h.hole_number] !== '' && scores.j2[h.hole_number] !== ''
              return (
                <button key={i} onClick={() => setHoyoActivo(i)} style={{
                  width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                  background: hoyoActivo === i ? '#2ECC71' : jugado ? '#1a3a1f' : '#162a1a',
                  color: hoyoActivo === i ? '#0a1a0f' : jugado ? '#81c784' : '#4a7a50',
                  fontWeight: hoyoActivo === i ? 'bold' : 'normal',
                  fontSize: 12,
                  border: jugado && hoyoActivo !== i ? '1px solid #2ECC7155' as any : '1px solid transparent' as any,
                }}>
                  {h.hole_number}
                </button>
              )
            })}
          </div>
        </div>

        {/* Captura de scores */}
        <div style={{
          background: '#1a2e1d', borderRadius: 14, padding: '16px',
          border: '1px solid #2ECC7133', marginBottom: 16,
        }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['j1', 'j2'] as const).map(jk => {
              const jugador = jk === 'j1' ? J1 : J2
              const v = jugadorConVentaja === jk ? (ventajas[hoyo.hole_number] || 0) : 0
              const gross = scores[jk][hoyo.hole_number]
              const net = gross !== '' ? Number(gross) - v : null
              const yaGuardado = guardado[jk]?.[hoyo.hole_number]

              return (
                <div key={jk} style={{
                  background: '#0d2410', borderRadius: 10, padding: '12px',
                  border: `1px solid ${yaGuardado ? jugador.color : jugador.color + '33'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: jugador.color }} />
                      <span style={{ fontSize: 12, fontWeight: 'bold' }}>{jugador.nombre.split(' ')[0]}</span>
                    </div>
                    {v > 0 && (
                      <span style={{ background: '#2ECC7122', color: '#2ECC71', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>
                        +{v} ventaja
                      </span>
                    )}
                  </div>
                  <input
                    type="number" min={1} max={15}
                    value={scores[jk][hoyo.hole_number]}
                    onChange={e => updateScore(jk, e.target.value)}
                    placeholder={`Par ${hoyo.par}`}
                    style={{
                      width: '100%', background: '#162a1a',
                      border: '1px solid #2ECC7144', borderRadius: 8,
                      color: '#e8f5e9', fontFamily: 'Georgia, serif',
                      fontSize: 24, fontWeight: 'bold', textAlign: 'center',
                      padding: '10px 0', boxSizing: 'border-box',
                    }}
                  />
                  {net !== null && (
                    <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#81c784' }}>
                      Neto: {net}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Botón guardar */}
          {ambosCapturados && (
            <button
              onClick={async () => {
                await guardarScore('j1', hoyo.hole_number, scores.j1[hoyo.hole_number])
                await guardarScore('j2', hoyo.hole_number, scores.j2[hoyo.hole_number])
              }}
              disabled={guardando}
              style={{
                width: '100%', marginTop: 12,
                background: guardando ? '#4a7a50' : '#2ECC71',
                color: '#0a1a0f', border: 'none', borderRadius: 8,
                padding: '10px', cursor: guardando ? 'not-allowed' : 'pointer',
                fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold',
              }}
            >
              {guardando ? 'Guardando...' : '💾 Guardar Hoyo'}
            </button>
          )}

          {/* Navegación */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setHoyoActivo(h => Math.max(0, h - 1))} disabled={hoyoActivo === 0} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #2ECC7144',
              background: 'transparent', color: '#2ECC71',
              cursor: hoyoActivo === 0 ? 'not-allowed' : 'pointer',
              opacity: hoyoActivo === 0 ? 0.3 : 1, fontSize: 13,
            }}>← Anterior</button>
            <button onClick={() => setHoyoActivo(h => Math.min(17, h + 1))} disabled={hoyoActivo === 17} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: '#2ECC71', color: '#0a1a0f',
              cursor: hoyoActivo === 17 ? 'not-allowed' : 'pointer',
              opacity: hoyoActivo === 17 ? 0.5 : 1, fontSize: 13, fontWeight: 'bold',
            }}>Siguiente →</button>
          </div>
        </div>
{hoyosJugados === 18 && (
  <button
    onClick={() => window.location.href = '/juego/resumen'}
    style={{
      width: '100%',
      marginTop: 10,
      background: '#F39C12',
      color: '#0a1a0f',
      border: 'none',
      borderRadius: 8,
      padding: '12px',
      cursor: 'pointer',
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      fontWeight: 'bold',
    }}
  >
    🏆 Ver Resumen Final
  </button>
)}
        {/* Marcador hoyo por hoyo */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 10 }}>
            Marcador
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
              {HOYOS.map((h, i) => {
                const jugado = scores.j1[h.hole_number] !== '' && scores.j2[h.hole_number] !== ''
                const res = resultados[h.hole_number]
                const g1 = scores.j1[h.hole_number]
                const g2 = scores.j2[h.hole_number]
                const v = ventajas[h.hole_number] || 0
                const net1 = g1 !== '' ? Number(g1) - (jugadorConVentaja === 'j1' ? v : 0) : null
                const net2 = g2 !== '' ? Number(g2) - (jugadorConVentaja === 'j2' ? v : 0) : null
                const ganador = net1 !== null && net2 !== null ? (net1 < net2 ? 'j1' : net2 < net1 ? 'j2' : 'halved') : null

                return (
                  <div key={i} onClick={() => setHoyoActivo(i)} style={{
                    width: 32, flexShrink: 0, cursor: 'pointer',
                    background: hoyoActivo === i ? '#2ECC7133' : jugado ? (ganador === 'j1' ? J1.color + '22' : ganador === 'j2' ? J2.color + '22' : '#2ECC7111') : '#0d2410',
                    borderRadius: 6, padding: '4px 0', textAlign: 'center',
                    border: (hoyoActivo === i ? '1px solid #2ECC71' : '1px solid transparent') as any,
                  }}>
                    <div style={{ fontSize: 9, color: '#81c784' }}>{h.hole_number}</div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', margin: '2px auto', background: jugado ? (ganador === 'j1' ? J1.color : ganador === 'j2' ? J2.color : '#2ECC71') : '#4a7a50' }} />
                    <div style={{ fontSize: 9, color: '#4a7a50' }}>{res || ''}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {hcpDiff > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#81c784' }}>
              {jugadorConVentaja === 'j1' ? J1.nombre : J2.nombre} recibe {hcpDiff} ventaja{hcpDiff !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}