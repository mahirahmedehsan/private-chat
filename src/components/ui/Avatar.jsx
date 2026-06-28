import { useState } from 'react'

export default function Avatar({ src, name, size = 'md', status, className = '' }) {
  const [error, setError] = useState(false)

  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-4xl',
  }

  const statusSizeMap = {
    xs: 'w-2 h-2 border',
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src && !error ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          loading="lazy"
          onError={() => setError(true)}
          className={`${sizeMap[size]} rounded-full object-cover bg-dark-500 ring-2 ring-dark-300/60`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-accent/40 to-accent/5 flex items-center justify-center font-semibold text-accent-light ring-2 ring-dark-300/60`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full ring-2 ring-dark-200
            ${statusSizeMap[size]}
            ${status === 'online'
              ? 'bg-success shadow-sm shadow-success/40'
              : status === 'away'
                ? 'bg-warning'
                : 'bg-dark-600'
            }
          `}
        />
      )}
    </div>
  )
}
