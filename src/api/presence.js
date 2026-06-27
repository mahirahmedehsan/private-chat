import api from './axios'

export const getPresenceStatus = async (uids) => {
  const { data } = await api.get('/presence/status', { params: { uids: uids.join(',') } })
  return data.users
}

export const heartbeat = async () => {
  const { data } = await api.post('/presence/heartbeat')
  return data
}
