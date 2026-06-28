import { motion } from 'framer-motion'

export default function TypingIndicator({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 px-4 py-2 text-sm"
    >
      <div className="flex gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-accent" />
        <span className="typing-dot w-2 h-2 rounded-full bg-accent" />
        <span className="typing-dot w-2 h-2 rounded-full bg-accent" />
      </div>
      <span className="text-xs text-text-muted">{name || 'Someone'} is typing...</span>
    </motion.div>
  )
}
