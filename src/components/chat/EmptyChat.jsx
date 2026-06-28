import { motion } from 'framer-motion'
import { FiMessageSquare } from 'react-icons/fi'

export default function EmptyChat({ title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-border-light flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/5">
          <FiMessageSquare className="h-10 w-10 text-accent-light" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title || 'No messages yet'}
        </h3>
        <p className="text-text-secondary text-sm max-w-sm mx-auto">
          {subtitle || 'Select a conversation or start a new one to begin chatting.'}
        </p>
      </div>
    </motion.div>
  )
}
