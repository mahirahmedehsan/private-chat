import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FiSmile, FiMessageCircle, FiSend, FiTrash2, FiGlobe, FiLock,
  FiImage, FiX, FiCamera, FiChevronDown, FiHeart, FiMoreHorizontal,
} from 'react-icons/fi'
import { getFeed, createNote, deleteNote, toggleReaction, addComment, toggleCommentReaction, deleteComment } from '../../api/notes'
import { uploadFile } from '../../api/upload'
import { getSocket } from '../../config/socket'
import { backupToDrive } from '../../utils/backupToDrive'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { NoteSkeleton } from '../../components/ui/Skeleton'

const noteEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function EmojiPicker({ emojis, myReactions, onSelect, align = 'left' }) {
  return (
    <motion.div
      data-picker
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      className={`absolute bottom-full mb-2 z-20 bg-dark-150 border border-border-light rounded-2xl shadow-2xl p-1.5 flex gap-0.5 ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-all hover:scale-110 ${
            myReactions?.includes(emoji) ? 'bg-accent-bg scale-110' : 'hover:bg-dark-250'
          }`}
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  )
}

function PostCard({ note, currentUserId, onReact, onComment, onDelete, onDeleteComment, onCommentReact }) {
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showNotePicker, setShowNotePicker] = useState(false)
  const [showCommentPicker, setShowCommentPicker] = useState(null)
  const [imageViewer, setImageViewer] = useState(null)
  const isAuthor = note.author?.uid === currentUserId

  const handleReact = (emoji) => {
    onReact(note._id, emoji)
    setShowNotePicker(false)
  }

  const handleCommentReact = (commentId, emoji) => {
    onCommentReact(note._id, commentId, emoji)
    setShowCommentPicker(null)
  }

  const handleSubmitComment = () => {
    const text = commentText.trim()
    if (!text) return
    onComment(note._id, text)
    setCommentText('')
  }

  const allImages = note.images || []
  const hasImages = allImages.length > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="bg-dark-150 border border-border rounded-2xl overflow-hidden hover:border-border-light transition-colors card-shadow">

        <div className="flex items-start gap-3 px-4 pt-4">
          <button type="button" onClick={() => navigate(`/profile/${note.author?.uid}`)} className="shrink-0">
            <Avatar src={note.author?.photoURL} name={note.author?.displayName} size="md" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/profile/${note.author?.uid}`)}
                className="text-sm font-semibold text-text-primary hover:text-accent-light transition-colors"
              >
                {note.author?.displayName || 'Unknown'}
              </button>
              {note.author?.uid === currentUserId && (
                <span className="text-[10px] font-medium text-text-muted bg-dark-350 px-1.5 py-0.5 rounded-md">You</span>
              )}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                note.visibility === 'public' ? 'bg-accent-bg text-accent-light' : 'bg-dark-350 text-text-muted'
              }`}>
                {note.visibility === 'public' ? <FiGlobe className="h-2.5 w-2.5" /> : <FiLock className="h-2.5 w-2.5" />}
                {note.visibility}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{formatTime(note.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAuthor && (
              <button
                onClick={() => onDelete(note._id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-bg transition-all opacity-0 group-hover:opacity-100"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pt-3 pb-2">
          {note.content && (
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{note.content}</p>
          )}
        </div>

        {hasImages && (
          <div className={`px-4 pb-3 ${allImages.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
            {allImages.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImageViewer(url)}
                className={`w-full text-left overflow-hidden rounded-xl ${allImages.length === 1 ? 'max-h-96' : 'max-h-64'}`}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover rounded-xl border border-border-light hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}

        {(note.reactions || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {(note.reactions || []).map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all ${
                  r.reactedByMe
                    ? 'bg-accent-bg border-accent/30 text-accent-light'
                    : 'bg-dark-250/50 border-border-light text-text-muted hover:border-dark-400 hover:text-text-primary'
                }`}
              >
                <span className="text-sm">{r.emoji}</span>
                <span className="font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 px-4 pb-1 border-t border-border pt-2">
          <div className="relative">
            <button
              onClick={() => setShowNotePicker(!showNotePicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showNotePicker ? 'bg-accent-bg text-accent-light' : 'text-text-muted hover:text-text-primary hover:bg-dark-250'
              }`}
            >
              <FiSmile className="h-4 w-4" />
              {note.reactionCount > 0 && <span>{note.reactionCount}</span>}
            </button>
            <AnimatePresence>
              {showNotePicker && (
                <EmojiPicker
                  emojis={noteEmojis}
                  myReactions={note.myReactions}
                  onSelect={handleReact}
                />
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showComments ? 'bg-accent-bg text-accent-light' : 'text-text-muted hover:text-text-primary hover:bg-dark-250'
            }`}
          >
            <FiMessageCircle className="h-4 w-4" />
            <span>{note.commentCount || 0}</span>
          </button>

          <div className="flex-1" />

          <span className="text-[10px] text-text-muted">
            {formatTime(note.createdAt)}
          </span>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border"
            >
              <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
                {(note.comments || []).length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-2">No comments yet</p>
                ) : (
                  (note.comments || []).map((comment) => {
                    const cId = comment._id || comment.id
                    const isCommentAuthor = comment.author?.uid === currentUserId
                    return (
                      <div key={cId} className="flex items-start gap-2.5 group">
                        <button type="button" onClick={() => navigate(`/profile/${comment.author?.uid}`)} className="shrink-0 mt-0.5">
                          <Avatar src={comment.author?.photoURL} name={comment.author?.displayName} size="xs" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="bg-dark-250/60 rounded-2xl px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/profile/${comment.author?.uid}`)}
                                className="text-xs font-semibold text-text-primary hover:text-accent-light transition-colors"
                              >
                                {comment.author?.displayName || 'Unknown'}
                              </button>
                              <span className="text-[10px] text-text-muted">{formatTime(comment.createdAt)}</span>
                              {isCommentAuthor && (
                                <span className="text-[10px] text-text-muted bg-dark-350 px-1 rounded">You</span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{comment.content}</p>

                            {(comment.reactions || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(comment.reactions || []).map((r) => (
                                  <button
                                    key={r.emoji}
                                    onClick={() => handleCommentReact(cId, r.emoji)}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
                                      r.reactedByMe
                                        ? 'bg-accent-bg border-accent/30 text-accent-light'
                                        : 'bg-dark-350/50 border-border-light text-text-muted'
                                    }`}
                                  >
                                    {r.emoji}{r.count > 1 && <span className="font-medium">{r.count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 ml-1">
                            <div className="relative">
                              <button
                                onClick={() => setShowCommentPicker(showCommentPicker === cId ? null : cId)}
                                className="text-[10px] text-text-muted hover:text-text-primary transition-colors"
                              >
                                React
                              </button>
                              <AnimatePresence>
                                {showCommentPicker === cId && (
                                  <EmojiPicker
                                    emojis={noteEmojis}
                                    myReactions={comment.myReactions}
                                    onSelect={(emoji) => handleCommentReact(cId, emoji)}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            {(isCommentAuthor || isAuthor) && (
                              <button
                                onClick={() => onDeleteComment(note._id, cId)}
                                className="text-[10px] text-text-muted hover:text-danger transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-4 pb-4 pt-1">
                <div className="flex items-center gap-2 bg-dark-250/60 border border-border-light rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/50 transition-all">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none py-1"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    className="p-1 rounded-lg text-accent disabled:text-dark-600 disabled:cursor-not-allowed hover:text-accent-light transition-colors"
                  >
                    <FiSend className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {imageViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setImageViewer(null)}
          >
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
            <button
              onClick={() => setImageViewer(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <FiX className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              src={imageViewer}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Feed() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const queryClient = useQueryClient()
  const [newContent, setNewContent] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [notes, setNotes] = useState([])
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [newImages, setNewImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewUrlsRef = useRef([])
  const textareaRef = useRef(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => getFeed({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
  })

  useEffect(() => {
    if (data) {
      const all = data.pages.flatMap((p) => p.notes || [])
      setNotes(all)
    }
  }, [data])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNew = (note) => setNotes((prev) => [note, ...prev])
    const handleDelete = ({ id }) => setNotes((prev) => prev.filter((n) => n._id !== id))
    const handleReaction = ({ id, reactions, myReactions, reactionCount }) =>
      setNotes((prev) => prev.map((n) => n._id === id ? { ...n, reactions, myReactions, reactionCount } : n))
    const handleComment = ({ noteId, comment }) =>
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, comments: [...(n.comments || []), comment], commentCount: (n.commentCount || 0) + 1 } : n))
    const handleCommentReaction = ({ noteId, commentId, reactions, myReactions }) =>
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, comments: n.comments.map((c) => (c._id || c.id) === commentId ? { ...c, reactions, myReactions } : c) } : n))
    const handleDeleteComment = ({ noteId, commentId }) =>
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, comments: n.comments.filter((c) => (c._id || c.id) !== commentId), commentCount: Math.max(0, (n.commentCount || 0) - 1) } : n))

    socket.on('note:new', handleNew)
    socket.on('note:delete', handleDelete)
    socket.on('note:reaction', handleReaction)
    socket.on('note:comment', handleComment)
    socket.on('note:comment-reaction', handleCommentReaction)
    socket.on('note:delete-comment', handleDeleteComment)
    return () => {
      socket.off('note:new', handleNew)
      socket.off('note:delete', handleDelete)
      socket.off('note:reaction', handleReaction)
      socket.off('note:comment', handleComment)
      socket.off('note:comment-reaction', handleCommentReaction)
      socket.off('note:delete-comment', handleDeleteComment)
    }
  }, [])

  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (!showNotePicker && !showCommentPicker) return
    const handleClick = (e) => {
      if (!e.target.closest('[data-picker]') && !e.target.closest('[data-picker-trigger]')) {
        setShowNotePicker(null)
        setShowCommentPicker(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  })

  const [showNotePicker, setShowNotePicker] = useState(null)
  const [showCommentPicker, setShowCommentPicker] = useState(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => { setShowNotePicker(null); setShowCommentPicker(null) }
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const createMutation = useMutation({
    mutationFn: ({ images } = {}) => createNote({ content: newContent.trim(), visibility, images }),
    onSuccess: (data) => {
      setNewContent('')
      setNewImages([])
      setVisibility('public')
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      if (data?.note) backupToDrive('note', data.note)
    },
  })

  const reactionMutation = useMutation({
    mutationFn: ({ id, emoji }) => toggleReaction(id, emoji),
    onMutate: async ({ id, emoji }) => {
      const prev = notes
      setNotes((prevNotes) => prevNotes.map((n) => {
        if (n._id !== id) return n
        const myReactions = n.myReactions || []
        const isReacted = myReactions.includes(emoji)
        const newMyReactions = isReacted ? myReactions.filter((e) => e !== emoji) : [...myReactions, emoji]
        const newReactions = [...(n.reactions || [])]
        const idx = newReactions.findIndex((r) => r.emoji === emoji)
        if (isReacted) {
          if (idx !== -1) {
            const updated = { ...newReactions[idx], count: newReactions[idx].count - 1, reactedByMe: false }
            if (updated.count <= 0) newReactions.splice(idx, 1)
            else newReactions[idx] = updated
          }
        } else {
          if (idx !== -1) {
            newReactions[idx] = { ...newReactions[idx], count: newReactions[idx].count + 1, reactedByMe: true }
          } else {
            newReactions.push({ emoji, count: 1, reactedByMe: true })
          }
        }
        const newReactionCount = newReactions.reduce((s, r) => s + r, 0)
        return { ...n, reactions: newReactions, myReactions: newMyReactions, reactionCount: newReactionCount }
      }))
      return prev
    },
    onSuccess: ({ id, reactions, myReactions, reactionCount }) => {
      setNotes((prev) => prev.map((n) => n._id === id ? { ...n, reactions, myReactions, reactionCount } : n))
    },
    onError: (_err, _vars, prev) => { if (prev) setNotes(prev) },
  })

  const commentMutation = useMutation({
    mutationFn: ({ noteId, content }) => addComment(noteId, content),
    onSuccess: ({ noteId, comment }) => {
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, comments: [...(n.comments || []), comment], commentCount: (n.commentCount || 0) + 1 } : n))
      if (comment) backupToDrive('comment', comment)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteNote })
  const deleteCommentMutation = useMutation({ mutationFn: ({ noteId, commentId }) => deleteComment(noteId, commentId) })
  const commentReactionMutation = useMutation({
    mutationFn: ({ noteId, commentId, emoji }) => toggleCommentReaction(noteId, commentId, emoji),
    onMutate: async ({ noteId, commentId, emoji }) => {
      setNotes((prevNotes) => prevNotes.map((n) => {
        if (n._id !== noteId) return n
        return {
          ...n,
          comments: n.comments.map((c) => {
            const cId = c._id || c.id
            if (cId !== commentId) return c
            const myReactions = c.myReactions || []
            const isReacted = myReactions.includes(emoji)
            const newMyReactions = isReacted ? myReactions.filter((e) => e !== emoji) : [...myReactions, emoji]
            const newReactions = [...(c.reactions || [])]
            const idx = newReactions.findIndex((r) => r.emoji === emoji)
            if (isReacted) {
              if (idx !== -1) {
                const updated = { ...newReactions[idx], count: newReactions[idx].count - 1, reactedByMe: false }
                if (updated.count <= 0) newReactions.splice(idx, 1)
                else newReactions[idx] = updated
              }
            } else {
              if (idx !== -1) {
                newReactions[idx] = { ...newReactions[idx], count: newReactions[idx].count + 1, reactedByMe: true }
              } else {
                newReactions.push({ emoji, count: 1, reactedByMe: true })
              }
            }
            return { ...c, reactions: newReactions, myReactions: newMyReactions }
          }),
        }
      }))
    },
    onSuccess: ({ noteId, commentId, reactions, myReactions }) => {
      setNotes((prev) => prev.map((n) => n._id === noteId ? { ...n, comments: n.comments.map((c) => (c._id || c.id) === commentId ? { ...c, reactions, myReactions } : c) } : n))
    },
  })

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const entries = files.map((file) => {
      const preview = URL.createObjectURL(file)
      previewUrlsRef.current.push(preview)
      return { file, preview }
    })
    setNewImages((prev) => [...prev, ...entries])
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setNewImages((prev) => {
      const removed = prev[idx]
      if (removed) {
        const i = previewUrlsRef.current.indexOf(removed.preview)
        if (i > -1) previewUrlsRef.current.splice(i, 1)
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!newContent.trim() && newImages.length === 0) || createMutation.isPending) return

    let images = []
    if (newImages.length > 0) {
      setUploading(true)
      try {
        const uploads = await Promise.all(newImages.map((img) => uploadFile(img.file)))
        images = uploads.map((u) => u.url)
      } catch { setUploading(false); return }
      setUploading(false)
    }

    createMutation.mutate({ images })
  }

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
    if (el.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const [focused, setFocused] = useState(false)

  return (
    <>
      <TopBar title="Feed" />
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-dark-150 border rounded-2xl overflow-hidden card-shadow transition-all duration-200 ${
              focused ? 'border-accent/40 ring-2 ring-accent/10' : 'border-border'
            }`}
          >
            <div className="flex items-start gap-3 p-4 pb-0">
              <Avatar src={user?.photoURL} name={user?.displayName} size="md" />
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="What's on your mind?"
                  rows={focused ? 3 : 1}
                  className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none py-2 leading-relaxed transition-all"
                />
              </div>
            </div>

            <AnimatePresence>
              {newImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4"
                >
                  <div className="flex flex-wrap gap-2 pb-3">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-border-light" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVisibility(visibility === 'public' ? 'friends' : 'public')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    visibility === 'public' ? 'bg-accent-bg text-accent-light' : 'bg-dark-250 text-text-muted'
                  }`}
                >
                  {visibility === 'public' ? <FiGlobe className="h-3.5 w-3.5" /> : <FiLock className="h-3.5 w-3.5" />}
                  {visibility === 'public' ? 'Public' : 'Friends'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-light hover:bg-accent-bg transition-all"
                >
                  <FiImage className="h-3.5 w-3.5" />
                  Photo
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={(!newContent.trim() && newImages.length === 0) || createMutation.isPending || uploading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {createMutation.isPending || uploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="h-3.5 w-3.5" />
                )}
                Post
              </button>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4 pt-2">
              {Array.from({ length: 3 }).map((_, i) => <NoteSkeleton key={i} />)}
            </div>
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent border border-border-light flex items-center justify-center mb-5">
                <FiCamera className="h-8 w-8 text-accent-light" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">No posts yet</h3>
              <p className="text-sm text-text-muted mt-1.5 max-w-xs text-center">Share your thoughts with friends — write something above to get started!</p>
            </motion.div>
          ) : (
            <div className="space-y-4 pt-2">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <PostCard
                    key={note._id}
                    note={note}
                    currentUserId={user?.uid}
                    onReact={(id, emoji) => reactionMutation.mutate({ id, emoji })}
                    onComment={(noteId, content) => commentMutation.mutate({ noteId, content })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onDeleteComment={(noteId, commentId) => deleteCommentMutation.mutate({ noteId, commentId })}
                    onCommentReact={(noteId, commentId, emoji) => commentReactionMutation.mutate({ noteId, commentId, emoji })}
                  />
                ))}
              </AnimatePresence>

              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!hasNextPage && notes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-bg flex items-center justify-center mb-3 glow-accent">
                    <FiHeart className="h-5 w-5 text-accent-light" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">You're all caught up!</p>
                  <p className="text-xs text-text-muted mt-1">Check back later for new posts</p>
                </motion.div>
              )}
            </div>
          )}

          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-20 right-6 z-30 w-10 h-10 rounded-xl bg-accent text-white shadow-lg shadow-accent/20 flex items-center justify-center hover:bg-accent-hover transition-all"
              >
                <FiChevronDown className="h-5 w-5 rotate-180" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
