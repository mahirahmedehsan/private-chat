import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiPhone, FiVideo, FiInfo, FiMoreHorizontal, FiX, FiMail, FiCalendar, FiMessageSquare, FiSend, FiImage, FiFile, FiBell, FiUserX, FiUserCheck, FiSlash, FiBellOff, FiClock, FiLock, FiFlag } from 'react-icons/fi'
import { getMessages, sendMessage as apiSendMessage, editMessage as apiEditMessage, deleteMessage as apiDeleteMessage, toggleReaction } from '../../api/messages'
import { getUser } from '../../api/users'
import { removeFriend, blockUser, unblockUser, getFriendStatus } from '../../api/friends'
import { createReport } from '../../api/admin'
import { setActiveSection, addToast } from '../../store/slices/uiSlice'
import { setMessages, addMessage, removeMessage, updateMessage, setTyping, updateConversationLastMessage, muteConversation, unmuteConversation } from '../../store/slices/chatSlice'
import { getSocket } from '../../config/socket'
import { encryptMessage, decryptMessage, getKeyPair } from '../../utils/encryption'
import { setE2EEEnabled } from '../../store/slices/authSlice'
import ChatBubble from '../../components/chat/ChatBubble'
import MessageInput from '../../components/chat/MessageInput'
import TypingIndicator from '../../components/chat/TypingIndicator'
import EmptyChat from '../../components/chat/EmptyChat'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { MessageSkeleton } from '../../components/ui/Skeleton'

