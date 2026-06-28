export default function Badge({ count, variant = 'primary', size = 'sm', className = '' }) {
  if (!count && count !== 0) return null
  if (count === 0) return null

  const variantMap = {
    primary: 'bg-accent text-white',
    danger: 'bg-gradient-to-r from-danger to-red-500 text-white',
    warning: 'bg-warning text-black',
    success: 'bg-success text-white',
    muted: 'bg-dark-600 text-text-secondary',
  }

  const sizeMap = {
    xs: 'min-w-[14px] h-[14px] text-[9px] px-0.5',
    sm: 'min-w-[18px] h-[18px] text-[11px] px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-semibold
        shadow-lg ${variant === 'danger' ? 'shadow-danger/20' : 'shadow-accent/15'}
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
