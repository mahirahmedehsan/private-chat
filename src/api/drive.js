import api from './axios'

let _store
const loadStore = async () => {
  if (!_store) _store = (await import('../store')).store
}
const googleHeaders = async () => {
  await loadStore()
  const { googleAccessToken } = _store.getState().auth
  return googleAccessToken ? { 'X-Google-Access-Token': googleAccessToken } : {}
}

export const setupDrive = async () => {
  const { data } = await api.post('/drive/setup', {}, { headers: await googleHeaders() })
  return data
}

export const uploadToDrive = async (file, parentFolderId) => {
  const form = new FormData()
  form.append('file', file)
  if (parentFolderId) form.append('parentFolderId', parentFolderId)
  const { data } = await api.post('/drive/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data', ...await googleHeaders() },
  })
  return data
}

export const downloadFromDrive = async (fileId) => {
  const { data } = await api.get(`/drive/download/${fileId}`, {
    responseType: 'blob',
    headers: await googleHeaders(),
  })
  return data
}

export const getFileProxyUrl = async (fileId) => {
  await loadStore()
  const { googleAccessToken } = _store.getState().auth
  const params = googleAccessToken ? `?token=${encodeURIComponent(googleAccessToken)}` : ''
  return `/api/drive/proxy/${fileId}${params}`
}

export const listDriveFiles = async (folderId) => {
  const { data } = await api.get(`/drive/files/${folderId}`, { headers: await googleHeaders() })
  return data
}

export const deleteDriveFile = async (fileId) => {
  const { data } = await api.delete(`/drive/files/${fileId}`, { headers: await googleHeaders() })
  return data
}
