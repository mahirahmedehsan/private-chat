import { useState, useRef, useEffect } from 'react'
import { FiSend, FiPaperclip, FiSmile, FiFile, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadFile } from '../../api/messages'
import { useSound } from '../../hooks/useSound'

const emojis = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '🥰', '😘', '😜', '🤗', '🤔', '😐', '😑',
  '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫',
  '😴', '😤', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
  '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '🤲', '🤝',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💖', '✨',
  '🔥', '⭐', '🌊', '🌈', '☀️', '🌙', '🌸', '🌺', '🍕', '🍔',
  '🎉', '🎊', '🎈', '🎁', '🏆', '💯', '✅', '❌', '❗', '❓',
]

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const sound = useSound()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const typingTimeout = useRef(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const insertEmoji = (emoji) => {
    const el = inputRef.current
    if (!el) {
      setText((prev) => prev + emoji)
      return
    }
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    const newText = text.slice(0, start) + emoji + text.slice(end)
    setText(newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) {
      alert('Only images and PDFs are allowed')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB')
      return
    }
    setFile(f)
    e.target.value = ''
  }

  const handleChange = (e) => {
    setText(e.target.value)
    if (onTyping) {
      onTyping(true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => onTyping(false), 2000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && !file) || disabled || uploading) return
    let fileData = null
    if (file) {
      setUploading(true)
      try {
        fileData = await uploadFile(file)
      } catch {
        setUploading(false)
        return
      }
      setUploading(false)
    }
    onSend?.({ text: trimmed, file: fileData })
    sound.playMessageSent()
    setText('')
    setFile(null)
    if (onTyping) onTyping(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-1 relative">
      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-4 right-4 mb-2 bg-dark-200/95 backdrop-blur-md border border-border-light rounded-2xl p-3 shadow-2xl z-20"
          >
            <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-400/60 text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {file && (
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-350/80 backdrop-blur-sm border border-border-light rounded-t-2xl border-b-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {file.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0 border border-border-light" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <FiFile className="h-5 w-5 text-accent" />
              </div>
            )}
            <span className="text-xs text-text-primary truncate">{file.name}</span>
          </div>
          <button type="button" onClick={() => setFile(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400/60 transition-all shrink-0">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 bg-dark-350/80 backdrop-blur-sm border border-border-light rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/50 transition-all duration-150 shadow-sm">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400/60 transition-all shrink-0"
        >
          <FiPaperclip className="h-[18px] w-[18px] rotate-45" />
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`p-1.5 rounded-lg transition-all shrink-0 ${showPicker ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-dark-400/60'}`}
        >
          <FiSmile className="h-[18px] w-[18px]" />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted resize-none text-sm py-1.5 max-h-[120px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !file) || disabled || uploading}
          className="p-2 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
        >
          {uploading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiSend className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  )
}
