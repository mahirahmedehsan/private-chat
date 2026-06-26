import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  typingUsers: {},
  onlineUsers: {},
  notificationUnreadCount: 0,
  mutedConversations: [],
  loading: false,
  error: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload
    },
    addConversation: (state, action) => {
      state.conversations.unshift(action.payload)
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload
      if (action.payload?.id) {
        const conv = state.conversations.find((c) => c.id === action.payload.id)
        if (conv) conv.unreadCount = 0
      }
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload
      state.messages[conversationId] = messages
    },
    prependMessages: (state, action) => {
      const { conversationId, messages } = action.payload
      const existing = state.messages[conversationId] || []
      state.messages[conversationId] = [...messages, ...existing]
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }
      if (Array.isArray(message)) {
        state.messages[conversationId] = message
      } else {
        const exists = state.messages[conversationId].some(
          (m) => (m._id || m.messageId) === (message._id || message.messageId)
        )
        if (!exists) {
          state.messages[conversationId].push(message)
        }
      }
    },
    updateMessage: (state, action) => {
      const { conversationId, messageId, updates } = action.payload
      const msgs = state.messages[conversationId]
      if (msgs) {
        const idx = msgs.findIndex((m) => m._id === messageId || m.messageId === messageId)
        if (idx !== -1) {
          state.messages[conversationId][idx] = { ...msgs[idx], ...updates }
        }
      }
    },
    removeMessage: (state, action) => {
      const { conversationId, messageId } = action.payload
      const msgs = state.messages[conversationId]
      if (msgs) {
        state.messages[conversationId] = msgs.filter((m) => m._id !== messageId && m.messageId !== messageId)
      }
    },
    setTyping: (state, action) => {
      const { conversationId, uid, isTyping } = action.payload
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {}
      }
      state.typingUsers[conversationId][uid] = isTyping
    },
    updateConversationLastMessage: (state, action) => {
      const { conversationId, message, currentUserId } = action.payload
      let conv = state.conversations.find((c) => c.id === conversationId)
      if (!conv) {
        conv = {
          id: conversationId,
          user: null,
          lastMessage: null,
          unreadCount: 0,
          status: 'offline',
          lastActivity: null,
        }
        state.conversations.push(conv)
      }
      conv.lastMessage = message
      conv.lastActivity = new Date().toISOString()
      if (message.senderId && message.senderId !== currentUserId) {
        conv.unreadCount = (conv.unreadCount || 0) + 1
      }
    },
    setChatLoading: (state, action) => {
      state.loading = action.payload
    },
    setChatError: (state, action) => {
      state.error = action.payload
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    updateUserPresence: (state, action) => {
      const { uid, status, lastSeen } = action.payload
      state.onlineUsers = { ...state.onlineUsers, [uid]: { status, lastSeen } }
    },
    setNotificationUnreadCount: (state, action) => {
      state.notificationUnreadCount = action.payload
    },
    incrementNotificationUnread: (state) => {
      state.notificationUnreadCount += 1
    },
    muteConversation: (state, action) => {
      const { conversationId, mutedUntil } = action.payload
      const existing = state.mutedConversations.find((m) => m.conversationId === conversationId)
      if (existing) {
        existing.mutedUntil = mutedUntil || null
      } else {
        state.mutedConversations.push({ conversationId, mutedUntil: mutedUntil || null })
      }
    },
    unmuteConversation: (state, action) => {
      state.mutedConversations = state.mutedConversations.filter((m) => m.conversationId !== action.payload)
    },
    updateConversationUser: (state, action) => {
      const { uid, updates } = action.payload
      for (const conv of state.conversations) {
        if (conv.user?.uid === uid) {
          Object.assign(conv.user, updates)
        }
      }
    },
    clearChat: (state) => {
      state.conversations = []
      state.activeConversation = null
      state.messages = {}
      state.typingUsers = {}
      state.onlineUsers = {}
      state.notificationUnreadCount = 0
    },
  },
})

export const {
  setConversations,
  addConversation,
  setActiveConversation,
  setMessages,
  prependMessages,
  addMessage,
  updateMessage,
  setTyping,
  updateConversationLastMessage,
  setChatLoading,
  setChatError,
  setOnlineUsers,
  updateUserPresence,
  removeMessage,
  setNotificationUnreadCount,
  incrementNotificationUnread,
  muteConversation,
  unmuteConversation,
  updateConversationUser,
  clearChat,
} = chatSlice.actions
export default chatSlice.reducer
