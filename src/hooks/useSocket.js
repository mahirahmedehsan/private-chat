import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectSocket, disconnectSocket, getSocket } from '../config/socket'
import { addMessage, updateMessage, removeMessage, setTyping, updateUserPresence, updateConversationLastMessage, incrementNotificationUnread, updateConversationUser } from '../store/slices/chatSlice'
import { setUser, setE2EEEnabled, setE2EEReady } from '../store/slices/authSlice'
import { addToast } from '../store/slices/uiSlice'
import { getKeyPair, hasKeyPair } from '../utils/encryption'
import { useSound } from './useSound'

export function useSocket() {
  const dispatch = useDispatch()
  const { token, isAuthenticated, user } = useSelector((s) => s.auth)
  const notificationsEnabled = useSelector((s) => s.ui.notificationsEnabled)
  const sound = useSound()
  const soundRef = useRef(sound)
  soundRef.current = sound

  const userRef = useRef(user)
  userRef.current = user
  const notifRef = useRef(notificationsEnabled)
  notifRef.current = notificationsEnabled

  useEffect(() => {
    if (!token || !isAuthenticated) return

    const socket = connectSocket(token)

    socket.on('connect', async () => {
      const uid = userRef.current?.uid
      if (uid) {
        const keysExist = await hasKeyPair(uid)
        if (keysExist) {
          const keyPair = await getKeyPair(uid)
          if (keyPair) {
            socket.emit('e2ee:key-update', { publicKey: keyPair.publicKey, version: 1 })
            dispatch(setE2EEEnabled(true))
          }
        }
        dispatch(setE2EEReady(true))
      }
    })

    socket.on('disconnect', () => {})

    socket.on('connect_error', () => {})

    socket.on('e2ee:key', (data) => {
      if (data.publicKey) {
        dispatch(setE2EEEnabled(true))
      }
    })

    socket.on('chat:receive', (msg) => {
      if (msg.senderId !== userRef.current?.uid) {
        soundRef.current.playMessageReceived()
      }
      dispatch(addMessage({
        conversationId: msg.conversationId,
        message: msg,
      }))
      dispatch(updateConversationLastMessage({
        conversationId: msg.conversationId,
        currentUserId: userRef.current?.uid,
        message: {
          _id: msg._id,
          text: msg.encryptedContent ? '🔒' : (msg.text || ''),
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          ...(msg.file ? { file: msg.file } : {}),
        },
      }))
    })

    socket.on('chat:sent', ({ conversationId, messageId, _id }) => {
      dispatch(updateMessage({
        conversationId,
        messageId,
        updates: { _id },
      }))
    })

    socket.on('chat:reaction', (payload) => {
      dispatch(updateMessage({
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        updates: { reactions: payload.reactions },
      }))
    })

    socket.on('chat:typing', (payload) => {
      dispatch(setTyping(payload))
    })

    socket.on('chat:edit', (payload) => {
      dispatch(updateMessage({
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        updates: { text: payload.text, encryptedContent: payload.encryptedContent, isEdited: true },
      }))
    })

    socket.on('chat:delete', (payload) => {
      dispatch(removeMessage({ conversationId: payload.conversationId, messageId: payload.messageId }))
    })

    socket.on('notification:new', (notif) => {
      if (!notifRef.current) return
      soundRef.current.playNotification()
      dispatch(incrementNotificationUnread())
      dispatch(addToast({
        type: 'info',
        title: notif.type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        message: notif.payload?.message || 'New notification',
      }))
    })

    socket.on('presence:update', (payload) => {
      dispatch(updateUserPresence(payload))
      if (payload.uid === userRef.current?.uid) {
        dispatch(setUser({ ...userRef.current, status: payload.status, lastSeen: payload.lastSeen }))
      }
    })

    socket.on('profile:update', (payload) => {
      if (payload.uid === userRef.current?.uid) {
        dispatch(setUser({ ...userRef.current, ...payload.updates }))
      }
      dispatch(updateConversationUser({ uid: payload.uid, updates: payload.updates }))
    })

    return () => {
      disconnectSocket()
      dispatch(setE2EEReady(false))
    }
  }, [token, isAuthenticated, dispatch])

  return { socket: getSocket() }
}
