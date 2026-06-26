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

  const truncate = (str, len = 60) =>
    str && str.length > len ? str.slice(0, len) + '...' : str

  const previewText = lastMessage?.text
    ? truncate(lastMessage.text)
    : (lastMessage?.file
        ? (lastMessage.file.type?.startsWith('image/') ? '📷 Image' : '📎 PDF')
        : 'No messages yet')

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 text-left
        ${isActive
          ? 'bg-dark-300/70 border-l-[3px] border-accent'
          : 'bg-transparent border-l-[3px] border-transparent hover:bg-dark-250/50'
        }
      `}
    >
      <div className="shrink-0">
        <Avatar src={user?.photoURL} name={user?.displayName} size="md" status={liveStatus} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold text-sm truncate ${isActive ? 'text-accent-light' : 'text-text-primary'}`}>
            {user?.displayName || 'Unknown'}
          </span>
          <span className="text-[11px] text-text-muted shrink-0 font-mono">
            {timeAgo(lastActivity || lastMessage?.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            {lastMessage?.senderId === user?.uid && (
              <span className="text-[9px] text-text-muted shrink-0 font-medium">You: </span>
            )}
            <span
              className={`text-sm truncate ${!lastMessage ? 'text-text-muted italic' : unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
            >
              {previewText}
            </span>
          </div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="shrink-0 min-w-[22px] h-[22px] rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center px-1.5 shadow-lg shadow-accent/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
