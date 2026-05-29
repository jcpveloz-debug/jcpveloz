'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2ECC71',
      fontFamily: 'Georgia, serif',
      fontSize: 18,
    }}>
      Cargando...
    </div>
  )
}