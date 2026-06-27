import api from './axios'

export const uploadFile = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form)
  return data
}

export const getMessages = async (conversationId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/messages/${conversationId}`, { params: { page, limit } })
  return data
}

export const sendMessage = async (payload) => {
  const { data } = await api.post('/messages', payload)
  return data
}

export const editMessage = async (messageId, payload) => {
  if (typeof payload === 'string') {
    const { data } = await api.put(`/messages/${messageId}`, { text: payload })
    return data
  }
  const { data } = await api.put(`/messages/${messageId}`, payload)
  return data
}

export const deleteMessage = async (messageId) => {
  const { data } = await api.delete(`/messages/${messageId}`)
  return data
}

export const toggleReaction = async (messageId, emoji) => {
  const { data } = await api.put(`/messages/${messageId}/reaction`, { emoji })
  return data
}
