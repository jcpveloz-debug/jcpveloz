'use client'

import { useState, useEffect } from 'react'

const jugadoresMock = [
  { id: 1, nombre: 'Carlos Martínez', email: 'carlos@golf.com', hcp: 12, hcp_source: 'manual', ghin: '', activo: true },
  { id: 2, nombre: 'Rodrigo Pérez', email: 'rodrigo@golf.com', hcp: 18, hcp_source: 'ghin', ghin: '1234567', activo: true },
  { id: 3, nombre: 'Andrés Valdez', email: 'andres@golf.com', hcp: 8, hcp_source: 'manual', ghin: '', activo: true },
  { id: 4, nombre: 'Luis Fernández', email: 'luis@golf.com', hcp: 22, hcp_source: 'ghin', ghin: '7654321', activo: false },
]

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState(jugadoresMock)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: '', email: '', hcp: '', hcp_source: 'manual', ghin: ''
  })

  const jugadoresFiltrados = jugadores.filter(j => {
    const matchBusqueda = j.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchFiltro = filtro === 'todos' ? true : filtro === 'activos' ? j.activo : !j.activo
    return matchBusqueda && matchFiltro
  })

  function handleAgregar() {
    if (!nuevoJugador.nombre || !nuevoJugador.hcp) return
    setJugadores(prev => [...prev, {
      id: prev.length + 1,
      nombre: nuevoJugador.nombre,
      email: nuevoJugador.email,
      hcp: Number(nuevoJugador.hcp),
      hcp_source: nuevoJugador.hcp_source,
      ghin: nuevoJugador.ghin,
      activo: true,
    }])
    setNuevoJugador({ nombre: '', email: '', hcp: '', hcp_source: 'manual', ghin: '' })
    setShowForm(false)
  }

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 4 }}>
            Kriter Golf Club
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>
            👥 Jugadores
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: 'transparent',
            border: '1px solid #2ECC71',
            borderRadius: 8,
            color: '#2ECC71',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Georgia, serif',
          }}
        >
          ← Dashboard
        </button>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Buscador y filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar jugador..."
            style={{
              flex: 1,
              background: '#1a2e1d',
              border: '1px solid #2ECC7144',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#e8f5e9',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              minWidth: 150,
            }}
          />
          <div style={{ display: 'flex', gap: 0, border: '1px solid #2ECC7144', borderRadius: 8, overflow: 'hidden' }}>
            {['todos', 'activos', 'inactivos'].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding: '8px 12px', border: 'none', cursor: 'pointer',
                background: filtro === f ? '#2ECC71' : 'transparent',
                color: filtro === f ? '#0a1a0f' : '#2ECC71',
                fontWeight: 'bold', fontSize: 11, textTransform: 'capitalize',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Botón agregar */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            background: showForm ? '#1a2e1d' : '#2ECC71',
            color: showForm ? '#2ECC71' : '#0a1a0f',
            border: showForm ? '1px solid #2ECC71' : 'none',
            borderRadius: 10,
            padding: '12px',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: 16,
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Agregar Jugador'}
        </button>

        {/* Formulario nuevo jugador */}
        {showForm && (
          <div style={{
            background: '#1a2e1d',
            borderRadius: 14,
            padding: '16px',
            border: '1px solid #2ECC7133',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 14 }}>
              Nuevo Jugador
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                value={nuevoJugador.nombre}
                onChange={e => setNuevoJugador(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre completo *"
                style={{
                  background: '#0d2410', border: '1px solid #2ECC7144',
                  borderRadius: 8, padding: '10px 14px', color: '#e8f5e9',
                  fontFamily: 'Georgia, serif', fontSize: 14,
                }}
              />
              <input
                type="email"
                value={nuevoJugador.email}
                onChange={e => setNuevoJugador(p => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                style={{
                  background: '#0d2410', border: '1px solid #2ECC7144',
                  borderRadius: 8, padding: '10px 14px', color: '#e8f5e9',
                  fontFamily: 'Georgia, serif', fontSize: 14,
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  value={nuevoJugador.hcp}
                  onChange={e => setNuevoJugador(p => ({ ...p, hcp: e.target.value }))}
                  placeholder="HCP *"
                  style={{
                    flex: 1, background: '#0d2410', border: '1px solid #2ECC7144',
                    borderRadius: 8, padding: '10px 14px', color: '#e8f5e9',
                    fontFamily: 'Georgia, serif', fontSize: 14,
                  }}
                />
                <div style={{ display: 'flex', gap: 0, border: '1px solid #2ECC7144', borderRadius: 8, overflow: 'hidden' }}>
                  {['manual', 'ghin'].map(s => (
                    <button key={s} onClick={() => setNuevoJugador(p => ({ ...p, hcp_source: s }))} style={{
                      padding: '8px 14px', border: 'none', cursor: 'pointer',
                      background: nuevoJugador.hcp_source === s ? '#2ECC71' : 'transparent',
                      color: nuevoJugador.hcp_source === s ? '#0a1a0f' : '#2ECC71',
                      fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase',
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {nuevoJugador.hcp_source === 'ghin' && (
                <input
                  type="text"
                  value={nuevoJugador.ghin}
                  onChange={e => setNuevoJugador(p => ({ ...p, ghin: e.target.value }))}
                  placeholder="GHIN Number"
                  style={{
                    background: '#0d2410', border: '1px solid #2ECC7144',
                    borderRadius: 8, padding: '10px 14px', color: '#e8f5e9',
                    fontFamily: 'Georgia, serif', fontSize: 14,
                  }}
                />
              )}
              <button onClick={handleAgregar} style={{
                background: '#2ECC71', color: '#0a1a0f', border: 'none',
                borderRadius: 8, padding: '12px', cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
              }}>
                Guardar Jugador
              </button>
            </div>
          </div>
        )}

        {/* Lista de jugadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jugadoresFiltrados.map(j => (
            <div key={j.id} style={{
              background: '#1a2e1d',
              borderRadius: 12,
              padding: '14px 16px',
              border: `1px solid ${j.activo ? '#2ECC7122' : '#E74C3C22'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: j.activo ? '#2ECC7122' : '#E74C3C22',
                  border: `2px solid ${j.activo ? '#2ECC71' : '#E74C3C'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  🏌️
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j.nombre}</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>{j.email}</div>
                  {j.ghin && <div style={{ fontSize: 10, color: '#4a7a50' }}>GHIN: {j.ghin}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 20, fontWeight: 'bold',
                  color: '#2ECC71',
                }}>
                  {j.hcp}
                </div>
                <div style={{ fontSize: 10, color: '#4a7a50', textTransform: 'uppercase' }}>
                  {j.hcp_source}
                </div>
                <div style={{
                  fontSize: 10, marginTop: 4,
                  color: j.activo ? '#2ECC71' : '#E74C3C',
                }}>
                  {j.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {jugadoresFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', color: '#4a7a50', padding: '40px 0', fontSize: 14 }}>
            No se encontraron jugadores
          </div>
        )}

      </div>
    </div>
  )
}