import api from './axios'

export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload', formData)
  return data
}
