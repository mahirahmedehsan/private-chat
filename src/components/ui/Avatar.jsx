import { useState } from 'react'

export default function Avatar({ src, name, size = 'md', status, className = '' }) {
  const [error, setError] = useState(false)

  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
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
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src && !error ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          loading="lazy"
          onError={() => setError(true)}
          className={`${sizeMap[size]} rounded-full object-cover bg-dark-500`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-accent/20 flex items-center justify-center font-semibold text-accent-light`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full
            ${statusSizeMap[size]}
            ${status === 'online'
              ? 'bg-success status-online'
              : status === 'away'
                ? 'bg-warning'
                : 'bg-dark-600'
            }
            ${status === 'online' ? '' : 'border-dark-300'}
          `}
        />
      )}
    </div>
  )
}
