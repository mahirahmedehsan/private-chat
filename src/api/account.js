import api from './axios'

export const deleteAccount = async (confirmation) => {
  const { data } = await api.delete('/account', { data: { confirmation } })
  return data
}

export const exportData = async () => {
  const { data } = await api.get('/account/export')
  return data
}
