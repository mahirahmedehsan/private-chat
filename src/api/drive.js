import api from './axios'

export const setupDrive = async () => {
  const { data } = await api.post('/drive/setup')
  return data
}

export const uploadToDrive = async (file, parentFolderId) => {
  const form = new FormData()
  form.append('file', file)
  if (parentFolderId) form.append('parentFolderId', parentFolderId)
  const { data } = await api.post('/drive/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const downloadFromDrive = async (fileId) => {
  const { data } = await api.get(`/drive/download/${fileId}`, {
    responseType: 'blob',
  })
  return data
}

export const getFileProxyUrl = (fileId) => {
  return `/api/drive/proxy/${fileId}`
}

export const listDriveFiles = async (folderId) => {
  const { data } = await api.get(`/drive/files/${folderId}`)
  return data
}

export const deleteDriveFile = async (fileId) => {
  const { data } = await api.delete(`/drive/files/${fileId}`)
  return data
}
