import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCheck, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import { removeToast } from '../../store/slices/uiSlice'
import { useEffect, useState, useRef } from 'react'

const icons = {
  success: FiCheck,
  error: FiAlertTriangle,
  warning: FiAlertTriangle,
  info: FiInfo,
}

const config = {
  success: { border: 'border-success/25', bg: 'bg-success/10', iconColor: 'text-success', bar: 'bg-success' },
  error: { border: 'border-danger/25', bg: 'bg-danger/10', iconColor: 'text-danger', bar: 'bg-danger' },
  warning: { border: 'border-warning/25', bg: 'bg-warning/10', iconColor: 'text-warning', bar: 'bg-warning' },
  info: { border: 'border-accent/25', bg: 'bg-accent/10', iconColor: 'text-accent-light', bar: 'bg-accent' },
}

export default function Toast() {
  const { toasts } = useSelector((s) => s.ui)
  const dispatch = useDispatch()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || FiInfo
          return (
            <ToastItem key={toast.id} toast={toast} Icon={Icon} onDismiss={() => dispatch(removeToast(toast.id))} />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, Icon, onDismiss }) {
  const duration = toast.duration || 4000
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const remainingRef = useRef(duration)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!paused) {
      startRef.current = Date.now()
      timerRef.current = setTimeout(onDismiss, remainingRef.current)
    } else {
      clearTimeout(timerRef.current)
      remainingRef.current -= Date.now() - startRef.current
    }
    return () => clearTimeout(timerRef.current)
  }, [paused])

  const c = config[toast.type] || config.info

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="alert"
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 rounded-xl border bg-dark-200 border-dark-400 shadow-xl`}
    >
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${c.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-sm text-text-primary">{toast.title}</p>}
        {toast.message && <p className="text-sm text-text-secondary mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350 transition-colors"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${c.bar}/40 progress-bar`}
        style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
      />
    </motion.div>
  )
}
