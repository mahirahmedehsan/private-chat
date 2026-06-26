import api from './axios'

export const getFeed = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/notes', { params: { page, limit } })
  return data
}

export const getMyNotes = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/notes/my', { params: { page, limit } })
  return data
}

export const createNote = async (payload) => {
  const { data } = await api.post('/notes', payload)
  return data
}

export const updateNote = async (id, payload) => {
  const { data } = await api.put(`/notes/${id}`, payload)
  return data
}

export const deleteNote = async (id) => {
  const { data } = await api.delete(`/notes/${id}`)
  return data
}

export const toggleReaction = async (id, emoji) => {
  const { data } = await api.post(`/notes/${id}/react`, { emoji })
  return data
}

export const addComment = async (noteId, content) => {
  const { data } = await api.post(`/notes/${noteId}/comments`, { content })
  return data
}

export const toggleCommentReaction = async (noteId, commentId, emoji) => {
  const { data } = await api.post(`/notes/${noteId}/comments/${commentId}/react`, { emoji })
  return data
}

export const deleteComment = async (noteId, commentId) => {
  const { data } = await api.delete(`/notes/${noteId}/comments/${commentId}`)
  return data
}
