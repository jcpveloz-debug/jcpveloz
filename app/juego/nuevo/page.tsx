'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'
const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Jugador {
  id: string
  golf_name: string
  hcp_base: number
}

interface Hoyo {
  hole_number: number
  par: number
  si: number
}

export default function NuevoJuegoPage() {
  const [paso, setPaso] = useState(1)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [tipo, setTipo] = useState('informal')
  const [formato, setFormato] = useState<'match_singles' | 'match_fourball' | 'stroke_play' | 'stableford'>('match_singles')

  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hoyos, setHoyos] = useState<Hoyo[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)

  // Singles
  const [jugador1, setJugador1] = useState<string | null>(null)
  const [jugador2, setJugador2] = useState<string | null>(null)

  // Fourball: 4 seleccionados (paso 2) + reparto en parejas (paso 3)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [parejaA, setParejaA] = useState<string[]>([])
  const [parejaB, setParejaB] = useState<string[]>([])

  // Stroke / Stableford: lista de seleccionados (2 a 8)
  const [seleccionadosStroke, setSeleccionadosStroke] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      setLoading(true)
      const { data: pData } = await supabase
        .from('players')
        .select('id, golf_name, hcp_base')
        .eq('club_id', CLUB_ID)
        .eq('active', true)
        .order('golf_name')

      const { data: hData } = await supabase
        .from('course_holes')
        .select('hole_number, par, si')
        .eq('course_id', COURSE_ID)
        .order('hole_number')

      setJugadores(pData || [])
      setHoyos(hData || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const adminSuffix = esAdmin ? '?admin=1' : ''

  function toggleSeleccion(id: string) {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(s => s !== id))
      setParejaA(parejaA.filter(p => p !== id))
      setParejaB(parejaB.filter(p => p !== id))
    } else {
      if (seleccionados.length >= 4) return
      setSeleccionados([...seleccionados, id])
    }
  }

  function asignarPareja(id: string, pareja: 'A' | 'B') {
    let nuevaA = parejaA.filter(p => p !== id)
    let nuevaB = parejaB.filter(p => p !== id)
    if (pareja === 'A') {
      if (nuevaA.length >= 2) return
      nuevaA = [...nuevaA, id]
    } else {
      if (nuevaB.length >= 2) return
      nuevaB = [...nuevaB, id]
    }
    setParejaA(nuevaA)
    setParejaB(nuevaB)
  }

  function toggleStroke(id: string) {
    if (seleccionadosStroke.includes(id)) {
      setSeleccionadosStroke(seleccionadosStroke.filter(s => s !== id))
    } else {
      if (seleccionadosStroke.length >= 8) return
      setSeleccionadosStroke([...seleccionadosStroke, id])
    }
  }

  function nombre(id: string | null) {
    return jugadores.find(j => j.id === id)?.golf_name || ''
  }
  function hcpDe(id: string | null) {
    const v = jugadores.find(j => j.id === id)?.hcp_base
    return v !== null && v !== undefined ? v : 0
  }

  async function handleArrancar() {
    if (!esAdmin) {
      alert('👁️ Estás en modo solo lectura.\n\nPara crear juegos, el organizador debe activar el modo edición con su PIN desde el Dashboard.')
      return
    }
    setGuardando(true)
    try {
      const { data: ronda, error: e1 } = await supabase
        .from('game_rounds')
        .insert({
          club_id: CLUB_ID,
          course_id: COURSE_ID,
          name: `Juego ${fecha}`,
          date: fecha,
          type: tipo,
          format: formato,
          status: 'in_progress',
        })
        .select()
        .single()

      if (e1 || !ronda) throw e1 || new Error('No se creó el juego')

      let filas: any[] = []
      if (formato === 'match_singles') {
        filas = [
          { game_round_id: ronda.id, player_id: jugador1, club_id: CLUB_ID, hcp_index: hcpDe(jugador1), team_number: 1, rival_id: jugador2 },
          { game_round_id: ronda.id, player_id: jugador2, club_id: CLUB_ID, hcp_index: hcpDe(jugador2), team_number: 2, rival_id: jugador1 },
        ]
      } else if (formato === 'match_fourball') {
        filas = [
          ...parejaA.map(pid => ({ game_round_id: ronda.id, player_id: pid, club_id: CLUB_ID, hcp_index: hcpDe(pid), team_number: 1 })),
          ...parejaB.map(pid => ({ game_round_id: ronda.id, player_id: pid, club_id: CLUB_ID, hcp_index: hcpDe(pid), team_number: 2 })),
        ]
      } else {
        // stroke_play y stableford: todos en una lista, sin equipos
        filas = seleccionadosStroke.map(pid => ({ game_round_id: ronda.id, player_id: pid, club_id: CLUB_ID, hcp_index: hcpDe(pid), team_number: 1 }))
      }

      const { error: e2 } = await supabase.from('game_round_players').insert(filas)
      if (e2) throw e2

      // pasamos el id del juego al scorecard correcto (manteniendo modo admin)
      let ruta = '/juego/scorecard'
      if (formato === 'match_fourball') ruta = '/juego/scorecard-fourball'
      else if (formato === 'stroke_play') ruta = '/juego/tarjeta-stroke'
      else if (formato === 'stableford') ruta = '/juego/tarjeta-stableford'
      window.location.href = `${ruta}?game=${ronda.id}&admin=1`
    } catch (err: any) {
      alert('Error al crear el juego: ' + (err?.message || err))
      setGuardando(false)
    }
  }

  const puedeAvanzarPaso2 =
    formato === 'match_singles'
      ? !!(jugador1 && jugador2)
      : formato === 'match_fourball'
        ? seleccionados.length === 4
        : seleccionadosStroke.length >= 2

  const parejasCompletas = parejaA.length === 2 && parejaB.length === 2

  function tituloPaso2() {
    if (formato === 'match_singles') return 'Paso 2 — Selecciona los Jugadores'
    if (formato === 'match_fourball') return 'Paso 2 — Selecciona 4 Jugadores'
    return 'Paso 2 — Selecciona Jugadores (2 a 8)'
  }

  function nombreFormato() {
    if (formato === 'match_singles') return 'Match Play Singles'
    if (formato === 'match_fourball') return 'Fourball (2 vs 2)'
    if (formato === 'stableford') return 'Stableford'
    return 'Stroke Play'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>⛳ Nuevo Juego</div>
        </div>
        <button onClick={() => window.location.href = '/dashboard' + adminSuffix} style={{ background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif' }}>
          ← Dashboard
        </button>
      </div>

      {/* Etiqueta de modo */}
      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición' : '👁️ Modo Solo Lectura — no se podrá crear el juego'}
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', padding: '16px 24px', gap: 8 }}>
        {[1, 2, 3].map(p => (
          <div key={p} style={{ flex: 1, height: 4, borderRadius: 2, background: paso >= p ? '#2ECC71' : '#1a2e1d' }} />
        ))}
      </div>

      <div style={{ padding: '8px 16px 80px' }}>

        {/* PASO 1 — Configuración */}
        {paso === 1 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>Paso 1 — Configuración</div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>CAMPO</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>🏌️ Club Las Misiones</div>
              <div style={{ fontSize: 12, color: '#81c784', marginTop: 4 }}>Monterrey, Nuevo León</div>
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>FORMATO</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div onClick={() => setFormato('match_singles')} style={{
                  flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  background: formato === 'match_singles' ? '#2ECC7122' : '#0d2410',
                  border: `2px solid ${formato === 'match_singles' ? '#2ECC71' : '#2ECC7133'}`,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🏆</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>Match Play</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Singles (1 vs 1)</div>
                </div>
                <div onClick={() => setFormato('match_fourball')} style={{
                  flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  background: formato === 'match_fourball' ? '#2ECC7122' : '#0d2410',
                  border: `2px solid ${formato === 'match_fourball' ? '#2ECC71' : '#2ECC7133'}`,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>👥</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>Fourball</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Parejas (2 vs 2)</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => setFormato('stroke_play')} style={{
                  flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  background: formato === 'stroke_play' ? '#2ECC7122' : '#0d2410',
                  border: `2px solid ${formato === 'stroke_play' ? '#2ECC71' : '#2ECC7133'}`,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>Stroke Play</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Por golpes (2 a 8)</div>
                </div>
                <div onClick={() => setFormato('stableford')} style={{
                  flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  background: formato === 'stableford' ? '#2ECC7122' : '#0d2410',
                  border: `2px solid ${formato === 'stableford' ? '#2ECC71' : '#2ECC7133'}`,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🎯</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>Stableford</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Por puntos (2 a 8)</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>TIPO</div>
              <div style={{ display: 'flex', gap: 0, border: '1px solid #2ECC7144', borderRadius: 8, overflow: 'hidden' }}>
                {['informal', 'semanal', 'mensual', 'especial'].map(t => (
                  <button key={t} onClick={() => setTipo(t)} style={{
                    flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                    background: tipo === t ? '#2ECC71' : 'transparent',
                    color: tipo === t ? '#0a1a0f' : '#2ECC71',
                    fontWeight: 'bold', fontSize: 10, textTransform: 'capitalize',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>FECHA</div>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', background: '#0d2410', border: '1px solid #2ECC7144', borderRadius: 8, padding: '10px 14px', color: '#e8f5e9', fontFamily: 'Georgia, serif', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

<button onClick={() => setPaso(2)} style={{ width: '100%', background: '#2ECC71', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold' }}>
              Siguiente →
            </button>

            <div style={{ margin: '20px 0 8px', textAlign: 'center', fontSize: 11, color: '#4a7a50', letterSpacing: 2 }}>— O TORNEO DE VARIOS DUELOS —</div>
            <button onClick={() => window.location.href = '/juego/match-multiple' + adminSuffix} style={{
              width: '100%', background: 'transparent', color: '#F39C12', border: '1px solid #F39C12',
              borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
            }}>
              ⚔️ Match Play Múltiple (varias parejas)
            </button>
          </div>
        )}

        {/* PASO 2 — Selección de jugadores */}
        {paso === 2 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>
              {tituloPaso2()}
            </div>

            {formato === 'match_singles' && (
              <>
                <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>JUGADOR 1</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {jugadores.map(j => (
                      <div key={j.id} onClick={() => setJugador1(j.id)} style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        background: jugador1 === j.id ? '#2ECC7122' : '#0d2410',
                        border: `1px solid ${jugador1 === j.id ? '#2ECC71' : '#2ECC7133'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        opacity: jugador2 === j.id ? 0.3 : 1, pointerEvents: jugador2 === j.id ? 'none' : 'auto',
                      }}>
                        <span style={{ fontSize: 14, fontWeight: jugador1 === j.id ? 'bold' : 'normal' }}>{j.golf_name}</span>
                        <span style={{ fontSize: 14, color: '#2ECC71', fontWeight: 'bold' }}>HCP {j.hcp_base}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #3498DB33', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#3498DB', marginBottom: 10, letterSpacing: 2 }}>JUGADOR 2</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {jugadores.map(j => (
                      <div key={j.id} onClick={() => setJugador2(j.id)} style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        background: jugador2 === j.id ? '#3498DB22' : '#0d2410',
                        border: `1px solid ${jugador2 === j.id ? '#3498DB' : '#3498DB33'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        opacity: jugador1 === j.id ? 0.3 : 1, pointerEvents: jugador1 === j.id ? 'none' : 'auto',
                      }}>
                        <span style={{ fontSize: 14, fontWeight: jugador2 === j.id ? 'bold' : 'normal' }}>{j.golf_name}</span>
                        <span style={{ fontSize: 14, color: '#3498DB', fontWeight: 'bold' }}>HCP {j.hcp_base}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {formato === 'match_fourball' && (
              <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>
                  SELECCIONADOS: {seleccionados.length} / 4
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {jugadores.map(j => {
                    const sel = seleccionados.includes(j.id)
                    const bloqueado = !sel && seleccionados.length >= 4
                    return (
                      <div key={j.id} onClick={() => toggleSeleccion(j.id)} style={{
                        padding: '10px 14px', borderRadius: 8, cursor: bloqueado ? 'not-allowed' : 'pointer',
                        background: sel ? '#2ECC7122' : '#0d2410',
                        border: `1px solid ${sel ? '#2ECC71' : '#2ECC7133'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        opacity: bloqueado ? 0.3 : 1,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: sel ? 'bold' : 'normal' }}>
                          {sel ? '✓ ' : ''}{j.golf_name}
                        </span>
                        <span style={{ fontSize: 14, color: '#2ECC71', fontWeight: 'bold' }}>HCP {j.hcp_base}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(formato === 'stroke_play' || formato === 'stableford') && (
              <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>
                  SELECCIONADOS: {seleccionadosStroke.length} / 8 (mínimo 2)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {jugadores.map(j => {
                    const sel = seleccionadosStroke.includes(j.id)
                    const bloqueado = !sel && seleccionadosStroke.length >= 8
                    return (
                      <div key={j.id} onClick={() => toggleStroke(j.id)} style={{
                        padding: '10px 14px', borderRadius: 8, cursor: bloqueado ? 'not-allowed' : 'pointer',
                        background: sel ? '#2ECC7122' : '#0d2410',
                        border: `1px solid ${sel ? '#2ECC71' : '#2ECC7133'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        opacity: bloqueado ? 0.3 : 1,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: sel ? 'bold' : 'normal' }}>
                          {sel ? '✓ ' : ''}{j.golf_name}
                        </span>
                        <span style={{ fontSize: 14, color: '#2ECC71', fontWeight: 'bold' }}>HCP {j.hcp_base}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(1)} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14 }}>
                ← Anterior
              </button>
              <button onClick={() => puedeAvanzarPaso2 && setPaso(3)} disabled={!puedeAvanzarPaso2} style={{
                flex: 2, background: puedeAvanzarPaso2 ? '#2ECC71' : '#4a7a50', color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px',
                cursor: puedeAvanzarPaso2 ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
              }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>
              {formato === 'match_fourball' ? 'Paso 3 — Arma las Parejas' : 'Paso 3 — Confirmación'}
            </div>

            {formato === 'match_singles' && jugador1 && jugador2 && (
              <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '20px', border: '1px solid #2ECC7133', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{nombre(jugador1)}</div>
                    <div style={{ fontSize: 20, color: '#2ECC71', fontWeight: 'bold' }}>HCP {hcpDe(jugador1)}</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#4a7a50', fontWeight: 'bold' }}>VS</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{nombre(jugador2)}</div>
                    <div style={{ fontSize: 20, color: '#3498DB', fontWeight: 'bold' }}>HCP {hcpDe(jugador2)}</div>
                  </div>
                </div>
              </div>
            )}

            {formato === 'match_fourball' && (
              <>
                <div style={{ fontSize: 12, color: '#81c784', marginBottom: 12 }}>
                  Toca A o B para asignar cada jugador. Deben quedar 2 y 2.
                </div>
                {seleccionados.map(id => (
                  <div key={id} style={{ background: '#1a2e1d', borderRadius: 10, padding: '12px 14px', border: '1px solid #2ECC7122', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 'bold' }}>{nombre(id)}</div>
                      <div style={{ fontSize: 12, color: '#81c784' }}>HCP {hcpDe(id)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => asignarPareja(id, 'A')} style={{
                        width: 42, height: 42, borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
                        background: parejaA.includes(id) ? '#2ECC71' : '#0d2410',
                        color: parejaA.includes(id) ? '#0a1a0f' : '#2ECC71',
                        border: '1px solid #2ECC71',
                      }}>A</button>
                      <button onClick={() => asignarPareja(id, 'B')} style={{
                        width: 42, height: 42, borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
                        background: parejaB.includes(id) ? '#3498DB' : '#0d2410',
                        color: parejaB.includes(id) ? '#0a1a0f' : '#3498DB',
                        border: '1px solid #3498DB',
                      }}>B</button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#0d2410', borderRadius: 10, padding: '12px', border: '1px solid #2ECC7144' }}>
                    <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 6, letterSpacing: 2 }}>PAREJA A</div>
                    {parejaA.length === 0 ? <div style={{ fontSize: 12, color: '#4a7a50' }}>—</div> : parejaA.map(id => (
                      <div key={id} style={{ fontSize: 13 }}>{nombre(id)}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1, background: '#0d2410', borderRadius: 10, padding: '12px', border: '1px solid #3498DB44' }}>
                    <div style={{ fontSize: 11, color: '#3498DB', marginBottom: 6, letterSpacing: 2 }}>PAREJA B</div>
                    {parejaB.length === 0 ? <div style={{ fontSize: 12, color: '#4a7a50' }}>—</div> : parejaB.map(id => (
                      <div key={id} style={{ fontSize: 13 }}>{nombre(id)}</div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(formato === 'stroke_play' || formato === 'stableford') && (
              <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>JUGADORES ({seleccionadosStroke.length})</div>
                {seleccionadosStroke.map(id => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2ECC7111' }}>
                    <span style={{ fontSize: 14, fontWeight: 'bold' }}>{nombre(id)}</span>
                    <span style={{ fontSize: 13, color: '#2ECC71' }}>HCP {hcpDe(id)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7122', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Formato</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>{nombreFormato()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Tipo</span>
                <span style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }}>{tipo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Fecha</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>{fecha}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(2)} style={{ flex: 1, background: 'transparent', color: '#2ECC71', border: '1px solid #2ECC71', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14 }}>
                ← Anterior
              </button>
              <button
                onClick={handleArrancar}
                disabled={guardando || (formato === 'match_fourball' && !parejasCompletas)}
                style={{
                  flex: 2,
                  background: (formato === 'match_fourball' && !parejasCompletas) || guardando ? '#4a7a50' : '#2ECC71',
                  color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px',
                  cursor: guardando || (formato === 'match_fourball' && !parejasCompletas) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
                }}
              >
                {guardando ? 'Creando...' : '⛳ Arrancar Juego'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}