import { store } from '../store'
import { uploadToDrive } from '../api/drive'

export async function backupToDrive(type, data) {
  const state = store.getState()
  const folders = state.auth?.user?.driveFolders
  if (!folders) {
    return
  }

  const folderMap = {
    note: folders.Backups,
    message: folders.Chats,
    comment: folders.Backups,
  }

  const folderId = folderMap[type]
  if (!folderId) {
    return
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${type}-${timestamp}.json`
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const file = new File([blob], fileName, { type: 'application/json' })

  try {
    await uploadToDrive(file, folderId)
  } catch (err) {
    console.warn('[Backup] Drive upload failed:', err.message)
  }
}
