import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import Avatar from '../ui/Avatar'

export default function ConversationItem({ conversation, isActive, onClick }) {
  const onlineUsers = useSelector((s) => s.chat.onlineUsers)
  const { user, lastMessage, unreadCount, status, lastActivity } = conversation
  const presence = onlineUsers[user?.uid]
  const liveStatus = presence?.status || status

  const timeAgo = (date) => {
    if (!date) return ''
    const now = new Date()
    const d = new Date(date)
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const previewText = (str, len = 50) =>
    str && str.length > len ? str.slice(0, len) + '...' : str

  const preview = lastMessage?.text
    ? previewText(lastMessage.text)
    : lastMessage?.file
      ? (lastMessage.file.type?.startsWith('image/') ? '📷 Image' : '📎 File')
      : 'No messages yet'

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left
        ${isActive ? 'bg-dark-200' : 'hover:bg-dark-150'}
      `}
    >
      <div className="shrink-0 relative">
        <Avatar src={user?.photoURL} name={user?.displayName} size="md" status={liveStatus} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold text-sm truncate ${isActive ? 'text-accent-light' : 'text-text-primary'}`}>
            {user?.displayName || 'Unknown'}
          </span>
          <span className="text-[11px] text-text-muted shrink-0">{timeAgo(lastMessage?.createdAt || lastActivity)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`text-sm truncate ${!lastMessage ? 'text-text-muted italic' : unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {lastMessage?.senderId === user?.uid && <span className="text-text-muted">You: </span>}
            {preview}
          </span>
          {unreadCount > 0 && (
            <span className="shrink-0 min-w-[20px] h-[20px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-lg shadow-accent/20">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
