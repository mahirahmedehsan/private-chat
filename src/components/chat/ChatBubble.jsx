import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSmile, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckCircle, FiFile, FiLock, FiUnlock } from 'react-icons/fi'

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function ChatBubble({ message, isOwn, onReact, onEdit, onDelete, onViewImage }) {
  const [showReactions, setShowReactions] = useState(false)
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
    if (!trimmed || trimmed === message.text) { setEditing(false); return }
    onEdit?.(message._id, trimmed)
    setEditing(false)
  }

  const handleCancelEdit = () => { setEditing(false); setEditText(message.text) }

  const isEncrypted = message.isEncrypted && !message.isDecrypted
  const showEncryptedIcon = message.isEncrypted

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 relative message-group`}>
      <div className={`relative max-w-[75%] md:max-w-[65%]`}>
        {editing ? (
          <div className="bg-dark-200 border border-dark-400 rounded-lg p-2.5 shadow-md">
            <textarea ref={inputRef} value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="w-full bg-dark-300 text-text-primary text-sm rounded-md px-3 py-1.5 resize-none focus:outline-none" rows={2} />
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={handleCancelEdit} className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-dark-350 transition-all"><FiX className="h-4 w-4" /></button>
              <button onClick={handleSaveEdit} className="p-1 rounded bg-accent text-white hover:bg-accent-hover transition-all"><FiCheck className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <div className={`
            relative px-3.5 py-2 text-sm leading-relaxed break-words
            ${isOwn
              ? 'chat-bubble-own text-white rounded-lg rounded-br-sm'
              : 'bg-dark-250 text-text-primary rounded-lg rounded-bl-sm border border-dark-400/50'}
          `}>
            {showEncryptedIcon && (
              <div className={`flex items-center gap-1 mb-1 ${isEncrypted ? 'opacity-60' : 'opacity-40'}`}>
                {isEncrypted ? <FiLock className="h-3 w-3" /> : <FiUnlock className="h-3 w-3 text-green-400" />}
                <span className="text-[10px] font-medium">{isEncrypted ? 'Encrypted' : 'Decrypted'}</span>
              </div>
            )}
            {message.file && (
              <div className="mb-1.5">
                {(message.file.type || message.file.mimetype)?.startsWith('image/') ? (
                  <img src={message.file.url} alt={message.file.name}
                    onClick={() => onViewImage?.(message.file.url)}
                    className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                ) : (
                  <a href={message.file.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                    <FiFile className="h-4 w-4 shrink-0" /><span className="text-sm truncate">{message.file.name}</span>
                  </a>
                )}
              </div>
            )}
            {isEncrypted && !message.text ? (
              <p className="italic opacity-60 flex items-center gap-1.5"><FiLock className="h-3.5 w-3.5" /> Encrypted message</p>
            ) : message.text ? (
              <p className="whitespace-pre-wrap">{message.text}</p>
            ) : null}
            {message.isEdited && <span className="text-[10px] opacity-50 ml-1 italic">(edited)</span>}
            <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] opacity-50">
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
                    <FiCheckCircle className="h-3 w-3 text-white/50" />
                  ) : (
                    <FiCheckCircle className="h-3 w-3 opacity-30" />
                  )}
                </div>
              )}
            </div>
            {message.reactions?.length > 0 && (
              <div className={`flex gap-0.5 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {message.reactions.map((r, i) => (
                  <span key={i} className="text-sm bg-black/20 rounded-full px-1.5 py-0.5 border border-white/10">{r.emoji}</span>
                ))}
              </div>
            )}

            {/* Hover actions bar (Discord-style) */}
            <div className="message-actions">
              <button onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-dark-350 transition-colors" title="React">
                <FiSmile className="h-3.5 w-3.5" />
              </button>
              {isOwn && (
                <>
                  <button onClick={() => { setEditing(true) }}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-dark-350 transition-colors" title="Edit">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onDelete?.(message._id)}
                    className="p-1 rounded text-text-muted hover:text-danger hover:bg-dark-350 transition-colors" title="Delete">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showReactions && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className={`absolute -top-9 ${isOwn ? 'right-0' : 'left-0'} bg-dark-200 border border-dark-400 rounded-lg p-1 shadow-xl flex gap-0.5 z-20`}>
              {emojis.map((emoji) => (
                <button key={emoji} onClick={() => { onReact?.(message._id, emoji); setShowReactions(false) }}
                  className="p-1 rounded hover:bg-dark-350 text-lg transition-colors">{emoji}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
