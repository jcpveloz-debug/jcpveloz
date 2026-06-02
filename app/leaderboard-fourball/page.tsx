'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'
const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

const colorA = '#2ECC71'
const colorB = '#3498DB'
const colorHalved = '#F39C12'

interface Hoyo { hole_number: number; par: number; si: number }

interface MatchResumen {
  gameId: string
  nombre: string
  status: string
  nombresA: string
  nombresB: string
  marcadorLabel: string
  marcadorColor: string
  ganador: 'A' | 'B' | null
  jugados: number
}

function ventajaEnHoyo(hcp: number, si: number) {
  const vueltas = Math.floor(hcp / 18)
  const residuo = hcp % 18
  return vueltas + (si <= residuo ? 1 : 0)
}

export default function LeaderboardFourballPage() {
  const [matches, setMatches] = useState<MatchResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [actualizado, setActualizado] = useState('')

  async function cargar() {
    // hoyos del campo
    const { data: hData } = await supabase
      .from('course_holes')
      .select('hole_number, par, si')
      .eq('course_id', COURSE_ID)
      .order('hole_number')
    const hoyos: Hoyo[] = hData || []

    // juegos fourball de HOY
    const hoy = new Date().toISOString().split('T')[0]
    const { data: rounds } = await supabase
      .from('game_rounds')
      .select('id, name, status, date, format')
      .eq('club_id', CLUB_ID)
      .eq('format', 'match_fourball')
      .eq('date', hoy)
      .order('created_at', { ascending: false })

    const resultado: MatchResumen[] = []

    for (const r of rounds || []) {
      const { data: grp } = await supabase
        .from('game_round_players')
        .select('player_id, hcp_index, team_number')
        .eq('game_round_id', r.id)

      if (!grp || grp.length < 4) continue

      const ids = grp.map(g => g.player_id)
      const { data: pData } = await supabase
        .from('players')
        .select('id, golf_name, hcp_base')
        .in('id', ids)

      const jugs = grp.map(g => {
        const p = pData?.find(x => x.id === g.player_id)
        const hcp = g.hcp_index !== null && g.hcp_index !== undefined ? g.hcp_index : (p?.hcp_base ?? 0)
        return {
          id: g.player_id,
          nombre: p?.golf_name || 'Jugador',
          hcp,
          pareja: (String(g.team_number) === '1' ? 'A' : 'B') as 'A' | 'B',
        }
      })

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', r.id)

      const sc: Record<string, Record<number, number>> = {}
      sData?.forEach(s => {
        if (!sc[s.player_id]) sc[s.player_id] = {}
        sc[s.player_id][s.hole_number] = s.gross_score
      })

      const parejaA = jugs.filter(j => j.pareja === 'A')
      const parejaB = jugs.filter(j => j.pareja === 'B')

      const mejorNeto = (pareja: typeof jugs, h: Hoyo): number | null => {
        const netos: number[] = []
        pareja.forEach(j => {
          const g = sc[j.id]?.[h.hole_number]
          if (g !== undefined) netos.push(g - ventajaEnHoyo(j.hcp, h.si))
        })
        return netos.length ? Math.min(...netos) : null
      }

      let acumulado = 0
      let jugados = 0
      hoyos.forEach(h => {
        const nA = mejorNeto(parejaA, h)
        const nB = mejorNeto(parejaB, h)
        if (nA === null || nB === null) return
        jugados++
        if (nA < nB) acumulado++
        else if (nB < nA) acumulado--
      })

      const absAc = Math.abs(acumulado)
      const restantes = hoyos.length - jugados
      const finished = jugados > 0 && absAc > restantes
      const marcadorLabel = acumulado === 0 ? 'All Square' : finished ? `${absAc}&${restantes}` : `${absAc} UP`
      const marcadorColor = acumulado === 0 ? colorHalved : acumulado > 0 ? colorA : colorB

      resultado.push({
        gameId: r.id,
        nombre: r.name,
        status: r.status,
        nombresA: parejaA.map(j => j.nombre.split(' ')[0]).join(' / '),
        nombresB: parejaB.map(j => j.nombre.split(' ')[0]).join(' / '),
        marcadorLabel,
        marcadorColor,
        ganador: acumulado > 0 ? 'A' : acumulado < 0 ? 'B' : null,
        jugados,
      })
    }

    setMatches(resultado)
    setActualizado(new Date().toLocaleTimeString('es-MX'))
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // refresco en vivo cuando cambian los scores
    const canal = supabase
      .channel('leaderboard-fourball')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hole_scores' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>📊 Leaderboard Fourball</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>← Dashboard</button>
      </div>

      <div style={{ padding: '16px 16px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#81c784' }}>⟳ Actualizado: {actualizado || '...'}</div>
          <button onClick={() => { setLoading(true); cargar() }} style={{ background: '#1a2e1d', border: '1px solid #2ECC7144', color: '#2ECC71', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'Georgia, serif' }}>⟳ Actualizar</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#2ECC71', padding: 40 }}>Cargando...</div>
        ) : matches.length === 0 ? (
          <div style={{ background: '#1a2e1d', borderRadius: 14, padding: 30, textAlign: 'center', color: '#81c784', border: '1px solid #2ECC7122' }}>
            No hay juegos Fourball hoy.
            <div style={{ marginTop: 14 }}>
              <button onClick={() => window.location.href = '/juego/nuevo'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>⛳ Crear juego</button>
            </div>
          </div>
        ) : (
          matches.map(m => (
            <div key={m.gameId} onClick={() => window.location.href = `/juego/resumen-fourball?game=${m.gameId}`} style={{
              background: '#1a2e1d', borderRadius: 14, padding: '16px', border: `1px solid ${m.marcadorColor}44`,
              marginBottom: 12, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 10, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase' }}>
                  {m.jugados >= 18 ? '✅ Terminado' : `⛳ En curso (${m.jugados}/18)`}
                </span>
                <span style={{ background: m.marcadorColor + '22', color: m.marcadorColor, borderRadius: 16, padding: '4px 12px', fontSize: 14, fontWeight: 'bold' }}>
                  {m.marcadorLabel}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorA }} />
                    <span style={{ fontSize: 13, fontWeight: m.ganador === 'A' ? 'bold' : 'normal' }}>Pareja A</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#81c784', marginLeft: 14 }}>{m.nombresA}</div>
                </div>
                <span style={{ fontSize: 11, color: '#4a7a50', padding: '0 10px' }}>VS</span>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 13, fontWeight: m.ganador === 'B' ? 'bold' : 'normal' }}>Pareja B</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorB }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#81c784', marginRight: 14 }}>{m.nombresB}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}