import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiHome,
  FiLogOut,
  FiUser,
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
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)
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
    <motion.aside
      initial={{ x: -72 }}
      animate={{ x: 0 }}
      className="w-[72px] min-w-[72px] bg-dark-100 flex flex-col items-center py-3 gap-2 border-r border-border hide-mobile"
    >
      <div className="mb-2">
        <div
          onClick={() => navigate('/feed')}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center cursor-pointer hover:rounded-xl transition-all duration-200 shadow-lg shadow-accent/20"
        >
          <FiMessageSquare className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="w-7 h-px bg-border my-1" />

      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeId === item.id
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNav(item)}
              className={`
                relative w-11 h-11 rounded-2xl flex items-center justify-center
                transition-all duration-200 group
                ${isActive
                  ? 'bg-accent text-white rounded-xl shadow-lg shadow-accent/25'
                  : 'text-text-muted hover:text-text-primary hover:bg-dark-300 hover:rounded-xl'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-accent"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <motion.div className="relative z-10">
                <item.icon className="h-5 w-5" />
              </motion.div>
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark-200 border border-border-light rounded-xl text-xs font-medium text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50">
                {item.label}
              </div>
            </motion.button>
          )
        })}
      </nav>

      <div className="w-7 h-px bg-border my-1" />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-bg transition-all duration-200"
        title="Logout"
      >
        <FiLogOut className="h-4 w-4" />
      </motion.button>

      <div
        onClick={() => navigate('/profile')}
        className="relative group cursor-pointer"
      >
        <Avatar src={user?.photoURL} name={user?.displayName} size="sm" status="online" />
      </div>
    </motion.aside>
  )
}
