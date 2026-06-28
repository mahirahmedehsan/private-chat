import { createSlice } from '@reduxjs/toolkit'

function loadState() {
  try {
    const saved = localStorage.getItem('auth')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.token) {
        return { ...parsed, loading: false, error: null }
      }
    }
  } catch {}
  return undefined
}

const preloadedState = loadState()

const initialState = {
  user: null,
  token: null,
  googleAccessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  e2eeEnabled: false,
  e2eeReady: false,
  isAdmin: false,
  ...preloadedState,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, googleAccessToken } = action.payload
      state.user = user
      state.token = token
      state.googleAccessToken = googleAccessToken || null
      state.isAuthenticated = true
      state.isAdmin = user?.role === 'admin'
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isAdmin = action.payload?.role === 'admin'
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.googleAccessToken = null
      state.isAuthenticated = false
      state.isAdmin = false
      state.error = null
      state.e2eeEnabled = false
      state.e2eeReady = false
    },
    clearError: (state) => {
      state.error = null
    },
    setE2EEEnabled: (state, action) => {
      state.e2eeEnabled = action.payload
    },
    setE2EEReady: (state, action) => {
      state.e2eeReady = action.payload
    },
  },
})

export const { setCredentials, setUser, setLoading, setError, logout, clearError, setE2EEEnabled, setE2EEReady } = authSlice.actions
export default authSlice.reducer
