import { useSelector } from 'react-redux'

export function useChat(conversationId) {
  const { conversations, activeConversation, messages, typingUsers, loading } = useSelector((s) => s.chat)
  const conversation = conversations.find((c) => c.id === conversationId)
  const convMessages = messages[conversationId] || []
  const typing = typingUsers[conversationId] || {}

  return {
    conversation,
    activeConversation,
    messages: convMessages,
    typing,
    loading,
  }
}
