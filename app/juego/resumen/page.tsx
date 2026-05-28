'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GAME_ROUND_ID = '8a41f62c-fa39-47cf-bb96-acf922aee206'

const J1 = { id: '68ca849f-3e9d-4283-bccc-e60413bf1136', nombre: 'Carlos Martínez', hcp: 12, color: '#2ECC71' }
const J2 = { id: 'a48a2b69-5858-473f-bb5f-e85bde218d5c', nombre: 'Rodrigo Pérez', hcp: 18, color: '#3498DB' }

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

export default function ResumenPage() {
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarScores() {
      const { data } = await supabase
        .from('hole_scores')
        .select('*')
        .eq('game_round_id', GAME_ROUND_ID)
        .order('hole_number')

      setScores(data || [])
      setLoading(false)
    }
    cargarScores()
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a1a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18,
    }}>
      Cargando resultados...
    </div>
  )

  // Calcular marcador
  const hcpDiff = Math.abs(J1.hcp - J2.hcp)
  const jugadorConVentaja = J1.hcp > J2.hcp ? J1 : J2

  function getVentaja(si: number) {
    const vueltasCompletas = Math.floor(hcpDiff / 18)
    const residuo = hcpDiff % 18
    return vueltasCompletas + (si <= residuo ? 1 : 0)
  }

  let acumulado = 0
  let holesWonJ1 = 0
  let holesWonJ2 = 0
  let holesHalved = 0
  let totalBrutoJ1 = 0
  let totalBrutoJ2 = 0
  let totalNetoJ1 = 0
  let totalNetoJ2 = 0

  const detalleHoyos = HOYOS.map(h => {
    const s1 = scores.find(s => s.player_id === J1.id && s.hole_number === h.hole_number)
    const s2 = scores.find(s => s.player_id === J2.id && s.hole_number === h.hole_number)

    if (!s1 || !s2) return { ...h, s1: null, s2: null, ganador: null, acumulado: null }

    const v = getVentaja(h.si)
    const net1 = s1.gross_score - (jugadorConVentaja.id === J1.id ? v : 0)
    const net2 = s2.gross_score - (jugadorConVentaja.id === J2.id ? v : 0)

    totalBrutoJ1 += s1.gross_score
    totalBrutoJ2 += s2.gross_score
    totalNetoJ1 += net1
    totalNetoJ2 += net2

    let ganador = null
    if (net1 < net2) { acumulado++; holesWonJ1++; ganador = 'j1' }
    else if (net2 < net1) { acumulado--; holesWonJ2++; ganador = 'j2' }
    else { holesHalved++; ganador = 'halved' }

    return { ...h, s1, s2, net1, net2, v, ganador, acumulado }
  })

  const hoyosJugados = detalleHoyos.filter(h => h.s1 !== null).length
  const absAcumulado = Math.abs(acumulado)
  const holesLeft = 18 - hoyosJugados
  const finished = absAcumulado > holesLeft
  const marcadorLabel = acumulado === 0 ? 'All Square'
    : finished ? `${absAcumulado}&${holesLeft}`
    : `${absAcumulado} UP`
  const ganadorFinal = acumulado > 0 ? J1 : acumulado < 0 ? J2 : null
  const marcadorColor = acumulado === 0 ? '#2ECC71' : acumulado > 0 ? J1.color : J2.color

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
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>🏆 Resumen Final</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{
          background: 'transparent', border: '1px solid #2ECC71',
          borderRadius: 8, color: '#2ECC71', padding: '8px 16px',
          cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
        }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ padding: '20px 16px 60px' }}>

        {/* Tarjeta resultado */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2e1d, #0d2410)',
          borderRadius: 16, padding: '20px',
          border: `1px solid ${marcadorColor}44`,
          marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: marcadorColor + '15', pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 11, letterSpacing: 3, color: '#81c784', textTransform: 'uppercase', marginBottom: 14 }}>
            Match Play Singles — Club Las Misiones
          </div>

          {/* Jugadores */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: J1.color + '33', border: `2px solid ${J1.color}`,
                margin: '0 auto 8px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
              }}>🏌️</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{J1.nombre}</div>
              <div style={{ fontSize: 12, color: '#81c784' }}>HCP {J1.hcp}</div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontSize: 26, fontWeight: 'bold', color: marcadorColor, marginBottom: 4 }}>
                {marcadorLabel}
              </div>
              {ganadorFinal && (
                <div style={{
                  background: marcadorColor + '22', color: marcadorColor,
                  borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 'bold',
                }}>
                  🏆 {ganadorFinal.nombre}
                </div>
              )}
              {!ganadorFinal && (
                <div style={{ fontSize: 12, color: '#81c784' }}>Empate</div>
              )}
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: J2.color + '33', border: `2px solid ${J2.color}`,
                margin: '0 auto 8px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
              }}>🏌️</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{J2.nombre}</div>
              <div style={{ fontSize: 12, color: '#81c784' }}>HCP {J2.hcp}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Hoyos ganados', v1: holesWonJ1, v2: holesWonJ2, c1: J1.color, c2: J2.color },
              { label: 'Golpes brutos', v1: totalBrutoJ1, v2: totalBrutoJ2, c1: J1.color, c2: J2.color },
              { label: 'Halved', v1: holesHalved, center: true, c1: '#F39C12' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#0d2410', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#4a7a50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                  {stat.label}
                </div>
                {stat.center ? (
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: stat.c1 }}>{stat.v1}</div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: stat.c1 }}>{stat.v1}</span>
                    <span style={{ color: '#4a7a50' }}>–</span>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: stat.c2 }}>{stat.v2}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hcpDiff > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#81c784', textAlign: 'center' }}>
              {jugadorConVentaja.nombre} recibió {hcpDiff} ventaja{hcpDiff !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Tabla detalle */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>
            Detalle por Hoyo
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'left', fontWeight: 'normal' }}>Hoyo</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Par</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>SI</th>
                  <th style={{ padding: '4px 6px', color: J1.color, textAlign: 'center', fontWeight: 'bold' }}>{J1.nombre.split(' ')[0]}</th>
                  <th style={{ padding: '4px 6px', color: J1.color, textAlign: 'center', fontWeight: 'normal', fontSize: 10 }}>Neto</th>
                  <th style={{ padding: '4px 4px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Res.</th>
                  <th style={{ padding: '4px 6px', color: J2.color, textAlign: 'center', fontWeight: 'normal', fontSize: 10 }}>Neto</th>
                  <th style={{ padding: '4px 6px', color: J2.color, textAlign: 'center', fontWeight: 'bold' }}>{J2.nombre.split(' ')[0]}</th>
                  <th style={{ padding: '4px 6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Acc.</th>
                </tr>
              </thead>
              <tbody>
                {detalleHoyos.map((h, i) => {
                  if (!h.s1) return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent', opacity: 0.4 }}>
                      <td style={{ padding: '5px 6px', color: '#81c784', fontWeight: 'bold' }}>{h.hole_number}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.par}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.si}</td>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#4a7a50', fontSize: 11 }}>Sin jugar</td>
                    </tr>
                  )

                  const resBg = h.ganador === 'j1' ? J1.color + '33' : h.ganador === 'j2' ? J2.color + '33' : '#2ECC7122'
                  const resColor = h.ganador === 'j1' ? J1.color : h.ganador === 'j2' ? J2.color : '#2ECC71'
                  const resLabel = h.ganador === 'j1' ? '▲' : h.ganador === 'j2' ? '▼' : '='

                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent' }}>
                      <td style={{ padding: '5px 6px', color: '#81c784', fontWeight: 'bold' }}>{h.hole_number}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.par}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#4a7a50' }}>{h.si}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {h.s1.gross_score}
                        {h.v > 0 && jugadorConVentaja.id === J1.id && <sup style={{ color: '#2ECC71', fontSize: 8 }}>+{h.v}</sup>}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: J1.color, fontSize: 11 }}>{h.net1}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                        <span style={{ background: resBg, color: resColor, borderRadius: 4, padding: '2px 6px', fontSize: 13 }}>
                          {resLabel}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: J2.color, fontSize: 11 }}>{h.net2}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {h.s2.gross_score}
                        {h.v > 0 && jugadorConVentaja.id === J2.id && <sup style={{ color: '#2ECC71', fontSize: 8 }}>+{h.v}</sup>}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <span style={{ color: h.acumulado === 0 ? '#2ECC71' : h.acumulado > 0 ? J1.color : J2.color, fontWeight: 'bold', fontSize: 11 }}>
                          {h.acumulado === 0 ? 'AS' : `${Math.abs(h.acumulado)} UP`}
                        </span>
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
          <button onClick={() => window.location.href = '/juego/scorecard'} style={{
            flex: 1, background: 'transparent', color: '#2ECC71',
            border: '1px solid #2ECC71', borderRadius: 10, padding: '12px',
            cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
          }}>
            ← Scorecard
          </button>
          <button onClick={() => window.location.href = '/dashboard'} style={{
            flex: 1, background: '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 10, padding: '12px',
            cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold',
          }}>
            Dashboard →
          </button>
        </div>

      </div>
    </div>
  )
}