import { store } from '../store'
import api from './axios'

function googleHeaders() {
  const { googleAccessToken } = store.getState().auth
  return googleAccessToken ? { 'X-Google-Access-Token': googleAccessToken } : {}
}

export const setupDrive = async () => {
  const { data } = await api.post('/drive/setup', {}, { headers: googleHeaders() })
  return data
}

export const uploadToDrive = async (file, parentFolderId) => {
  const form = new FormData()
  form.append('file', file)
  if (parentFolderId) form.append('parentFolderId', parentFolderId)
  const { data } = await api.post('/drive/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data', ...googleHeaders() },
  })
  return data
}

export const downloadFromDrive = async (fileId) => {
  const { data } = await api.get(`/drive/download/${fileId}`, {
    responseType: 'blob',
    headers: googleHeaders(),
  })
  return data
}

export const getFileProxyUrl = (fileId) => {
  const { googleAccessToken } = store.getState().auth
  const params = googleAccessToken ? `?token=${encodeURIComponent(googleAccessToken)}` : ''
  return `/api/drive/proxy/${fileId}${params}`
}

export const listDriveFiles = async (folderId) => {
  const { data } = await api.get(`/drive/files/${folderId}`, { headers: googleHeaders() })
  return data
}

export const deleteDriveFile = async (fileId) => {
  const { data } = await api.delete(`/drive/files/${fileId}`, { headers: googleHeaders() })
  return data
}
