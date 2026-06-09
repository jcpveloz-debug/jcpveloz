'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CLUB_ID = '209f9af7-a863-4967-b6fe-9c3bb96dcafe'
const COURSE_ID = '92b555b3-cba3-4d0c-84fd-b1d2720f1f07'

interface Jugador { id: string; nombre: string; hcp: number }
interface Duelo { j1: Jugador; j2: Jugador }

export default function MatchMultiplePage() {
  const [esAdmin, setEsAdmin] = useState(false)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [duelos, setDuelos] = useState<Duelo[]>([])
  const [esperando, setEsperando] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1') setEsAdmin(true)

    async function cargar() {
      const { data } = await supabase
        .from('players')
        .select('id, golf_name, hcp_base')
        .eq('club_id', CLUB_ID)
        .eq('active', true)
        .order('golf_name')
      setJugadores((data || []).map(p => ({ id: p.id, nombre: p.golf_name, hcp: p.hcp_base ?? 0 })))
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ECC71', fontFamily: 'Georgia, serif', fontSize: 18 }}>
      Cargando jugadores...
    </div>
  )

  // jugadores ya usados en algún duelo
  const enDuelo = new Set<string>()
  duelos.forEach(d => { enDuelo.add(d.j1.id); enDuelo.add(d.j2.id) })

  function toggleSeleccion(id: string) {
    if (!esAdmin) return
    if (enDuelo.has(id)) return // ya está en un duelo
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // arma duelos: al tocar un jugador seleccionado, lo empareja con el "esperando"
  function tocarParaDuelo(id: string) {
    if (!esAdmin) return
    if (enDuelo.has(id)) return
    if (!seleccionados.includes(id)) return
    if (esperando === null) {
      setEsperando(id)
    } else if (esperando === id) {
      setEsperando(null) // deseleccionar
    } else {
      const j1 = jugadores.find(j => j.id === esperando)!
      const j2 = jugadores.find(j => j.id === id)!
      setDuelos(prev => [...prev, { j1, j2 }])
      setEsperando(null)
    }
  }

  function quitarDuelo(i: number) {
    setDuelos(prev => prev.filter((_, idx) => idx !== i))
  }

  // jugadores seleccionados que aún no están en un duelo
  const disponibles = seleccionados.filter(id => !enDuelo.has(id))

  async function crearTorneo() {
    if (duelos.length === 0) { alert('Arma al menos un duelo'); return }
    setCreando(true)
    try {
      const grupo = 'mpm_' + Date.now() // identificador único del torneo
      for (let i = 0; i < duelos.length; i++) {
        const d = duelos[i]
        // crear el game_round del duelo
const { data: gr, error: e1 } = await supabase
          .from('game_rounds')
          .insert({
            club_id: CLUB_ID,
            course_id: COURSE_ID,
            name: `Match Múltiple Duelo ${i + 1}`,
            date: new Date().toISOString().split('T')[0],
            type: 'informal',
            format: 'match_singles',
            status: 'in_progress',
            tournament_group: grupo,
          })
          .select()
          .single()
        if (e1) throw e1

        // agregar los 2 jugadores al duelo
        const { error: e2 } = await supabase.from('game_round_players').insert([
          { game_round_id: gr.id, player_id: d.j1.id, club_id: CLUB_ID, hcp_index: d.j1.hcp, team_number: '1' },
          { game_round_id: gr.id, player_id: d.j2.id, club_id: CLUB_ID, hcp_index: d.j2.hcp, team_number: '2' },
        ])
        if (e2) throw e2
      }
      // ir al tablero del torneo
      window.location.href = `/juego/match-multiple-tablero?grupo=${grupo}${esAdmin ? '&admin=1' : ''}`
    } catch (err: any) {
      alert('Error al crear torneo: ' + (err?.message || err))
      setCreando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a1f 0%, #0d2410 100%)', borderBottom: '2px solid #2ECC71', padding: '16px 20px' }}>
        <button onClick={() => window.location.href = '/dashboard' + (esAdmin ? '?admin=1' : '')} style={{
          background: 'transparent', border: '1px solid #2ECC71', borderRadius: 8, color: '#2ECC71',
          padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif', marginBottom: 10,
        }}>← Dashboard</button>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>Kriter Golf Club</div>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>⚔️ Match Play Múltiple</div>
      </div>

      <div style={{
        background: esAdmin ? '#2ECC7122' : '#F39C1222',
        color: esAdmin ? '#2ECC71' : '#F39C12',
        textAlign: 'center', padding: '6px', fontSize: 12, letterSpacing: 1,
      }}>
        {esAdmin ? '✏️ Modo Edición' : '👁️ Solo lectura — entra como admin para armar'}
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {/* Paso 1: seleccionar */}
        <div style={{ fontSize: 12, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>
          1 · Selecciona jugadores ({seleccionados.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          {jugadores.map(j => {
            const sel = seleccionados.includes(j.id)
            const usado = enDuelo.has(j.id)
            return (
              <div key={j.id} onClick={() => toggleSeleccion(j.id)} style={{
                background: usado ? '#0d241080' : sel ? '#2ECC7122' : '#1a2e1d',
                border: `1px solid ${sel ? '#2ECC71' : '#2ECC7133'}`,
                borderRadius: 10, padding: '10px 12px', cursor: esAdmin && !usado ? 'pointer' : 'default',
                opacity: usado ? 0.4 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: sel ? 'bold' : 'normal' }}>{j.nombre.split(' ')[0]}</span>
                <span style={{ fontSize: 10, color: '#81c784' }}>{usado ? 'en duelo' : `HCP ${j.hcp}`}</span>
              </div>
            )
          })}
        </div>

        {/* Paso 2: armar duelos */}
        {disponibles.length > 0 && (
          <>
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 6 }}>
              2 · Toca 2 jugadores para formar un duelo
            </div>
            <div style={{ fontSize: 11, color: '#81c784', marginBottom: 10 }}>
              {esperando ? `Esperando rival para ${jugadores.find(j => j.id === esperando)?.nombre.split(' ')[0]}...` : 'Toca un jugador y luego su rival'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {disponibles.map(id => {
                const j = jugadores.find(x => x.id === id)!
                const esp = esperando === id
                return (
                  <button key={id} onClick={() => tocarParaDuelo(id)} style={{
                    background: esp ? '#F39C12' : '#0d2410', color: esp ? '#0a1a0f' : '#e8f5e9',
                    border: `1px solid ${esp ? '#F39C12' : '#2ECC7144'}`, borderRadius: 20,
                    padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: esp ? 'bold' : 'normal',
                  }}>{j.nombre.split(' ')[0]}</button>
                )
              })}
            </div>
          </>
        )}

        {/* Duelos armados */}
        {duelos.length > 0 && (
          <>
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 10 }}>
              Duelos armados ({duelos.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {duelos.map((d, i) => (
                <div key={i} style={{ background: '#1a2e1d', border: '1px solid #2ECC7133', borderRadius: 10, padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#81c784' }}>Duelo {i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>{d.j1.nombre.split(' ')[0]}</span>
                    <span style={{ fontSize: 11, color: '#4a7a50' }}>vs</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: '#3498DB' }}>{d.j2.nombre.split(' ')[0]}</span>
                  </div>
                  <button onClick={() => quitarDuelo(i)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Crear torneo */}
        {esAdmin && duelos.length > 0 && (
          <button onClick={crearTorneo} disabled={creando} style={{
            width: '100%', background: creando ? '#4a7a50' : '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 12, padding: '16px', cursor: creando ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
          }}>
            {creando ? 'Creando torneo...' : `⚔️ Crear Torneo con ${duelos.length} duelo${duelos.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  )
}