'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GAME_ROUND_ID = '8a41f62c-fa39-47cf-bb96-acf922aee206'

const PARTIDOS = [
  {
    id: 1,
    j1: { id: '68ca849f-3e9d-4283-bccc-e60413bf1136', nombre: 'Carlos Martínez', hcp: 12, color: '#2ECC71' },
    j2: { id: 'a48a2b69-5858-473f-bb5f-e85bde218d5c', nombre: 'Rodrigo Pérez', hcp: 18, color: '#3498DB' },
  },
]

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

function calcularMarcadorPartido(scores: any[], j1: any, j2: any) {
  const hcpDiff = Math.abs(j1.hcp - j2.hcp)
  const jugadorConVentaja = j1.hcp > j2.hcp ? j1 : j2

  function getVentaja(si: number) {
    const vueltasCompletas = Math.floor(hcpDiff / 18)
    const residuo = hcpDiff % 18
    return vueltasCompletas + (si <= residuo ? 1 : 0)
  }

  let acumulado = 0
  let hoyosJugados = 0

  HOYOS.forEach(h => {
    const s1 = scores.find(s => s.player_id === j1.id && s.hole_number === h.hole_number)
    const s2 = scores.find(s => s.player_id === j2.id && s.hole_number === h.hole_number)
    if (!s1 || !s2) return

    const v = getVentaja(h.si)
    const net1 = s1.gross_score - (jugadorConVentaja.id === j1.id ? v : 0)
    const net2 = s2.gross_score - (jugadorConVentaja.id === j2.id ? v : 0)

    if (net1 < net2) acumulado++
    else if (net2 < net1) acumulado--
    hoyosJugados++
  })

  const absAcumulado = Math.abs(acumulado)
  const holesLeft = 18 - hoyosJugados
  const finished = hoyosJugados > 0 && absAcumulado > holesLeft

  const label = acumulado === 0 ? 'AS'
    : finished ? `${absAcumulado}&${holesLeft}`
    : `${absAcumulado} UP`

  const lider = acumulado > 0 ? j1 : acumulado < 0 ? j2 : null
  const color = acumulado === 0 ? '#2ECC71' : acumulado > 0 ? j1.color : j2.color

  return { label, lider, color, hoyosJugados, finished, acumulado }
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())

  async function cargarScores() {
    const { data } = await supabase
      .from('hole_scores')
      .select('*')
      .eq('game_round_id', GAME_ROUND_ID)

    setScores(data || [])
    setUltimaActualizacion(new Date())
    setLoading(false)
  }

  useEffect(() => {
    cargarScores()

    // Actualizar cada 15 segundos
    const interval = setInterval(cargarScores, 15000)

    // Realtime de Supabase
    const channel = supabase
      .channel('hole_scores_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hole_scores',
        filter: `game_round_id=eq.${GAME_ROUND_ID}`,
      }, () => {
        cargarScores()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a1a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18,
    }}>
      Cargando leaderboard...
    </div>
  )

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
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>
              Kriter Golf Club
            </div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>📊 Live Leaderboard</div>
          </div>
          <button onClick={() => window.location.href = '/dashboard'} style={{
            background: 'transparent', border: '1px solid #2ECC71',
            borderRadius: 8, color: '#2ECC71', padding: '8px 16px',
            cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
          }}>
            ← Dashboard
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#4a7a50', marginTop: 8 }}>
          ⟳ Actualizado: {ultimaActualizacion.toLocaleTimeString()}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>

        <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 14 }}>
          Partidos en Curso
        </div>

        {PARTIDOS.map((partido, i) => {
          const { label, lider, color, hoyosJugados, finished } = calcularMarcadorPartido(scores, partido.j1, partido.j2)

          return (
            <div key={i} style={{
              background: '#1a2e1d',
              borderRadius: 14,
              padding: '16px',
              border: `1px solid ${color}33`,
              marginBottom: 12,
            }}>
              {/* Número partido */}
              <div style={{ fontSize: 10, color: '#4a7a50', letterSpacing: 2, marginBottom: 10 }}>
                PARTIDO {i + 1} {finished ? '✅ TERMINADO' : `• HOYO ${hoyosJugados}/18`}
              </div>

              {/* Jugadores y marcador */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: partido.j1.color }} />
                    <span style={{
                      fontSize: 14, fontWeight: lider?.id === partido.j1.id ? 'bold' : 'normal',
                      color: lider?.id === partido.j1.id ? partido.j1.color : '#e8f5e9',
                    }}>
                      {partido.j1.nombre}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: partido.j2.color }} />
                    <span style={{
                      fontSize: 14, fontWeight: lider?.id === partido.j2.id ? 'bold' : 'normal',
                      color: lider?.id === partido.j2.id ? partido.j2.color : '#e8f5e9',
                    }}>
                      {partido.j2.nombre}
                    </span>
                  </div>
                </div>

                {/* Marcador */}
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div style={{
                    fontSize: 24, fontWeight: 'bold', color,
                    background: color + '22', borderRadius: 12,
                    padding: '8px 16px', minWidth: 80,
                  }}>
                    {label}
                  </div>
                  {lider && (
                    <div style={{ fontSize: 10, color, marginTop: 4 }}>
                      {lider.nombre.split(' ')[0]} lidera
                    </div>
                  )}
                </div>

                {/* HCPs */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#81c784', marginBottom: 6 }}>HCP {partido.j1.hcp}</div>
                  <div style={{ fontSize: 12, color: '#81c784' }}>HCP {partido.j2.hcp}</div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ marginTop: 12, background: '#0d2410', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: finished ? '#F39C12' : '#2ECC71',
                  width: `${(hoyosJugados / 18) * 100}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: '#4a7a50', marginTop: 4, textAlign: 'right' }}>
                {hoyosJugados}/18 hoyos
              </div>
            </div>
          )
        })}

        {/* Botón refrescar manual */}
        <button onClick={cargarScores} style={{
          width: '100%', background: 'transparent',
          border: '1px solid #2ECC7144', borderRadius: 10,
          color: '#81c784', padding: '12px', cursor: 'pointer',
          fontFamily: 'Georgia, serif', fontSize: 13, marginTop: 8,
        }}>
          ⟳ Actualizar ahora
        </button>

      </div>
    </div>
  )
}