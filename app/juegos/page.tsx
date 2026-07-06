'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'

interface Item {
  tipo: 'juego' | 'torneo'
  id: string
  name: string
  date: string
  type: string
  format: string
  status: string
  numJugadores: number
  rondaIds?: string[]
  campo?: string
}

const FORMATOS: Record<string, { icon: string; label: string }> = {
  match_singles: { icon: '\u{1F3C6}', label: 'Match Play Singles' },
  match_fourball: { icon: '\u{1F465}', label: 'Fourball (2 vs 2)' },
  stroke_play: { icon: '\u{1F4CA}', label: 'Stroke Play' },
  stableford: { icon: '\u{1F3AF}', label: 'Stableford' },
  bola_baja: { icon: '\u{26F3}', label: 'Bola Baja en Parejas' },
}

function rutaTarjeta(format: string, gameId: string, adminSuffix: string): string {
  if (format === 'match_fourball') return `/leaderboard-fourball?game=${gameId}${adminSuffix}`
  if (format === 'stroke_play') return `/juego/tarjeta-stroke?game=${gameId}${adminSuffix}`
  if (format === 'stableford') return `/juego/tarjeta-stableford?game=${gameId}${adminSuffix}`
  if (format === 'bola_baja') return `/juego/bola-baja-tarjeta?game=${gameId}${adminSuffix}`
  return `/juego/scorecard?game=${gameId}${adminSuffix}`
}

export default function JuegosPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [esAdmin, setEsAdmin] = useState(false)
  const [borrando, setBorrando] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const { data: rData } = await supabase
      .from('game_rounds')
      .select('id, name, date, type, format, status, tournament_group, created_at, course_id')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    const rondasBase = rData || []
    const { data: cursosData } = await supabase
      .from('golf_courses')
      .select('id, name')
    const nombreCampo: Record<string, string> = {}
    ;(cursosData || []).forEach(c => { nombreCampo[c.id] = c.name })

    const sueltas = rondasBase.filter(r => !r.tournament_group)
    const deTorneo = rondasBase.filter(r => r.tournament_group)

    const lista: Item[] = []

    for (const r of sueltas) {
      const { count } = await supabase
        .from('game_round_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_round_id', r.id)
      lista.push({
        tipo: 'juego', id: r.id, name: r.name, date: r.date, type: r.type,
        format: r.format, status: r.status, numJugadores: count ?? 0,
        campo: nombreCampo[r.course_id] || '',
      })
    }

    const grupos: Record<string, typeof deTorneo> = {}
    deTorneo.forEach(r => {
      const g = r.tournament_group as string
      if (!grupos[g]) grupos[g] = []
      grupos[g].push(r)
    })
    Object.entries(grupos).forEach(([g, rondas]) => {
      const primera = rondas[0]
      lista.push({
        tipo: 'torneo', id: g, name: 'Torneo Match Play', date: primera.date,
        type: primera.type, format: 'match_multiple', status: primera.status,
        numJugadores: rondas.length, rondaIds: rondas.map(r => r.id),
        campo: nombreCampo[primera.course_id] || '',
      })
    })

    lista.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

    setItems(lista)
    setLoading(false)
  }

  const adminSuffix = esAdmin ? '&admin=1' : ''

  async function borrarJuego(id: string) {
    if (!esAdmin) return
    const ok = window.confirm('Borrar esta ronda? Se eliminaran tambien sus golpes capturados. Esta accion no se puede deshacer.')
    if (!ok) return
    setBorrando(id)
    try {
      await supabase.from('hole_scores').delete().eq('game_round_id', id)
      await supabase.from('game_round_players').delete().eq('game_round_id', id)
      const { error } = await supabase.from('game_rounds').delete().eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      alert('Error al borrar: ' + (err?.message || err))
    } finally {
      setBorrando(null)
    }
  }

  async function borrarTorneo(grupo: string, rondaIds: string[]) {
    if (!esAdmin) return
    const ok = window.confirm(`Borrar este torneo completo (${rondaIds.length} duelos)? Se eliminaran todos sus golpes. No se puede deshacer.`)
    if (!ok) return
    setBorrando(grupo)
    try {
      for (const rid of rondaIds) {
        await supabase.from('hole_scores').delete().eq('game_round_id', rid)
        await supabase.from('game_round_players').delete().eq('game_round_id', rid)
        await supabase.from('game_rounds').delete().eq('id', rid)
      }
      setItems(prev => prev.filter(r => r.id !== grupo))
    } catch (err: any) {
      alert('Error al borrar torneo: ' + (err?.message || err))
    } finally {
      setBorrando(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Mis Juegos</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>Dashboard</button>
      </div>

      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? 'Modo Edicion - puedes borrar rondas' : 'Modo Solo Lectura'}
      </div>

      <div style={{ padding: '20px 16px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#2ECC71', padding: 40 }}>Cargando juegos...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#81c784', padding: 40 }}>
            <div style={{ fontSize: 15 }}>Aun no hay juegos registrados.</div>
            <button onClick={() => window.location.href = '/juego/nuevo' + (esAdmin ? '?admin=1' : '')} style={{ marginTop: 16, background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>Crear un juego</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(r => {
              const esTorneo = r.tipo === 'torneo'
              const f = esTorneo ? { icon: '\u{2694}', label: 'Torneo Match Play' } : (FORMATOS[r.format] || { icon: '\u{26F3}', label: r.format })
              const destino = esTorneo
                ? `/juego/match-multiple-tablero?grupo=${r.id}${adminSuffix}`
                : rutaTarjeta(r.format, r.id, adminSuffix)
              return (
                <div key={r.id} style={{
                  background: '#1a2e1d', borderRadius: 12, padding: '14px 16px',
                  border: `1px solid ${esTorneo ? '#F39C1244' : '#2ECC7122'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div
                    onClick={() => window.location.href = destino}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer', minWidth: 0 }}
                  >
                    <div style={{ fontSize: 26, flexShrink: 0 }}>{f.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
                      {r.campo && (
                        <div style={{ fontSize: 11, color: '#F39C12', marginTop: 2, fontWeight: 'bold' }}>
                          {r.campo}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#81c784', marginTop: 2 }}>
                        {r.date} - {esTorneo ? `${r.numJugadores} duelo${r.numJugadores !== 1 ? 's' : ''}` : `${r.numJugadores} jugador${r.numJugadores !== 1 ? 'es' : ''}`}
                        <span style={{ textTransform: 'capitalize' }}> - {r.type}</span>
                      </div>
                    </div>
                  </div>
                  {esAdmin && (
                    <button
                      onClick={() => esTorneo ? borrarTorneo(r.id, r.rondaIds || []) : borrarJuego(r.id)}
                      disabled={borrando === r.id}
                      style={{
                        background: 'transparent', border: '1px solid #e74c3c55', borderRadius: 8,
                        color: '#e74c3c', padding: '8px 10px', cursor: 'pointer', fontSize: 14, flexShrink: 0,
                        opacity: borrando === r.id ? 0.5 : 1,
                      }}
                    >Borrar</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}