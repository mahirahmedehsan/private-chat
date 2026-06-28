import api from './axios'

export const getHelpMessages = async ({ page = 1, limit = 50 } = {}) => {
  const { data } = await api.get('/help-line/messages', { params: { page, limit } })
  return data
}

export const sendHelpMessage = async (text) => {
  const { data } = await api.post('/help-line/messages', { text })
  return data
}

export const getAdminHelpConversations = async () => {
  const { data } = await api.get('/admin/help-line/conversations')
  return data
}

export const getAdminHelpMessages = async (userId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/admin/help-line/messages/${userId}`, { params: { page, limit } })
  return data
}

export const sendAdminHelpResponse = async (userId, text) => {
  const { data } = await api.post(`/admin/help-line/messages/${userId}`, { text })
  return data
}
