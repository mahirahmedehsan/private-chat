import api from './axios'

export const getMe = async () => {
  const { data } = await api.get('/users/me')
  return data
}

export const getUser = async (uid) => {
  const { data } = await api.get(`/users/${uid}`)
  return data
}

export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/me', payload)
  return data
}

export const searchUsers = async (query) => {
  const { data } = await api.get('/users/search', { params: { q: query } })
  return data
}

export const getProfileStats = async () => {
  const { data } = await api.get('/users/me/stats')
  return data
}

export const getUserProfile = async (uid) => {
  const { data } = await api.get(`/users/${uid}/profile`)
  return data
}
