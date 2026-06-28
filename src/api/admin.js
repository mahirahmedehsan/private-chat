import api from './axios'

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data
}

export const getAdminUsers = async ({ page = 1, limit = 20, search, role, banned } = {}) => {
  const { data } = await api.get('/admin/users', { params: { page, limit, search, role, banned } })
  return data
}

export const updateUserRole = async (uid, role) => {
  const { data } = await api.put(`/admin/users/${uid}/role`, { role })
  return data
}

export const toggleBanUser = async (uid) => {
  const { data } = await api.post(`/admin/users/${uid}/ban`)
  return data
}

export const getAdminNotes = async ({ page = 1, limit = 20, author } = {}) => {
  const { data } = await api.get('/admin/notes', { params: { page, limit, author } })
  return data
}

export const adminDeleteNote = async (id) => {
  const { data } = await api.delete(`/admin/notes/${id}`)
  return data
}

export const getAdminReports = async ({ page = 1, limit = 20, status } = {}) => {
  const { data } = await api.get('/admin/reports', { params: { page, limit, status } })
  return data
}

export const createReport = async (payload) => {
  const { data } = await api.post('/admin/reports', payload)
  return data
}

export const resolveReport = async (id, status, action) => {
  const { data } = await api.put(`/admin/reports/${id}`, { status, action })
  return data
}

export const getConversationMessages = async (conversationId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/admin/messages/${conversationId}`, { params: { page, limit } })
  return data
}

export const adminSendMessage = async (recipientId, text) => {
  const { data } = await api.post('/admin/messages', { recipientId, text })
  return data
}

export const adminDeleteMessage = async (id) => {
  const { data } = await api.delete(`/admin/messages/${id}`)
  return data
}
