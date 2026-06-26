export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-text-muted">
      <div className="flex gap-0.5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
      </div>
      <span>{name} is typing...</span>
    </div>
  )
}
