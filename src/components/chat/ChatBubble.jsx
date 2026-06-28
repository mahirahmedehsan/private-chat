import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSmile, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckCircle, FiFile, FiLock, FiUnlock } from 'react-icons/fi'

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function ChatBubble({ message, isOwn, onReact, onEdit, onDelete }) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setEditText(message.text)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editing])

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === message.text) {
      setEditing(false)
      return
    }
    onEdit?.(message._id, trimmed)
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText(message.text)
  }

  const isEncrypted = message.isEncrypted && !message.isDecrypted
  const showEncryptedIcon = message.isEncrypted

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5 group`}>
      <div className={`relative max-w-[78%] md:max-w-[68%] ${isOwn ? 'order-1' : 'order-1'}`}>
        {editing ? (
          <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-500/80 rounded-2xl p-3 shadow-lg">
            <textarea
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="w-full bg-dark-400/80 text-text-primary text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button onClick={handleCancelEdit} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400/60 transition-all">
                <FiX className="h-4 w-4" />
              </button>
              <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-all shadow-sm">
                <FiCheck className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`
              relative px-4 py-2.5 text-sm leading-relaxed break-words
              ${isOwn
                ? 'chat-bubble-own text-white rounded-[20px] rounded-br-[6px] shadow-md shadow-accent/20'
                : 'chat-bubble-other text-text-primary rounded-[20px] rounded-bl-[6px] border border-border-light shadow-sm'
              }
            `}
          >
            {showEncryptedIcon && (
              <div className={`flex items-center gap-1 mb-1.5 ${isEncrypted ? 'opacity-60' : 'opacity-40'}`}>
                {isEncrypted ? (
                  <FiLock className="h-3 w-3" />
                ) : (
                  <FiUnlock className="h-3 w-3 text-green-400" />
                )}
                <span className="text-[10px] font-medium">
                  {isEncrypted ? 'Encrypted' : 'Decrypted'}
                </span>
              </div>
            )}

            {message.file && (
              <div className="mb-2">
                {(message.file.type || message.file.mimetype)?.startsWith('image/') ? (
                  <img
                    src={message.file.url}
                    alt={message.file.name}
                    className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                ) : (
                  <a
                    href={message.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <FiFile className="h-5 w-5 shrink-0" />
                    <span className="text-sm truncate">{message.file.name}</span>
                  </a>
                )}
              </div>
            )}

            {isEncrypted && !message.text ? (
              <p className="italic opacity-60 flex items-center gap-1.5">
                <FiLock className="h-3.5 w-3.5" /> This message is encrypted
              </p>
            ) : (
              message.text && <p className="whitespace-pre-wrap">{message.text}</p>
            )}

            {message.isEdited && (
              <span className="text-[10px] opacity-50 ml-1 italic">edited</span>
            )}

            <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] opacity-60">
                {new Date(message.createdAt || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isOwn && (
                <div className="flex items-center">
                  {message.read ? (
                    <div className="flex -space-x-1">
                      <FiCheckCircle className="h-3 w-3 text-accent-light" />
                      <FiCheckCircle className="h-3 w-3 text-accent-light -ml-1.5" />
                    </div>
                  ) : message.delivered ? (
                    <FiCheckCircle className="h-3 w-3 text-white/60" />
                  ) : (
                    <FiCheckCircle className="h-3 w-3 opacity-40" />
                  )}
                </div>
              )}
            </div>

            {message.reactions?.length > 0 && (
              <div className={`flex gap-0.5 mt-1.5 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {message.reactions.map((r, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="text-sm bg-black/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-white/10"
                  >
                    {r.emoji}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        )}

        {!editing && (
          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-[calc(100%+6px)]' : 'right-0 translate-x-[calc(100%+6px)]'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
            <div className="relative flex gap-0.5">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 rounded-full bg-dark-350/90 backdrop-blur-sm text-text-muted hover:text-text-primary hover:bg-dark-400 transition-all shadow-sm"
                aria-label="Add reaction"
              >
                <FiSmile className="h-3.5 w-3.5" />
              </button>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`absolute bottom-full mb-2 ${isOwn ? 'left-0' : 'right-0'} bg-dark-250/95 backdrop-blur-md border border-border-light rounded-xl p-1.5 shadow-xl flex gap-0.5 whitespace-nowrap`}
                >
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { onReact?.(message._id, emoji); setShowReactions(false) }}
                      className="p-1.5 rounded-lg hover:bg-dark-400 text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
              {isOwn && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-full bg-dark-350/90 backdrop-blur-sm text-text-muted hover:text-text-primary hover:bg-dark-400 transition-all shadow-sm"
                    aria-label="Message options"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-8 left-0 bg-dark-250/95 backdrop-blur-md border border-border-light rounded-xl py-1 shadow-xl min-w-[120px]"
                    >
                      <button
                        onClick={() => { setEditing(true); setShowMenu(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-dark-400/60 transition-colors"
                      >
                        <FiEdit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => { onDelete?.(message._id); setShowMenu(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-dark-400/60 transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4" /> Delete
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
