import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let _store
let _logout
let _setCredentials
const loadStore = async () => {
  if (!_store) {
    const [{ store }, mod] = await Promise.all([
      import('../store'),
      import('../store/slices/authSlice'),
    ])
    _store = store
    _logout = mod.logout
    _setCredentials = mod.setCredentials
  }
}

api.interceptors.request.use(async (config) => {
  await loadStore()
  const { token } = _store.getState().auth
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((t) => {
          original.headers.Authorization = `Bearer ${t}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        await loadStore()
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
        const currentUser = _store.getState().auth.user
        _store.dispatch(_setCredentials({ token: data.accessToken, user: currentUser }))
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        try { await loadStore(); _store.dispatch(_logout()) } catch {}
        processQueue(error, null)
        localStorage.removeItem('auth')
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
