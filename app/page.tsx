'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

const PLANES_HREF = '/planes'

export default function Home() {
  const [mostrarInstalar, setMostrarInstalar] = useState(false)
  const [panelInstalar, setPanelInstalar] = useState(false)

  useEffect(() => {
    // Solo mostramos el aviso si la app NO esta instalada (no esta en modo standalone)
    try {
      const enModoApp =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      setMostrarInstalar(!enModoApp)
    } catch (_) {
      setMostrarInstalar(true)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      color: '#e8f5e9',
      background: 'radial-gradient(1200px 600px at 50% -10%, #16361f 0%, transparent 60%), #0a1a0f',
    }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 20px 50px' }}>

        {/* Encabezado tipo marca */}
        <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
          <img src="/logo-kriter.png" alt="Kriter Golf Club" style={{
            width: 100, height: 100, objectFit: 'contain', marginBottom: 8,
          }} />
          <div style={{ fontSize: 14, fontWeight: 400, letterSpacing: .5, color: '#F39C12' }}>Kriter Golf Club</div>
          <div style={{ fontSize: 12, color: '#81c784', marginTop: 3 }}>Tu scorecard digital</div>
          <span style={{
            marginTop: 12, display: 'inline-block', fontSize: 11, color: '#2ECC71',
            border: '1px solid #2ECC71', borderRadius: 20, padding: '4px 14px', letterSpacing: .5,
          }}>Prueba GRATIS 15 días</span>
        </div>

        {/* Enlace para quien ya tiene cuenta */}
        <div style={{ textAlign: 'center', padding: '4px 0 0' }}>
          <a href="/entrar" style={{ fontSize: 16, color: '#F39C12', textDecoration: 'underline', fontWeight: 'bold' }}>
            ¿Ya tienes cuenta? Entra aquí
          </a>
        </div>

        {/* AVISO INSTALAR APP (solo si no esta instalada) */}
        {mostrarInstalar && (
          <div style={{
            marginTop: 18, background: '#12241a', border: '1px solid #F39C1255',
            borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>📱</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#F39C12', fontWeight: 'bold', marginBottom: 2 }}>Instálala en tu celular</div>
              <div style={{ fontSize: 11.5, color: '#81c784', lineHeight: 1.4 }}>Ten Kriter a un toque, con su ícono en tu pantalla.</div>
            </div>
            <button onClick={() => setPanelInstalar(true)} style={{
              background: 'transparent', color: '#F39C12', border: '1px solid #F39C12',
              borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12,
              fontFamily: 'Georgia, serif', fontWeight: 'bold', flexShrink: 0,
            }}>Ver cómo</button>
          </div>
        )}

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#81c784', textTransform: 'uppercase', marginBottom: 18 }}>
            Amateur Golf Score
          </div>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, fontWeight: 'normal', letterSpacing: -1 }}>
            <span style={{ display: 'block', color: '#e8f5e9' }}>Scorecard</span>
            <span style={{ display: 'block', color: '#2ECC71', fontStyle: 'italic' }}>ahora Digital</span>
          </h1>
          <p style={{ marginTop: 18, fontSize: 13, color: '#81c784', lineHeight: 1.6 }}>
            Sistema automático · Estadísticas · Ranking en vivo
          </p>

          {/* Mockup scorecard */}
          <div style={{
            margin: '30px auto 0', maxWidth: 340, background: '#12241a',
            border: '1px solid #2ECC7133', borderRadius: 16, padding: '16px 14px 18px',
            boxShadow: '0 20px 50px rgba(0,0,0,.45)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2ECC7133', paddingBottom: 9, marginBottom: 11 }}>
              <span style={{ fontSize: 10, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase' }}>⛳ Tarjeta · La Herradura</span>
              <span style={{ fontSize: 10, color: '#81c784' }}>Hoy</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#81c784', fontWeight: 'normal', fontSize: 9, padding: '5px 0' }}>Jugador</th>
                  <th style={{ color: '#81c784', fontWeight: 'normal', fontSize: 9, padding: '5px 0' }}>H7</th>
                  <th style={{ color: '#81c784', fontWeight: 'normal', fontSize: 9, padding: '5px 0' }}>H8</th>
                  <th style={{ color: '#81c784', fontWeight: 'normal', fontSize: 9, padding: '5px 0' }}>H9</th>
                  <th style={{ color: '#81c784', fontWeight: 'normal', fontSize: 9, padding: '5px 0' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#e8f5e9', borderTop: '1px solid #1d3324', padding: '5px 0' }}>Rubén</td>
                  <td style={{ borderTop: '1px solid #1d3324', padding: '5px 0' }}><span style={{ display: 'inline-block', width: 18, height: 18, lineHeight: '18px', borderRadius: '50%', border: '1px solid #2ECC71', color: '#2ECC71', fontSize: 10 }}>3</span></td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>4</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>4</td>
                  <td style={{ color: '#2ECC71', fontWeight: 'bold', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>−2</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#e8f5e9', borderTop: '1px solid #1d3324', padding: '5px 0' }}>Julio</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>4</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>5</td>
                  <td style={{ color: '#F39C12', fontWeight: 'bold', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>4</td>
                  <td style={{ color: '#F39C12', fontWeight: 'bold', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>E</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#e8f5e9', borderTop: '1px solid #1d3324', padding: '5px 0' }}>César</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>5</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>4</td>
                  <td style={{ color: '#e8f5e9', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>3</td>
                  <td style={{ color: '#2ECC71', fontWeight: 'bold', borderTop: '1px solid #1d3324', fontSize: 11, padding: '5px 0' }}>−1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA principal */}
        <div style={{ marginTop: 34, textAlign: 'center' }}>
          <a href={PLANES_HREF} style={{
            display: 'block', width: '100%', background: '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 14, padding: '19px', fontFamily: 'Georgia, serif',
            fontSize: 19, fontWeight: 'bold', letterSpacing: .4, textDecoration: 'none',
            boxShadow: '0 10px 30px rgba(46,204,113,.32)',
          }}>Inicia Free Trial</a>
          <div style={{ marginTop: 13, fontSize: 12.5, color: '#81c784' }}>✓ 15 días gratis · Sin tarjeta de crédito ni débito</div>
        </div>

        {/* Features */}
        <section style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #2ECC7133', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { ic: '⛳', ft: 'Torneos de Grupos', fd: 'Twosomes, Threesomes, Foursomes y más. Tambien Stroke Play, Stableford, Match Play y Bola Baja en Parejas.' },
            { ic: '🧮', ft: 'Cálculos automáticos', fd: 'Tu HCP, tu neto y tus ventajas por hoyo, sin sacar la calculadora.' },
            { ic: '📊', ft: 'Estadísticas de tu juego', fd: 'Ve cómo vienes ronda con ronda y dónde ganas o pierdes golpes.' },
            { ic: '🏆', ft: 'Ranking en vivo', fd: 'El marcador de tu grupo se actualiza solo mientras juegan.' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px 16px', background: '#12241a' }}>
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{f.ic}</span>
              <div>
                <div style={{ fontSize: 15, color: '#e8f5e9', marginBottom: 3 }}>{f.ft}</div>
                <div style={{ fontSize: 12, color: '#81c784', lineHeight: 1.5 }}>{f.fd}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Campos */}
        <section style={{ marginTop: 30, background: '#12241a', border: '1px solid #2ECC7133', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#2ECC71', textTransform: 'uppercase', marginBottom: 12 }}>
            Juega en los 5 campos de Monterrey
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, padding: 0, margin: 0 }}>
            {['Las Misiones', 'Valle Alto', 'La Herradura', 'Terrealta', 'El Sol del Vergel'].map((c, i) => (
              <li key={i} style={{ fontSize: 14, color: '#e8f5e9', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 13 }}>⛳</span>{c}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA secundario */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <a href={PLANES_HREF} style={{
            display: 'block', width: '100%', background: '#2ECC71', color: '#0a1a0f',
            border: 'none', borderRadius: 14, padding: '19px', fontFamily: 'Georgia, serif',
            fontSize: 19, fontWeight: 'bold', letterSpacing: .4, textDecoration: 'none',
            boxShadow: '0 10px 30px rgba(46,204,113,.32)',
          }}>Inicia Free Trial</a>
          <div style={{ marginTop: 13, fontSize: 12.5, color: '#81c784' }}>✓ 15 días gratis · Solo tu nombre, teléfono y HCP</div>
        </div>

      </div>

      {/* PANEL: COMO INSTALAR */}
      {panelInstalar && (
        <div onClick={() => setPanelInstalar(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#12241a', border: '1px solid #F39C12', borderRadius: 16,
            padding: 22, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>📱</div>
              <div style={{ fontSize: 17, fontWeight: 'bold', color: '#F39C12' }}>Instala Kriter en tu celular</div>
              <div style={{ fontSize: 12, color: '#81c784', marginTop: 4, lineHeight: 1.5 }}>
                Queda con su ícono en tu pantalla, como cualquier app. Sin descargar nada de la tienda.
              </div>
            </div>

            {/* ANDROID */}
            <div style={{ background: '#0d2410', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid #2ECC7133' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71', marginBottom: 8 }}>Android (Chrome)</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#e8f5e9', lineHeight: 1.9 }}>
                <li>Abre Kriter en Chrome</li>
                <li>Toca el menú de los 3 puntos (arriba a la derecha)</li>
                <li>Elige <b style={{ color: '#F39C12' }}>Agregar a pantalla principal</b></li>
                <li>Confirma. Listo, ya tienes el ícono.</li>
              </ol>
            </div>

            {/* IPHONE */}
            <div style={{ background: '#0d2410', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #2ECC7133' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2ECC71', marginBottom: 8 }}>iPhone (Safari)</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#e8f5e9', lineHeight: 1.9 }}>
                <li>Abre Kriter en <b style={{ color: '#F39C12' }}>Safari</b> (importante: no Chrome)</li>
                <li>Toca el botón de compartir (el cuadro con la flecha, abajo)</li>
                <li>Baja y elige <b style={{ color: '#F39C12' }}>Agregar a inicio</b></li>
                <li>Confirma. Listo, ya tienes el ícono.</li>
              </ol>
            </div>

            <button onClick={() => setPanelInstalar(false)} style={{
              width: '100%', background: '#F39C12', color: '#0a1a0f', border: 'none',
              borderRadius: 10, padding: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif',
              fontSize: 14, fontWeight: 'bold',
            }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}