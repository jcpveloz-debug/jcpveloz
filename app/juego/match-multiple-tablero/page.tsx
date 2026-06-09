'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Hoyo { hole_number: number; par: number; si: number }
interface Duelo {
  gameId: string
  j1: { id: string; nombre: string; hcp: number }
  j2: { id: string; nombre: string; hcp: number }
  marcador: string
  color: string
  jugados: number
}

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

function leerGrupo(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('grupo')
}

const COLOR1 = '#2ECC71'
const COLOR2 = '#3498DB'

export default function MatchMultipleTableroPage() {
  const [grupo, setGrupo] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [duelos, setDuelos] = useState<Duelo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const g = leerGrupo()
    setGrupo(g)
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      if (!g) { setLoading(false); return }

      // hoyos del campo
      const { data: hData } = await supabase
        .from('course_holes')
        .select('hole_number, par, si')
        .eq('course_id', COURSE_ID)
        .order('hole_number')
      const hoyos: Hoyo[] = hData || []

      // todos los duelos del torneo
      const { data: rounds } = await supabase
        .from('game_rounds')
        .select('id')
        .eq('tournament_group', g)
        .order('created_at')

      const lista: Duelo[] = []
      for (const r of rounds || []) {
        // jugadores del duelo
        const { data: grp } = await supabase
          .from('game_round_players')
          .select('player_id, hcp_index, team_number')
          .eq('game_round_id', r.id)
        if (!grp || grp.length < 2) continue

        const ids = grp.map(x => x.player_id)
        const { data: pData } = await supabase
          .from('players')
          .select('id, golf_name, hcp_base')
          .in('id', ids)

        const arr = grp.map(x => {
          const p = pData?.find(y => y.id === x.player_id)
          const hcp = x.hcp_index !== null && x.hcp_index !== undefined ? x.hcp_index : (p?.hcp_base ?? 0)
          return { id: x.player_id, nombre: p?.golf_name || 'Jugador', hcp, team: String(x.team_number) }
        }).sort((a, b) => a.team.localeCompare(b.team))

        const j1 = arr[0], j2 = arr[1]

        // scores del duelo
        const { data: sData } = await supabase
          .from('hole_scores')
          .select('player_id, hole_number, gross_score')
          .eq('game_round_id', r.id)

        const hcpDiff = Math.abs(j1.hcp - j2.hcp)
        const idConVentaja = j1.hcp > j2.hcp ? j1.id : j2.id

        let acum = 0, jugados = 0
        hoyos.forEach(h => {
          const g1 = sData?.find(s => s.player_id === j1.id && s.hole_number === h.hole_number)
          const g2 = sData?.find(s => s.player_id === j2.id && s.hole_number === h.hole_number)
          if (!g1 || !g2) return
          jugados++
          const n1 = g1.gross_score - (idConVentaja === j1.id ? ventajaEnHoyo(hcpDiff, h.si) : 0)
          const n2 = g2.gross_score - (idConVentaja === j2.id ? ventajaEnHoyo(hcpDiff, h.si) : 0)
          if (n1 < n2) acum++
          else if (n2 < n1) acum--
        })

        const absAc = Math.abs(acum)
        const restantes = hoyos.length - jugados
        const finished = jugados > 0 && absAc > restantes
        const marcador = acum === 0 ? (jugados === 0 ? 'Sin iniciar' : 'All Square') : finished ? `${absAc}&${restantes}` : `${absAc} UP`
        const color = acum === 0 ? '#F39C12' : acum > 0 ? COLOR1 : COLOR2

        lista.push({ gameId: r.id, j1, j2, marcador, color, jugados })
      }

      setDuelos(lista)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando torneo...
    </div>
  )

  if (!grupo || duelos.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontró el torneo.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>← Dashboard</button>
    </div>
  )

  const adminSuffix = esAdmin ? '&admin=1' : ''

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px' }}>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{
          background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
          padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', marginBottom: 10,
        }}>← Dashboard</button>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>⚔️ Torneo Match Play</div>
        <div style={{ fontSize: 12, color: '#81c784', marginTop: 2 }}>{duelos.length} duelos en juego</div>
      </div>

      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición — toca un duelo para capturar' : '👁️ Modo Solo Lectura'}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {duelos.map((d, i) => (
            <div key={d.gameId}
              onClick={() => window.location.href = `/juego/scorecard?game=${d.gameId}${adminSuffix}`}
              style={{
                background: '#1a2e1d', border: `1px solid ${d.color}55`, borderRadius: 12,
                padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#81c784', marginBottom: 4 }}>Duelo {i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: COLOR1 }}>{d.j1.nombre.split(' ')[0]}</span>
                  <span style={{ fontSize: 11, color: '#4a7a50' }}>vs</span>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: COLOR2 }}>{d.j2.nombre.split(' ')[0]}</span>
                </div>
                <div style={{ fontSize: 10, color: '#4a7a50', marginTop: 3 }}>{d.jugados} hoyos jugados</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: d.color + '22', color: d.color, borderRadius: 16, padding: '6px 14px', fontSize: 14, fontWeight: 'bold' }}>
                  {d.marcador}
                </div>
                <div style={{ fontSize: 10, color: '#81c784', marginTop: 4 }}>tocar para capturar →</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => window.location.reload()} style={{
          width: '100%', marginTop: 20, background: 'transparent', color: '#2ECC71',
          border: '1px solid #2ECC71', borderRadius: 10, padding: '12px', cursor: 'pointer',
          fontFamily: 'Georgia, serif', fontSize: 13,
        }}>🔄 Actualizar marcadores</button>
      </div>
    </div>
  )
}