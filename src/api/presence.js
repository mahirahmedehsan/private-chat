import api from './axios'

export const getOnlineUsers = async () => {
  const { data } = await api.get('/presence/online')
  return data
}
