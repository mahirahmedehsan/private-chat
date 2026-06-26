import api from './axios'

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/notifications', { params: { page, limit } })
  return data
}

export const markNotificationsRead = async (ids) => {
  const { data } = await api.put('/notifications/read', { ids })
  return data
}