export default function ChatRoom() {
  const { conversationId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const { user, e2eeEnabled, e2eeReady } = useSelector((s) => s.auth)
  const { conversations, typingUsers, messages, onlineUsers, notificationUnreadCount, mutedConversations } = useSelector((s) => s.chat)
  const [showInfo, setShowInfo] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)
  const [otherPublicKey, setOtherPublicKey] = useState(null)
  const [decryptedMessages, setDecryptedMessages] = useState({})
  const decryptedRef = useRef({})

  const conversation = conversations.find((c) => c.id === conversationId)
  const otherUser = conversation?.user
  const otherPresence = onlineUsers[otherUser?.uid]
  const otherStatus = otherPresence?.status || otherUser?.status || 'offline'
  const isTyping = typingUsers[conversationId]?.[otherUser?.uid]

  const { data: otherUserProfile } = useQuery({
    queryKey: ['user', otherUser?.uid],
    queryFn: () => getUser(otherUser?.uid),
    enabled: showInfo && !!otherUser?.uid,
  })

  const { data: friendStatusData } = useQuery({
    queryKey: ['friendStatus', otherUser?.uid],
    queryFn: () => getFriendStatus(otherUser?.uid),
    enabled: !!otherUser?.uid,
  })

  const isBlocked = friendStatusData?.blockedByMe || friendStatusData?.blockedByThem

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) => getMessages(conversationId, { page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    enabled: !!conversationId,
    refetchOnMount: true,
    refetchInterval: false,
  })

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  useEffect(() => {
    if (conversationId && user && e2eeReady) {
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit('e2ee:key-request', { uid: otherUser?.uid })
      }
    }
  }, [conversationId, otherUser?.uid, user, e2eeReady])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleKeyResponse = (data) => {
      if (data.uid === otherUser?.uid && data.publicKey) {
        setOtherPublicKey(data.publicKey)
        dispatch(setE2EEEnabled(true))
      }
    }

    const handleReceive = (data) => {
      if (data.conversationId === conversationId) {
        dispatch(addMessage({ conversationId, message: data }))
        if (isNearBottom()) {
          scrollToBottom(true)
        }
      }
    }

    const handleNotif = (data) => {
      if (data.type === 'new_message' || data.type === 'friend_request' || data.type === 'friend_accepted') {
        refetch()
      }
    }

    socket.on('e2ee:key-response', handleKeyResponse)
    socket.on('chat:receive', handleReceive)
    socket.on('notification:new', handleNotif)
    return () => {
      socket.off('e2ee:key-response', handleKeyResponse)
      socket.off('chat:receive', handleReceive)
      socket.off('notification:new', handleNotif)
    }
  }, [otherUser?.uid, conversationId, dispatch, refetch, scrollToBottom])

  useEffect(() => {
    if (data) {
      const allMessages = data.pages.flatMap((p) => p.messages || []).reverse()
      dispatch(setMessages({ conversationId, messages: allMessages }))
    }
  }, [data])

  useEffect(() => {
    const socket = getSocket()
    if (socket?.connected) return
    const interval = setInterval(() => { refetch() }, 5000)
    return () => clearInterval(interval)
  }, [conversationId])

  const decryptMessagesInList = async (msgs) => {
    if (!e2eeReady || !otherPublicKey) return
    const myKeyPair = await getKeyPair(user?.uid)
    if (!myKeyPair) return

    const decrypted = {}
    for (const msg of msgs) {
      if (msg.encryptedContent && !decryptedRef.current[msg._id]) {
        const plaintext = decryptMessage(
          msg.encryptedContent,
          otherPublicKey,
          myKeyPair.secretKey
        )
        if (plaintext) {
          decrypted[msg._id] = plaintext
          decryptedRef.current[msg._id] = plaintext
        }
      }
    }
    if (Object.keys(decrypted).length > 0) {
      setDecryptedMessages((prev) => ({ ...prev, ...decrypted }))
    }
  }

  useEffect(() => {
    if (e2eeReady && otherPublicKey) {
      const msgs = messages[conversationId] || []
      decryptMessagesInList(msgs)
    }
  }, [messages[conversationId]?.length, JSON.stringify(messages[conversationId]?.map((m) => m._id)), e2eeReady, otherPublicKey])

  useEffect(() => {
    if (!isFetchingNextPage && isNearBottom()) {
      scrollToBottom()
    }
  }, [messages[conversationId]?.length, isFetchingNextPage])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)

    if (el.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSend = async ({ text, file } = {}) => {
    const tempId = `temp-${Date.now()}`
    const myKeyPair = e2eeReady ? await getKeyPair(user?.uid) : null

    let encryptedContent = null

    if (myKeyPair && otherPublicKey && e2eeEnabled && text) {
      encryptedContent = encryptMessage(text, otherPublicKey, myKeyPair.secretKey)
    }

    const msg = {
      _id: tempId,
      text: text || '',
      encryptedContent,
      senderId: user?.uid,
      conversationId,
      createdAt: new Date().toISOString(),
      reactions: [],
      ...(file ? { file } : {}),
    }
    dispatch(addMessage({ conversationId, message: msg }))
    dispatch(updateConversationLastMessage({
      conversationId,
      currentUserId: user?.uid,
      message: { _id: tempId, text: text || '🔒', createdAt: msg.createdAt, senderId: user?.uid, ...(file ? { file } : {}) },
    }))
    scrollToBottom()

    try {
      const res = await apiSendMessage({
        recipientId: otherUser?.uid,
        text: encryptedContent ? '' : (text || ''),
        encryptedContent,
        ...(file ? { file } : {}),
      })
      dispatch(updateMessage({
        conversationId,
        messageId: tempId,
        updates: { _id: res._id || tempId },
      }))
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit('chat:send', {
          to: otherUser?.uid,
          text: encryptedContent ? '' : (text || ''),
          encryptedContent,
          conversationId,
          messageId: res._id,
          timestamp: msg.createdAt,
          ...(file ? { file } : {}),
        })
      }
    } catch (err) {
      dispatch(removeMessage({ conversationId, messageId: tempId }))
    }
  }

  const handleTyping = (isTyping) => {
    const socket = getSocket()
    socket?.emit('chat:typing', { to: otherUser?.uid, conversationId, isTyping })
  }

  const handleReaction = async (messageId, emoji) => {
    try {
      const res = await toggleReaction(messageId, emoji)
      dispatch(updateMessage({
        conversationId,
        messageId,
        updates: { reactions: res.reactions },
      }))
    } catch {}
  }

  const handleEditMessage = async (messageId, newText) => {
    let encryptedContent = null
    const myKeyPair = e2eeReady ? await getKeyPair(user?.uid) : null
    if (myKeyPair && otherPublicKey && e2eeEnabled && newText) {
      encryptedContent = encryptMessage(newText, otherPublicKey, myKeyPair.secretKey)
      try {
        const res = await apiEditMessage(messageId, { encryptedContent })
        dispatch(updateMessage({
          conversationId,
          messageId,
          updates: { text: '', encryptedContent, isEdited: true },
        }))
      } catch {}
      return
    }

    try {
      const res = await apiEditMessage(messageId, newText)
      dispatch(updateMessage({
        conversationId,
        messageId,
        updates: { text: res.text, isEdited: true },
      }))
    } catch {}
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiDeleteMessage(messageId)
      dispatch(removeMessage({ conversationId, messageId }))
    } catch {}
  }

  const isMuted = mutedConversations.some(
    (m) => m.conversationId === conversationId && (!m.mutedUntil || new Date(m.mutedUntil) > new Date())
  )

  const snoozes = [
    { label: '1 hour', ms: 60 * 60 * 1000 },
    { label: '8 hours', ms: 8 * 60 * 60 * 1000 },
    { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  ]

  const [customBlock, setCustomBlock] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')

  const reportMutation = useMutation({
    mutationFn: (payload) => createReport(payload),
    onSuccess: () => {
      dispatch(addToast({ type: 'success', title: 'Report submitted' }))
      setShowReportModal(false)
      setReportReason('')
      setReportDesc('')
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to submit report' })),
  })

  const blockDurations = [
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '8 hours', minutes: 480 },
    { label: '24 hours', minutes: 1440 },
    { label: 'Permanent', minutes: null },
  ]

  const handleUnfriend = async () => {
    try { await removeFriend(otherUser.uid) } catch {}
    setShowMenu(false)
  }

  const handleBlock = async (minutes) => {
    try { await blockUser(otherUser.uid, minutes) } catch {}
    setShowMenu(false)
  }

  const handleUnblock = async () => {
    try { await unblockUser(otherUser.uid) } catch {}
    setShowMenu(false)
  }

  const formatBlockTime = (until) => {
    if (!until) return null
    const diff = new Date(until) - new Date()
    if (diff <= 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 0) return `${h}h ${m}m remaining`
    return `${m}m remaining`
  }

  const handleMute = () => {
    if (isMuted) {
      dispatch(unmuteConversation(conversationId))
    } else {
      dispatch(muteConversation({ conversationId }))
    }
    setShowMenu(false)
  }

  const handleSnooze = (ms) => {
    dispatch(muteConversation({ conversationId, mutedUntil: new Date(Date.now() + ms).toISOString() }))
    setShowMenu(false)
  }

  if (!conversation) {
    return (
      <EmptyChat
        title="Select a conversation"
        subtitle="Choose a chat from the sidebar or start a new one"
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <header className="h-14 min-h-[56px] bg-dark-100/70 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-dark-300/60 transition-all"
            aria-label="Back to chats"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/profile/${otherUser?.uid}`)}
            className="flex items-center gap-3 min-w-0 text-left group"
          >
            <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} size="md" status={otherStatus} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-light transition-colors">
                {otherUser?.displayName || 'User'}
              </h2>
              <p className="text-xs capitalize" style={{ color: otherStatus === 'online' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {otherStatus}
              </p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1">
          {e2eeEnabled && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 text-accent-light text-[10px] font-medium shadow-sm" title="End-to-end encrypted">
              <FiLock className="h-3 w-3" />
              <span className="hide-mobile">E2EE</span>
            </div>
          )}
          <button
            onClick={() => {
              dispatch(setActiveSection('notifications'))
              navigate('/notifications')
            }}
            className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-dark-300/60 transition-all"
            aria-label="Notifications"
          >
            <FiBell className="h-4 w-4" />
            {notificationUnreadCount > 0 && (
              <Badge count={notificationUnreadCount} size="xs" className="absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-dark-300/60 transition-all" aria-label="Voice call">
            <FiPhone className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-dark-300/60 transition-all" aria-label="Video call">
            <FiVideo className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-xl transition-all ${showInfo ? 'bg-accent/15 text-accent-light shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-dark-300/60'}`}
            aria-label="Chat info"
          >
            <FiInfo className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 rounded-xl transition-all text-text-muted hover:text-text-primary hover:bg-dark-300/60"
            aria-label="More options"
          >
            <FiMoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMenu(false)}
            className="fixed inset-0 bg-black/50 z-40"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-72 bg-dark-150/95 backdrop-blur-2xl border-l border-border-light shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Options</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-all"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-3">
                  <button
                    onClick={handleUnfriend}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-primary hover:bg-dark-350/60 transition-colors"
                  >
                    <FiUserX className="h-4 w-4 text-text-muted shrink-0" />
                    Unfriend
                  </button>
                </div>
                <div className="px-3 mt-2">
                  {isBlocked ? (
                    <button
                      onClick={handleUnblock}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-primary hover:bg-dark-350/60 transition-colors"
                    >
                      <FiUserCheck className="h-4 w-4 text-text-muted shrink-0" />
                      Unblock
                    </button>
                  ) : (
                    <div>
                      <p className="px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Block</p>
                      {blockDurations.map((d) => (
                        <button
                          key={d.label}
                          onClick={() => handleBlock(d.minutes)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-primary hover:bg-dark-350/60 transition-colors"
                        >
                          <FiClock className="h-4 w-4 text-text-muted shrink-0" />
                          {d.label}
                        </button>
                      ))}
                      {customBlock ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const m = parseInt(customMinutes)
                            if (m > 0) { handleBlock(m); setCustomMinutes(''); setCustomBlock(false) }
                          }}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <input
                            type="number"
                            min="1"
                            placeholder="Minutes"
                            value={customMinutes}
                            onChange={(e) => setCustomMinutes(e.target.value)}
                            className="w-full bg-dark-350/80 border border-border-light rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors shrink-0"
                          >
                            Go
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCustomBlock(false); setCustomMinutes('') }}
                            className="p-1.5 rounded text-text-muted hover:text-text-primary"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setCustomBlock(true)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-colors"
                        >
                          <FiClock className="h-4 w-4" />
                          Custom...
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="border-t border-border mx-3 my-2" />
                <div className="px-3">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-primary hover:bg-dark-350/60 transition-colors"
                  >
                    <FiFlag className="h-4 w-4 text-text-muted shrink-0" />
                    Report User
                  </button>
                </div>
                <div className="border-t border-border mx-3 my-2" />
                <div className="px-3">
                  <button
                    onClick={handleMute}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-primary hover:bg-dark-350/60 transition-colors"
                  >
                    <FiBellOff className="h-4 w-4 text-text-muted shrink-0" />
                    {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                  </button>
                  {!isMuted && (
                    <div className="ml-11 mt-1 space-y-0.5">
                      {snoozes.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => handleSnooze(s.ms)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-colors"
                        >
                          <FiClock className="h-3.5 w-3.5" />
                          Mute for {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showInfo && otherUserProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowInfo(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-200/95 backdrop-blur-md border border-border-light rounded-2xl p-6 w-[90%] max-w-sm flex flex-col items-center gap-3 shadow-2xl"
          >
            <div className="relative">
              <Avatar src={otherUserProfile.photoURL} name={otherUserProfile.displayName} size="xl" status={otherStatus} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary">{otherUserProfile.displayName}</h3>
              <p className="text-sm" style={{ color: otherStatus === 'online' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {otherStatus}
              </p>
            </div>
            <div className="w-full space-y-2 mt-2">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-350/60 backdrop-blur-sm rounded-xl border border-border-light">
                <FiMail className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-sm text-text-primary truncate">{otherUserProfile.email}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-350/60 backdrop-blur-sm rounded-xl border border-border-light">
                <FiCalendar className="h-4 w-4 text-text-muted shrink-0" />
                <span className="text-sm text-text-primary">Joined {new Date(otherUserProfile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            {e2eeEnabled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20 w-full">
                <FiLock className="h-4 w-4 text-accent-light shrink-0" />
                <span className="text-xs text-accent-light">Messages are end-to-end encrypted</span>
              </div>
            )}
            <button
              onClick={() => setShowInfo(false)}
              className="mt-2 w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-all"
              aria-label="Close info"
            >
              <FiX className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-gutter"
      >
        {isLoading ? (
          <div className="space-y-2 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="space-y-1 px-4">
              {(messages[conversationId] || []).map((msg) => {
                const isEncrypted = !!msg.encryptedContent
                const decryptedText = decryptedMessages[msg._id]
                const isOwn = msg.senderId === user?.uid
                const displayMsg = {
                  ...msg,
                  text: isEncrypted && !isOwn
                    ? (decryptedText || '')
                    : msg.text,
                  isEncrypted,
                  isDecrypted: !!decryptedText,
                }
                return (
                  <ChatBubble
                    key={msg._id || msg.messageId}
                    message={displayMsg}
                    isOwn={msg.senderId === user?.uid}
                    onReact={handleReaction}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onViewImage={setViewingImage}
                  />
                )
              })}
            </div>

            {!isLoading && !(messages[conversationId] || []).length && !isFetchingNextPage && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-4 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/5 to-transparent border border-border-light flex items-center justify-center mb-5 shadow-lg shadow-accent/5">
                  <FiMessageSquare className="h-9 w-9 text-accent-light" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Start a conversation</h3>
                <p className="text-text-secondary text-sm max-w-xs mb-6">
                  Send a message or share media with {otherUser?.displayName || 'your friend'}
                </p>
                <div className="flex items-center gap-6 text-text-muted">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-dark-350/60 border border-border-light flex items-center justify-center">
                      <FiSend className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium">Text</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-dark-350/60 border border-border-light flex items-center justify-center">
                      <FiImage className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium">Image</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-dark-350/60 border border-border-light flex items-center justify-center">
                      <FiFile className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium">PDF</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isTyping && <TypingIndicator name={otherUser?.displayName} />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {showScrollBtn && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-accent-hover transition-colors z-10"
        >
          <FiArrowLeft className="h-4 w-4 rotate-90" />
        </motion.button>
      )}

      {friendStatusData?.blockedByMe && (
        <div className="px-4 py-3 bg-gradient-to-r from-danger/5 to-transparent backdrop-blur-sm border-t border-border border-danger/10">
          <div className="flex items-center justify-center gap-2">
            <FiSlash className="h-4 w-4 text-danger shrink-0" />
            <p className="text-sm text-text-muted">
              You blocked this user. {formatBlockTime(friendStatusData.blockedUntil) && <span className="text-text-muted">({formatBlockTime(friendStatusData.blockedUntil)})</span>} Unblock to send messages.
            </p>
          </div>
        </div>
      )}
      {friendStatusData?.blockedByThem && (
        <div className="px-4 py-3 bg-gradient-to-r from-warning/5 to-transparent backdrop-blur-sm border-t border-border border-warning/10">
          <div className="flex items-center justify-center gap-2">
            <FiSlash className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-text-muted">
              This user has blocked you.
            </p>
          </div>
        </div>
      )}
      <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={isBlocked} />

      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={viewingImage}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportReason(''); setReportDesc('') }}
        title="Report User"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Report <strong className="text-text-primary">{otherUser?.displayName}</strong> for violating the community guidelines.
          </p>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Select a reason</option>
              <option value="Harassment">Harassment</option>
              <option value="Spam">Spam</option>
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Fake account">Fake account</option>
              <option value="Hate speech">Hate speech</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Description (optional)</label>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Provide additional details..."
              className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => { setShowReportModal(false); setReportReason(''); setReportDesc('') }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              disabled={!reportReason}
              onClick={() => reportMutation.mutate({ targetType: 'user', targetId: otherUser?.uid, reason: reportReason, description: reportDesc })}
              loading={reportMutation.isPending}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
