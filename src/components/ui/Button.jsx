import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover shadow-lg shadow-accent/15',
  secondary: 'bg-dark-300 text-text-primary hover:bg-dark-400 border border-border-light',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-dark-300',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-lg shadow-danger/20',
  success: 'bg-success text-white hover:bg-green-600 shadow-lg shadow-success/20',
  gradient: 'bg-gradient-to-r from-accent to-blue-500 text-white shadow-lg shadow-accent/20 hover:shadow-accent/40',
  outline: 'bg-transparent text-accent-light border border-accent/30 hover:bg-accent-bg',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-7 py-2.5 text-base',
  xl: 'px-9 py-3 text-base',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children && <span className="truncate">{children}</span>}
    </motion.button>
  )
}
