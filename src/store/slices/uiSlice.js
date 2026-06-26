import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  modal: null,
  modalData: null,
  toasts: [],
  activeSection: 'chat',
  soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
  darkMode: localStorage.getItem('darkMode') !== 'false',
  notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
  onlineStatusVisible: localStorage.getItem('onlineStatusVisible') !== 'false',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload
    },
    openModal: (state, action) => {
      state.modal = action.payload.type
      state.modalData = action.payload.data || null
    },
    closeModal: (state) => {
      state.modal = null
      state.modalData = null
    },
    addToast: (state, action) => {
      state.toasts.push({ id: Date.now(), ...action.payload })
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    setActiveSection: (state, action) => {
      state.activeSection = action.payload
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled
      localStorage.setItem('soundEnabled', state.soundEnabled)
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', state.darkMode)
    },
    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled
      localStorage.setItem('notificationsEnabled', state.notificationsEnabled)
    },
    toggleOnlineStatus: (state) => {
      state.onlineStatusVisible = !state.onlineStatusVisible
      localStorage.setItem('onlineStatusVisible', state.onlineStatusVisible)
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setMobileSidebarOpen,
  openModal,
  closeModal,
  addToast,
  removeToast,
  setActiveSection,
  toggleSound,
  toggleDarkMode,
  toggleNotifications,
  toggleOnlineStatus,
} = uiSlice.actions
export default uiSlice.reducer
