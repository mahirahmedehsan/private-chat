import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import chatReducer from './slices/chatSlice'
import uiReducer from './slices/uiSlice'

let saveTimeout

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
})

store.subscribe(() => {
  const { auth } = store.getState()
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem('auth', JSON.stringify({
        user: auth.user,
        token: auth.token,
        googleAccessToken: auth.googleAccessToken,
        isAuthenticated: auth.isAuthenticated,
      }))
    } catch {}
  }, 300)
})
