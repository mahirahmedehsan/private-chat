import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiSearch, FiSend, FiMessageSquare, FiUser, FiArrowLeft, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAdminNotes, adminSendMessage, getConversationMessages, adminDeleteMessage } from '../../api/admin'
import { searchUsers } from '../../api/users'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { addToast } from '../../store/slices/uiSlice'
import { useDispatch, useSelector } from 'react-redux'

export default function AdminChat() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((s) => s.auth.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [msgPage, setMsgPage] = useState(1)
  const [hasMoreMsgs, setHasMoreMsgs] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const conversationId = selectedUser ? [user?.uid, selectedUser.uid].sort().join(':') : null

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQuery)
        setSearchResults(data.users || [])
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!conversationId) return
    setMsgPage(1)
    setMessages([])
    loadMessages(1)
  }, [conversationId])

  const loadMessages = async (page) => {
    if (!conversationId) return
    try {
      const data = await getConversationMessages(conversationId, { page, limit: 50 })
      setMessages((prev) => page === 1 ? (data.messages || []).reverse() : [...(data.messages || []).reverse(), ...prev])
      setHasMoreMsgs(data.hasMore || data.totalPages > page)
    } catch {}
  }

  const handleLoadMore = async () => {
    const next = msgPage + 1
    setMsgPage(next)
    await loadMessages(next)
  }

  const sendMutation = useMutation({
    mutationFn: ({ recipientId, text }) => adminSendMessage(recipientId, text),
    onSuccess: (data) => {
      setText('')
      setMessages((prev) => [...prev, data.message])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      dispatch(addToast({ type: 'success', title: 'Message sent' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to send message' })),
  })

  const deleteMsgMutation = useMutation({
    mutationFn: adminDeleteMessage,
    onSuccess: (_, id) => {
      setMessages((prev) => prev.filter((m) => m._id !== id))
      dispatch(addToast({ type: 'success', title: 'Message deleted' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to delete message' })),
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() || !selectedUser) return
    sendMutation.mutate({ recipientId: selectedUser.uid, text: text.trim() })
  }

  return (
    <>
      <TopBar title="Admin Chat" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 min-w-[200px] border-r border-border flex flex-col overflow-hidden hide-mobile">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-dark-350/80 border border-border-light rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    selectedUser?.uid === u.uid ? 'bg-accent-bg border border-accent/20' : 'hover:bg-dark-350/60 border border-transparent'
                  }`}
                >
                  <Avatar src={u.photoURL} name={u.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{u.displayName}</p>
                    <p className="text-xs text-text-muted truncate">{u.email}</p>
                  </div>
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">No users found</p>
              )}
              {!searchQuery && !selectedUser && (
                <div className="text-center py-8">
                  <FiUser className="h-8 w-8 text-text-muted/30 mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Search for a user to chat with</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="px-4 py-3 border-b border-border bg-dark-100/50 backdrop-blur-sm flex items-center gap-3">
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-all show-desktop">
                    <FiArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar src={selectedUser.photoURL} name={selectedUser.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{selectedUser.displayName}</p>
                    <p className="text-xs text-text-muted truncate">{selectedUser.email}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-medium px-2 py-1 rounded bg-accent-bg text-accent-light">Admin View</span>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
                  {hasMoreMsgs && (
                    <div className="text-center py-2">
                      <button onClick={handleLoadMore} className="text-xs text-accent-light hover:underline">
                        Load older messages
                      </button>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.uid
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`relative max-w-[75%] px-4 py-2.5 text-sm leading-relaxed break-words ${
                          isOwn
                            ? 'bg-accent text-white rounded-[20px] rounded-br-[6px]'
                            : 'bg-dark-350/80 text-text-primary rounded-[20px] rounded-bl-[6px] border border-border-light'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <button
                                onClick={() => { if (window.confirm('Delete this message?')) deleteMsgMutation.mutate(msg._id) }}
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300 transition-all"
                              >
                                <FiTrash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-border bg-dark-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message as admin..."
                      className="flex-1 bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sendMutation.isPending}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light text-white flex items-center justify-center hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
                    >
                      <FiSend className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/5 to-transparent border border-border-light flex items-center justify-center mx-auto mb-5">
                    <FiMessageSquare className="h-9 w-9 text-accent-light" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">Chat as Admin</h3>
                  <p className="text-text-muted text-sm mt-1.5 max-w-xs">Search for a user on the left to start a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
