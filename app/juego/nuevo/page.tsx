'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

const HOYOS_EJEMPLO = [
  { hole_number: 1,  par: 4, si: 3  },
  { hole_number: 2,  par: 4, si: 11 },
  { hole_number: 3,  par: 3, si: 7  },
  { hole_number: 4,  par: 5, si: 1  },
  { hole_number: 5,  par: 4, si: 13 },
  { hole_number: 6,  par: 3, si: 17 },
  { hole_number: 7,  par: 4, si: 5  },
  { hole_number: 8,  par: 5, si: 9  },
  { hole_number: 9,  par: 4, si: 15 },
  { hole_number: 10, par: 4, si: 4  },
  { hole_number: 11, par: 3, si: 12 },
  { hole_number: 12, par: 5, si: 8  },
  { hole_number: 13, par: 4, si: 2  },
  { hole_number: 14, par: 4, si: 14 },
  { hole_number: 15, par: 3, si: 18 },
  { hole_number: 16, par: 5, si: 6  },
  { hole_number: 17, par: 4, si: 10 },
  { hole_number: 18, par: 4, si: 16 },
]

const JUGADORES_EJEMPLO = [
  { id: 1, nombre: 'Carlos Martínez', hcp: 12 },
  { id: 2, nombre: 'Rodrigo Pérez',   hcp: 18 },
  { id: 3, nombre: 'Andrés Valdez',   hcp: 8  },
  { id: 4, nombre: 'Luis Fernández',  hcp: 22 },
  { id: 5, nombre: 'Pedro Garza',     hcp: 15 },
]

function calcularVentajas(hcpDiff: number, holes: typeof HOYOS_EJEMPLO) {
  const ventajas: Record<number, number> = {}
  holes.forEach(h => {
    const vueltasCompletas = Math.floor(hcpDiff / 18)
    const residuo = hcpDiff % 18
    ventajas[h.hole_number] = vueltasCompletas + (h.si <= residuo ? 1 : 0)
  })
  return ventajas
}

