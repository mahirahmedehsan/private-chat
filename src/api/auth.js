import api from './axios'

function mapResponse(data) {
  return { token: data.accessToken, user: data.user, googleAccessToken: data.googleAccessToken }
}

export const loginWithGoogle = async (idToken, googleAccessToken) => {
  const { data } = await api.post('/auth/google', { idToken, googleAccessToken })
  return mapResponse(data)
}

export const registerUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload)
  return mapResponse(data)
}

export const loginUser = async (payload) => {
  const { data } = await api.post('/auth/login', payload)
  return mapResponse(data)
}

export const refreshToken = async () => {
  const { data } = await api.post('/auth/refresh')
  return data
}

export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout')
  return data
}
