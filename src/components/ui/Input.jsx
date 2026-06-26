import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FiAlertCircle } from 'react-icons/fi'

const Input = forwardRef(({ label, error, icon: Icon, className = '', value, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== undefined && value !== ''

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-xs font-medium mb-1.5 transition-colors duration-150 ${error ? 'text-danger' : focused ? 'text-accent-light' : 'text-text-muted'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 ${focused ? 'text-accent-light' : 'text-text-muted'}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          value={value}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          className={`
            w-full rounded-xl bg-dark-350/80 border
            text-text-primary placeholder-text-muted
            px-4 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:border-accent/50
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : focused
                ? 'border-accent/50 ring-2 ring-accent/20'
                : 'border-border-light'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-danger flex items-center gap-1"
        >
          <FiAlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