export default function NuevoJuegoPage() {
  const [paso, setPaso] = useState(1)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [tipo, setTipo] = useState('informal')
  const [jugador1, setJugador1] = useState<number | null>(null)
  const [jugador2, setJugador2] = useState<number | null>(null)

  const j1 = JUGADORES_EJEMPLO.find(j => j.id === jugador1)
  const j2 = JUGADORES_EJEMPLO.find(j => j.id === jugador2)

  const hcpDiff = j1 && j2 ? Math.abs(j1.hcp - j2.hcp) : 0
  const jugadorConVentaja = j1 && j2 ? (j1.hcp > j2.hcp ? j1 : j2) : null
  const ventajas = hcpDiff > 0 ? calcularVentajas(hcpDiff, HOYOS_EJEMPLO) : {}

  function handleArrancar() {
    window.location.href = '/juego/scorecard'
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
            ⛳ Nuevo Juego
          </div>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{
          background: 'transparent', border: '1px solid #2ECC71',
          borderRadius: 8, color: '#2ECC71', padding: '8px 16px',
          cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia, serif',
        }}>
          ← Dashboard
        </button>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', padding: '16px 24px', gap: 8 }}>
        {[1, 2, 3].map(p => (
          <div key={p} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: paso >= p ? '#2ECC71' : '#1a2e1d',
          }} />
        ))}
      </div>

      <div style={{ padding: '8px 16px 80px' }}>

        {/* PASO 1 — Configuración */}
        {paso === 1 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>
              Paso 1 — Configuración
            </div>

            {/* Campo */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>CAMPO</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>🏌️ Club Las Misiones</div>
              <div style={{ fontSize: 12, color: '#81c784', marginTop: 4 }}>Monterrey, Nuevo León</div>
            </div>

            {/* Formato */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>FORMATO</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, padding: '12px', borderRadius: 10, textAlign: 'center',
                  background: '#2ECC7122', border: '2px solid #2ECC71', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🏆</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71' }}>Match Play</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Singles</div>
                </div>
              </div>
            </div>

            {/* Hoyos */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>HOYOS</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, padding: '10px', borderRadius: 8, textAlign: 'center',
                  background: '#2ECC7122', border: '2px solid #2ECC71',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2ECC71' }}>18</div>
                  <div style={{ fontSize: 11, color: '#81c784' }}>hoyos</div>
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>TIPO</div>
              <div style={{ display: 'flex', gap: 0, border: '1px solid #2ECC7144', borderRadius: 8, overflow: 'hidden' }}>
                {['informal', 'semanal', 'mensual', 'especial'].map(t => (
                  <button key={t} onClick={() => setTipo(t)} style={{
                    flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                    background: tipo === t ? '#2ECC71' : 'transparent',
                    color: tipo === t ? '#0a1a0f' : '#2ECC71',
                    fontWeight: 'bold', fontSize: 10, textTransform: 'capitalize',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#81c784', marginBottom: 8 }}>FECHA</div>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                style={{
                  width: '100%', background: '#0d2410',
                  border: '1px solid #2ECC7144', borderRadius: 8,
                  padding: '10px 14px', color: '#e8f5e9',
                  fontFamily: 'Georgia, serif', fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button onClick={() => setPaso(2)} style={{
              width: '100%', background: '#2ECC71', color: '#0a1a0f',
              border: 'none', borderRadius: 10, padding: '14px',
              cursor: 'pointer', fontFamily: 'Georgia, serif',
              fontSize: 15, fontWeight: 'bold',
            }}>
              Siguiente →
            </button>
          </div>
        )}

        {/* PASO 2 — Selección de jugadores */}
        {paso === 2 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>
              Paso 2 — Selecciona los Jugadores
            </div>

            {/* Jugador 1 */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #2ECC7133', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#2ECC71', marginBottom: 10, letterSpacing: 2 }}>JUGADOR 1</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {JUGADORES_EJEMPLO.map(j => (
                  <div key={j.id} onClick={() => setJugador1(j.id)} style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: jugador1 === j.id ? '#2ECC7122' : '#0d2410',
                    border: `1px solid ${jugador1 === j.id ? '#2ECC71' : '#2ECC7133'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: jugador2 === j.id ? 0.3 : 1,
                    pointerEvents: jugador2 === j.id ? 'none' : 'auto',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: jugador1 === j.id ? 'bold' : 'normal' }}>{j.nombre}</span>
                    <span style={{ fontSize: 14, color: '#2ECC71', fontWeight: 'bold' }}>HCP {j.hcp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jugador 2 */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '16px', border: '1px solid #3498DB33', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#3498DB', marginBottom: 10, letterSpacing: 2 }}>JUGADOR 2</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {JUGADORES_EJEMPLO.map(j => (
                  <div key={j.id} onClick={() => setJugador2(j.id)} style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: jugador2 === j.id ? '#3498DB22' : '#0d2410',
                    border: `1px solid ${jugador2 === j.id ? '#3498DB' : '#3498DB33'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: jugador1 === j.id ? 0.3 : 1,
                    pointerEvents: jugador1 === j.id ? 'none' : 'auto',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: jugador2 === j.id ? 'bold' : 'normal' }}>{j.nombre}</span>
                    <span style={{ fontSize: 14, color: '#3498DB', fontWeight: 'bold' }}>HCP {j.hcp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(1)} style={{
                flex: 1, background: 'transparent', color: '#2ECC71',
                border: '1px solid #2ECC71', borderRadius: 10, padding: '14px',
                cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14,
              }}>
                ← Anterior
              </button>
              <button
                onClick={() => jugador1 && jugador2 && setPaso(3)}
                disabled={!jugador1 || !jugador2}
                style={{
                  flex: 2, background: jugador1 && jugador2 ? '#2ECC71' : '#4a7a50',
                  color: '#0a1a0f', border: 'none', borderRadius: 10, padding: '14px',
                  cursor: jugador1 && jugador2 ? 'pointer' : 'not-allowed',
                  fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold',
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Confirmación */}
        {paso === 3 && j1 && j2 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 16 }}>
              Paso 3 — Confirmación
            </div>

            {/* Resumen del partido */}
            <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '20px', border: '1px solid #2ECC7133', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2ECC7122', border: '2px solid #2ECC71', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏌️</div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j1.nombre}</div>
                  <div style={{ fontSize: 20, color: '#2ECC71', fontWeight: 'bold' }}>HCP {j1.hcp}</div>
                </div>
                <div style={{ fontSize: 18, color: '#4a7a50', fontWeight: 'bold' }}>VS</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3498DB22', border: '2px solid #3498DB', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏌️</div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j2.nombre}</div>
                  <div style={{ fontSize: 20, color: '#3498DB', fontWeight: 'bold' }}>HCP {j2.hcp}</div>
                </div>
              </div>

              {/* Ventajas */}
              {hcpDiff > 0 && (
                <div style={{ background: '#0d2410', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#81c784', marginBottom: 4 }}>VENTAJAS</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2ECC71' }}>
                    {jugadorConVentaja?.nombre} recibe {hcpDiff} ventaja{hcpDiff !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#81c784', marginTop: 4 }}>
                    Distribuidas en los {hcpDiff} hoyos más difíciles según SI
                  </div>
                </div>
              )}
            </div>

            {/* Detalle de ventajas por hoyo */}
            {hcpDiff > 0 && (
              <div style={{ background: '#1a2e1d', borderRadius: 14, padding: '16px', border: '1px solid #2ECC7122', marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>
                  Ventajas por Hoyo
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {HOYOS_EJEMPLO.map(h => {
                    const v = ventajas[h.hole_number] || 0
                    return (
                      <div key={h.hole_number} style={{
                        width: 44, textAlign: 'center',
                        background: v > 0 ? '#2ECC7122' : '#0d2410',
                        border: `1px solid ${v > 0 ? '#2ECC71' : '#2ECC7122'}`,
                        borderRadius: 8, padding: '6px 4px',
                      }}>
                        <div style={{ fontSize: 10, color: '#81c784' }}>H{h.hole_number}</div>
                        <div style={{ fontSize: 11, color: '#4a7a50' }}>SI{h.si}</div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', color: v > 0 ? '#2ECC71' : '#4a7a50' }}>
                          {v > 0 ? `+${v}` : '-'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Info del juego */}
            <div style={{ background: '#1a2e1d', borderRadius: 12, padding: '14px 16px', border: '1px solid #2ECC7122', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Campo</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>Club Las Misiones</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Formato</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>Match Play Singles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Tipo</span>
                <span style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }}>{tipo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Hoyos</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>18</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#81c784' }}>Fecha</span>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>{fecha}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPaso(2)} style={{
                flex: 1, background: 'transparent', color: '#2ECC71',
                border: '1px solid #2ECC71', borderRadius: 10, padding: '14px',
                cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14,
              }}>
                ← Anterior
              </button>
              <button onClick={handleArrancar} style={{
                flex: 2, background: '#2ECC71', color: '#0a1a0f',
                border: 'none', borderRadius: 10, padding: '14px',
                cursor: 'pointer', fontFamily: 'Georgia, serif',
                fontSize: 15, fontWeight: 'bold',
              }}>
                ⛳ Arrancar Juego
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}