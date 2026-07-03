'use client'

export const dynamic = 'force-dynamic'

const PLANES_HREF = '/planes'

export default function Home() {
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
          }}>Prueba GRATIS 30 días</span>
        </div>
{/* Enlace para quien ya tiene cuenta */}
        <div style={{ textAlign: 'center', padding: '4px 0 0' }}>
          <a href="/entrar" style={{ fontSize: 13, color: '#2ECC71', textDecoration: 'underline' }}>
            ¿Ya tienes cuenta? Entra aquí
          </a>
        </div>
        
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
          <div style={{ marginTop: 13, fontSize: 12.5, color: '#81c784' }}>✓ Sin tarjeta de crédito ni débito</div>
        </div>

        {/* Features */}
        <section style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #2ECC7133', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { ic: '⛳', ft: 'Varios formatos', fd: 'Stroke Play, Stableford, Match Play y torneos en grupos de 2 a 6.' },
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
          <div style={{ marginTop: 13, fontSize: 12.5, color: '#81c784' }}>Solo tu nombre, teléfono y correo</div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 10, color: '#4a6450', letterSpacing: .5, lineHeight: 1.7 }}>
          © 2026 Julio C. Perales — Kriter Golf Club
        </div>

      </div>
    </div>
  )
}