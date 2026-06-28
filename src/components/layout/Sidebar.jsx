import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiMessageSquare, FiUsers, FiSettings, FiHome, FiLogOut, FiUser, FiShield,
} from 'react-icons/fi'
import { setActiveSection, setMobileSidebarOpen } from '../../store/slices/uiSlice'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { logoutUser } from '../../api/auth'
import { disconnectSocket } from '../../config/socket'
import Avatar from '../ui/Avatar'

const navItems = [
  { id: 'feed', label: 'Feed', icon: FiHome, path: '/feed' },
  { id: 'chat', label: 'Chats', icon: FiMessageSquare, path: '/chat' },
  { id: 'friends', label: 'Friends', icon: FiUsers, path: '/friends' },
  { id: 'profile', label: 'Profile', icon: FiUser, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
  { id: 'admin', label: 'Admin', icon: FiShield, path: '/admin' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin } = useSelector((s) => s.auth)
  const { activeSection } = useSelector((s) => s.ui)

  const currentPath = location.pathname.split('/')[1] || 'chat'
  const activeId = activeSection || currentPath

  const handleNav = (item) => {
    dispatch(setActiveSection(item.id))
    dispatch(setMobileSidebarOpen(false))
    navigate(item.path)
  }

  const handleLogout = async () => {
    try { await logoutUser() } catch {}
    disconnectSocket()
    dispatch(logoutAction())
    navigate('/login')
  }

  return (
    <aside className="w-60 min-w-[240px] bg-dark-50 flex flex-col border-r border-border hide-mobile">
      {/* Logo / Home */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2.5 text-text-primary hover:text-accent-light transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <FiMessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">PrivateChat</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.filter((item) => item.id !== 'admin' || isAdmin).map((item) => {
          const isActive = activeId === item.id || (item.id === 'admin' && location.pathname.startsWith('/admin'))
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-accent-bg text-accent-light'
                  : 'text-text-secondary hover:bg-dark-200 hover:text-text-primary'
                }
              `}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-dark-200 hover:text-text-primary transition-all"
        >
          <Avatar src={user?.photoURL} name={user?.displayName} size="xs" status="online" />
          <span className="truncate">{user?.displayName || 'User'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-danger-bg hover:text-danger transition-all"
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
