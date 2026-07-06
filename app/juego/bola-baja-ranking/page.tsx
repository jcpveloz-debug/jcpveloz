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

export default function BolaBajaRankingPage() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({})
  const [nombreCampo, setNombreCampo] = useState('')
  const [fecha, setFecha] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = leerGameId()
    setGameId(id)
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      if (!id) { setLoading(false); return }

      const { data: rondaData } = await supabase
        .from('game_rounds')
        .select('course_id, date')
        .eq('id', id)
        .single()
      const cursoDelJuego = rondaData?.course_id
      setFecha(rondaData?.date || '')

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
          return { id: g.player_id, nombre: p?.golf_name || 'Jugador', hcp, pareja: Number(g.team_number) || 0 }
        })
        jugs.sort((a, b) => a.pareja - b.pareja)
      }
      setJugadores(jugs)

      const { data: sData } = await supabase
        .from('hole_scores')
        .select('player_id, hole_number, gross_score')
        .eq('game_round_id', id)
      const sc: Record<string, Record<number, number>> = {}
      sData?.forEach(s => {
        if (s.gross_score !== null && s.gross_score !== undefined) {
          if (!sc[s.player_id]) sc[s.player_id] = {}
          sc[s.player_id][s.hole_number] = s.gross_score
        }
      })
      setScores(sc)

      setLoading(false)
    }
    cargar()
  }, [])

  const adminSuffix = esAdmin ? '&admin=1' : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando ranking...
    </div>
  )

  if (!gameId || jugadores.length < 1) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f5e9', fontFamily: 'Georgia, serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, marginBottom: 16 }}>No se encontro el juego.</div>
      <button onClick={() => window.location.href = '/dashboard'} style={{ background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>Dashboard</button>
    </div>
  )

  // neto en golpes de un jugador en un hoyo (gross - ventaja)
  function netoGolpes(j: Jugador, h: Hoyo): number | null {
    const g = scores[j.id]?.[h.hole_number]
    if (g === undefined) return null
    return g - ventajaEnHoyo(j.hcp, h.si)
  }

  const numerosPareja = Array.from(new Set(jugadores.map(j => j.pareja))).sort((a, b) => a - b)

  function jugadoresDePareja(num: number): Jugador[] {
    return jugadores.filter(j => j.pareja === num)
  }

  // bola baja de la pareja en un hoyo
  function bolaBajaHoyo(num: number, h: Hoyo): number | null {
    const js = jugadoresDePareja(num)
    const netos = js.map(j => netoGolpes(j, h)).filter(n => n !== null) as number[]
    if (netos.length === 0) return null
    return Math.min(...netos)
  }

  // total neto de la pareja (suma de bolas bajas de los 18 hoyos)
  function totalPareja(num: number): number {
    let s = 0
    hoyos.forEach(h => { const b = bolaBajaHoyo(num, h); if (b !== null) s += b })
    return s
  }

  // cuantos hoyos lleva capturados la pareja (al menos un jugador con gross)
  function hoyosJugados(num: number): number {
    let c = 0
    hoyos.forEach(h => { if (bolaBajaHoyo(num, h) !== null) c++ })
    return c
  }

  // Ranking: parejas ordenadas por total neto ascendente (menor gana)
  const ranking = numerosPareja
    .map(num => ({
      num,
      total: totalPareja(num),
      jugados: hoyosJugados(num),
      jugadores: jugadoresDePareja(num),
    }))
    .sort((a, b) => a.total - b.total)

  const medallas = ['1', '2', '3']
  const coloresMedalla = ['#F39C12', '#C0C0C0', '#CD7F32']

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Ranking - Bola Baja</div>
        </div>
        <button onClick={() => window.location.href = `/juego/bola-baja-tarjeta?game=${gameId}${adminSuffix}`} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>Tarjeta</button>
      </div>

      <div style={{ padding: '16px 16px 40px' }}>
        {/* Info del juego */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#F39C12' }}>{nombreCampo}</div>
          <div style={{ fontSize: 12, color: '#81c784', marginTop: 2 }}>{fecha}</div>
        </div>

        {/* Podio / ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {ranking.map((r, idx) => {
            const esPodio = idx < 3
            const nombres = r.jugadores.map(j => j.nombre.split(' ')[0]).join(' / ')
            return (
              <div key={r.num} style={{
                background: idx === 0 ? 'linear-gradient(135deg, #1a3a1f 0%, #16361f 100%)' : '#1a2e1d',
                borderRadius: 14, padding: '16px', border: `2px solid ${esPodio ? coloresMedalla[idx] : '#2ECC7133'}`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  minWidth: 40, height: 40, borderRadius: '50%',
                  background: esPodio ? coloresMedalla[idx] : '#0d2410',
                  color: esPodio ? '#0a1a0f' : '#81c784',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 'bold', flexShrink: 0,
                }}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#F39C12', fontWeight: 'bold', letterSpacing: 1 }}>PAREJA {romano(r.num)}</div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{nombres}</div>
                  <div style={{ fontSize: 10, color: '#81c784', marginTop: 2 }}>{r.jugados} de {hoyos.length} hoyos</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2ECC71' }}>{r.total}</div>
                  <div style={{ fontSize: 9, color: '#81c784', letterSpacing: 1 }}>NETO</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ fontSize: 10, color: '#81c784', textAlign: 'center', lineHeight: 1.5, marginBottom: 20 }}>
          Cada hoyo cuenta la bola baja (menor neto de la pareja). Gana la pareja con el menor total neto.
        </div>

        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{
          width: '100%', background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
        }}>Ir al Dashboard</button>
      </div>
    </div>
  )
}