'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

function puntosStableford(neto: number): number {
  const p = 2 - neto
  return p > 0 ? p : 0
}

function leerGameId(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('game')
}

export default function ResumenStablefordPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, string>>>({})
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
      setHoyos(hData || [])

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
      jugs.forEach(j => { init[j.id] = {} })
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando resultados...
    </div>
  )

  if (!gameId || jugadores.length < 2) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  // calcular puntos totales de cada jugador
  const tabla = jugadores.map(j => {
    let gross = 0
    let puntos = 0
    hoyos.forEach(h => {
      const g = scores[j.id]?.[h.hole_number]
      if (g !== undefined && g !== '') {
        gross += Number(g)
        const neto = Number(g) - ventajaEnHoyo(j.hcp, h.si) - h.par
        puntos += puntosStableford(neto)
      }
    })
    return { ...j, gross, puntos }
  })

  // ordenar por puntos DESCENDENTE (más puntos = mejor = 1er lugar)
  tabla.sort((a, b) => b.puntos - a.puntos)

  const medallas = ['🥇', '🥈', '🥉']

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>🏆 Ranking Stableford</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '20px 16px 60px' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#81c784', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
          Stableford — Club Las Misiones
        </div>

        {/* Podio (top 3) */}
        <div style={{ background: 'linear-gradient(135deg, #1a2e1d, #0d2410)', borderRadius: 16, padding: '20px', border: '1px solid #2ECC7144', marginBottom: 16 }}>
          {tabla.slice(0, 3).map((j, i) => (
            <div key={j.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', marginBottom: i < 2 ? 8 : 0, borderRadius: 10,
              background: i === 0 ? '#2ECC7122' : '#0d2410',
              border: i === 0 ? '1px solid #2ECC71' : '1px solid #2ECC7122',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{medallas[i]}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 'bold' }}>{j.nombre}</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Gross {j.gross} · HCP {j.hcp}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2ECC71' }}>{j.puntos}</div>
                <div style={{ fontSize: 9, color: '#4a7a50', textTransform: 'uppercase' }}>Puntos</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla completa */}
        <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '14px', border: '1px solid #2ECC7122' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>Tabla Completa (más puntos gana)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '6px', color: '#4a7a50', textAlign: 'left', fontWeight: 'normal' }}>#</th>
                <th style={{ padding: '6px', color: '#4a7a50', textAlign: 'left', fontWeight: 'normal' }}>Jugador</th>
                <th style={{ padding: '6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>Gross</th>
                <th style={{ padding: '6px', color: '#4a7a50', textAlign: 'center', fontWeight: 'normal' }}>HCP</th>
                <th style={{ padding: '6px', color: '#2ECC71', textAlign: 'center', fontWeight: 'bold' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((j, i) => (
                <tr key={j.id} style={{ background: i % 2 === 0 ? '#0d2410' : 'transparent' }}>
                  <td style={{ padding: '8px 6px', color: '#81c784', fontWeight: 'bold' }}>{i + 1}</td>
                  <td style={{ padding: '8px 6px', fontWeight: i === 0 ? 'bold' : 'normal' }}>{j.nombre}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: '#e8f5e9' }}>{j.gross}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: '#81c784' }}>{j.hcp}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', color: '#2ECC71', fontSize: 15 }}>{j.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => window.location.href = `/juego/tarjeta-stableford?game=${gameId}`} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>← Tarjeta</button>
          <button onClick={() => window.location.href = '/dashboard'} style={{ flex: 1, background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold' }}>Dashboard →</button>
        </div>
      </div>
    </div>
  )
}