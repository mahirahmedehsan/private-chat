import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiSend, FiMessageSquare } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { getHelpMessages, sendHelpMessage, getAdminHelpMessages, sendAdminHelpResponse } from '../../api/helpLine'
import { getSocket } from '../../config/socket'

export default function HelpLineChat({ userId, isAdmin, userName }) {
  const currentUserId = useSelector((s) => s.auth.user?.uid)
  const [text, setText] = useState('')
  const [page, setPage] = useState(1)
  const [allMessages, setAllMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: isAdmin ? ['admin', 'help-line', 'messages', userId] : ['help-line', 'messages'],
    queryFn: () => isAdmin
      ? getAdminHelpMessages(userId, { page: 1, limit: 50 })
      : getHelpMessages({ page: 1, limit: 50 }),
  })

  useEffect(() => {
    if (data) {
      setAllMessages(data.messages || [])
      setHasMore(data.hasMore || false)
      setPage(1)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
    }
  }, [data])

  const sendMutation = useMutation({
    mutationFn: isAdmin
      ? (text) => sendAdminHelpResponse(userId, text)
      : (text) => sendHelpMessage(text),
    onSuccess: (res) => {
      setText('')
      setAllMessages((prev) => [...prev, res.message])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    },
  })

  const loadMore = async () => {
    const next = page + 1
    const fetchFn = isAdmin ? getAdminHelpMessages : getHelpMessages
    const params = isAdmin ? [userId, { page: next, limit: 50 }] : [{ page: next, limit: 50 }]
    const res = await fetchFn(...params)
    setAllMessages((prev) => [...(res.messages || []), ...prev])
    setHasMore(res.hasMore || false)
    setPage(next)
  }

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const event = isAdmin ? 'help:new' : 'help:receive'
    const handler = (msg) => {
      if (!isAdmin || msg.userId === userId) {
        setAllMessages((prev) => [...prev, msg])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [isAdmin, userId])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() || sendMutation.isPending) return
    sendMutation.mutate(text.trim())
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {hasMore && (
          <div className="text-center py-2">
            <button onClick={loadMore} className="text-xs text-accent-light hover:underline">
              Load older messages
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-dark-200 border border-dark-400 flex items-center justify-center mb-4">
              <FiMessageSquare className="h-6 w-6 text-accent-light" />
            </div>
            <p className="text-sm text-text-muted">Send a message to start the conversation</p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isOwn = isAdmin ? msg.senderId !== userId : msg.senderId === currentUserId
            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`relative max-w-[80%] px-4 py-2.5 text-sm leading-relaxed break-words ${
                  isOwn
                    ? 'bg-accent text-white rounded-[20px] rounded-br-[6px]'
                    : 'bg-dark-200 text-text-primary rounded-[20px] rounded-bl-[6px] border border-dark-400'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {!isOwn && isAdmin && (
                      <span className="text-[10px] text-accent-light font-medium">Admin</span>
                    )}
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-dark-400">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isAdmin ? 'Type your response...' : 'Type your message...'}
            className="flex-1 bg-dark-200 border border-dark-400 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-all disabled:opacity-50 shrink-0"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
