import { FiMessageSquare } from 'react-icons/fi'

export default function EmptyChat({ title, subtitle }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-dark-250/60 border border-border-light flex items-center justify-center mx-auto mb-5">
          <FiMessageSquare className="h-10 w-10 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {title || 'No messages yet'}
        </h3>
        <p className="text-text-secondary text-sm max-w-sm">
          {subtitle || 'Select a conversation or start a new one to begin chatting.'}
        </p>
      </div>
    </div>
  )
}
