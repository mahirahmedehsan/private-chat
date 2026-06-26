import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useSocket } from './hooks/useSocket'
import ErrorBoundary from './components/ui/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import { I18nProvider } from './locales/i18n.jsx'

const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ChatList = lazy(() => import('./pages/chat/ChatList'))
const ChatRoom = lazy(() => import('./pages/chat/ChatRoom'))
const Feed = lazy(() => import('./pages/feed/Feed'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const FriendProfile = lazy(() => import('./pages/profile/FriendProfile'))
const Settings = lazy(() => import('./pages/settings/Settings'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))
const Friends = lazy(() => import('./pages/friends/Friends'))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth)
  if (isAuthenticated) return <Navigate to="/chat" replace />
  return children
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppContent() {
  const { isAuthenticated } = useSelector((s) => s.auth)
  useSocket()

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:conversationId" element={<ChatRoom />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<FriendProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function ThemeProvider({ children }) {
  const darkMode = useSelector((s) => s.ui.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
