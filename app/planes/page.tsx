'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'

// ====== PRECIOS DE EJEMPLO — Julio los ajusta cuando quiera ======
const PLANES = [
  { id: 'anual',     label: 'Anual',     precio: '$2,400 MXN / año',   nota: '30 días gratis, luego', destacado: true,  etiqueta: 'Mejor Valor' },
  { id: 'mensual',   label: 'Mensual',   precio: '$229 MXN / mes',     nota: '30 días gratis, luego', destacado: false },
  { id: 'quincenal', label: 'Quincenal', precio: '$119 MXN / quincena', nota: '',                      destacado: false },
  { id: 'semanal',   label: 'Semanal',   precio: '$79 MXN / semana',   nota: '',                       destacado: false },
  { id: 'ronda',     label: 'Por Ronda', precio: '$240 MXN / ronda',   nota: 'Grupo de 4 a 6 jugadores', destacado: false },]

// ====== FEATURES: qué trae Free vs Premium ======
const FEATURES = [
  { txt: 'Scorecard digital',                       free: true,  prem: true },
  { txt: 'Cálculo automático de HCP',               free: true,  prem: true },
  { txt: 'Juega con tus amigos',                    free: true,  prem: true },
  { txt: 'Los 5 campos de Monterrey',               free: true, prem: true },
  { txt: 'Todos los formatos de juego',             free: true, prem: true },
  { txt: 'Ranking en vivo',                         free: true, prem: true },
  { txt: 'Estadísticas de tu juego',                free: true, prem: true },
]

export default function PlanesPage() {
  const [planSel, setPlanSel] = useState('anual')

  function iniciarTrial() {
    // Lleva al registro (login). Mantiene el plan elegido por si se usa luego.
    window.location.href = `/registro?plan=${planSel}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0f', fontFamily: 'Georgia, serif', color: '#e8f5e9', paddingBottom: 40 }}>

      {/* Cerrar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{
          background: 'transparent', border: '1px solid #2ECC7144', color: '#81c784',
          width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontFamily: 'Georgia, serif',
        }}>✕</button>
      </div>

      {/* Encabezado */}
      <div style={{ padding: '8px 24px 20px' }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: '#81c784', textTransform: 'uppercase', marginBottom: 10 }}>
          Kriter Golf Club Premium
        </div>
        <div style={{ fontSize: 30, fontWeight: 'bold', lineHeight: 1.15 }}>
          Juega con confianza.
        </div>
        <div style={{ fontSize: 30, fontWeight: 'bold', color: '#2ECC71', fontStyle: 'italic', lineHeight: 1.15 }}>
          Prueba 30 días gratis
        </div>
      </div>

      {/* Tabla Free vs Premium */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ background: '#12241a', borderRadius: 16, border: '1px solid #2ECC7133', overflow: 'hidden' }}>
          {/* encabezado de columnas */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #2ECC7122' }}>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 'bold', color: '#2ECC71' }}>Qué incluye</div>
            <div style={{ width: 60, textAlign: 'center', fontSize: 12, color: '#81c784' }}>Free</div>
            <div style={{ width: 70, textAlign: 'center', fontSize: 12, color: '#0a1a0f', fontWeight: 'bold', background: '#2ECC71', borderRadius: 8, padding: '4px 0' }}>Premium</div>
          </div>
          {/* filas */}
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: i < FEATURES.length - 1 ? '1px solid #1d3324' : 'none' }}>
              <div style={{ flex: 1, fontSize: 14 }}>{f.txt}</div>
              <div style={{ width: 60, textAlign: 'center', color: f.free ? '#81c784' : '#2d4435', fontSize: 16, fontWeight: 'bold' }}>
                {f.free ? '✓' : '–'}
              </div>
              <div style={{ width: 70, textAlign: 'center', color: '#2ECC71', fontSize: 16, fontWeight: 'bold' }}>
                {f.prem ? '✓' : '–'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planes */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#81c784', textTransform: 'uppercase', marginBottom: 12 }}>
          Elige tu plan
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLANES.map(p => {
            const sel = planSel === p.id
            return (
              <div key={p.id} onClick={() => setPlanSel(p.id)} style={{
                position: 'relative',
                background: sel ? '#2ECC7118' : '#12241a',
                border: `2px solid ${sel ? '#2ECC71' : '#2ECC7133'}`,
                borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* radio */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? '#2ECC71' : '#4a7a50'}`,
                  background: sel ? '#2ECC71' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0a1a0f', fontSize: 13, fontWeight: 'bold',
                }}>{sel ? '✓' : ''}</div>
                {/* texto */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 'bold' }}>{p.label}</div>
                  {p.nota ? <div style={{ fontSize: 11, color: '#81c784' }}>{p.nota}</div> : null}
                  <div style={{ fontSize: 14, color: '#e8f5e9', marginTop: 2 }}>{p.precio}</div>
                </div>
                {/* etiqueta destacado */}
                {p.destacado && p.etiqueta && (
                  <div style={{
                    position: 'absolute', top: -10, right: 14,
                    background: '#F39C12', color: '#0a1a0f', fontSize: 10, fontWeight: 'bold',
                    padding: '3px 10px', borderRadius: 20, letterSpacing: 1,
                  }}>{p.etiqueta}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Botón Inicia Free Trial */}
      <div style={{ padding: '24px 20px 0' }}>
        <button onClick={iniciarTrial} style={{
          width: '100%', background: '#2ECC71', color: '#0a1a0f', border: 'none',
          borderRadius: 14, padding: '18px', cursor: 'pointer', fontFamily: 'Georgia, serif',
          fontSize: 18, fontWeight: 'bold', boxShadow: '0 10px 30px rgba(46,204,113,.3)',
        }}>
          Inicia Free Trial
        </button>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#81c784' }}>
          ✓ Sin tarjeta de crédito ni débito · Cancela cuando quieras
        </div>
      </div>

    </div>
  )
}