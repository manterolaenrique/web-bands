import React from 'react'

const Logo = ({ size = 'medium', color = '#fff', showText = true }) => {
  const sizes = {
    small: { width: '32px', height: '32px', fontSize: '1rem' },
    medium: { width: '48px', height: '48px', fontSize: '1.5rem' },
    large: { width: '64px', height: '64px', fontSize: '2rem' },
    xlarge: { width: '80px', height: '80px', fontSize: '2.5rem' }
  }

  const currentSize = sizes[size]

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
      }}
      onClick={() => window.location.href = '/'}
    >
      {/* Icono del logo */}
      <div 
        style={{
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${color}`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
          e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        <span 
          style={{
            fontSize: currentSize.fontSize,
            color: color,
            fontWeight: 'bold',
          }}
        >
          🎵
        </span>
      </div>
      
      {/* Texto del logo */}
      {showText && (
        <span 
          style={{
            fontSize: currentSize.fontSize,
            fontWeight: 'bold',
            color: color,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Web Bands
        </span>
      )}
    </div>
  )
}

export default Logo 