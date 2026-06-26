import api from './axios'

export const getFriends = async ({ status = 'accepted', page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/friends', { params: { status, page, limit } })
  return data
}

export const sendFriendRequest = async (userId) => {
  const { data } = await api.post('/friends/request', { userId })
  return data
}

export const respondToFriendRequest = async (requestId, action) => {
  const { data } = await api.put('/friends/respond', { requestId, action })
  return data
}

export const removeFriend = async (id) => {
  const { data } = await api.delete(`/friends/${id}`)
  return data
}

export const blockUser = async (id, duration) => {
  const { data } = await api.post(`/friends/block/${id}`, { duration })
  return data
}

export const unblockUser = async (id) => {
  const { data } = await api.post(`/friends/unblock/${id}`)
  return data
}

export const getFriendStatus = async (id) => {
  const { data } = await api.get(`/friends/status/${id}`)
  return data
}

export const getBlockedList = async () => {
  const { data } = await api.get('/friends/blocked')
  return data
}
