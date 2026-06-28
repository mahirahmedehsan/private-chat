import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FiMessageSquare, FiUsers, FiHome, FiUser, FiSettings, FiShield } from 'react-icons/fi'
import { setActiveSection } from '../../store/slices/uiSlice'
import { useT } from '../../locales/i18n.jsx'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'

const navItems = [
  { id: 'feed', label: 'Feed', icon: FiHome, path: '/feed' },
  { id: 'chat', label: 'Chats', icon: FiMessageSquare, path: '/chat' },
  { id: 'friends', label: 'Friends', icon: FiUsers, path: '/friends' },
  { id: 'profile', label: 'Profile', icon: FiUser, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
  { id: 'admin', label: 'Admin', icon: FiShield, path: '/admin' },
]

export default function MobileNav() {
  const t = useT()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useSelector((s) => s.auth)
  const activeSection = useSelector((s) => s.ui.activeSection)
  const unreadTotal = useSelector((s) => (s.chat.notificationUnreadCount || 0) + (s.chat.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)))
  const currentPath = location.pathname.split('/')[1] || 'chat'
  const activeId = activeSection || currentPath

  const handleNav = (item) => {
    dispatch(setActiveSection(item.id))
    navigate(item.path)
  }

  useKeyboardNav(navItems, activeId, handleNav)

  return (
    <nav className="hide-desktop fixed bottom-0 left-0 right-0 z-40 bg-dark-150/85 backdrop-blur-2xl border-t border-border safe-area-bottom" aria-label="Mobile navigation">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.filter((item) => item.id !== 'admin' || isAdmin).map((item) => {
          const isActive = activeId === item.id || (item.id === 'admin' && location.pathname.startsWith('/admin'))
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-active-tab"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-accent to-accent-light rounded-full"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`
                  flex items-center justify-center w-10 h-8 rounded-lg transition-all duration-200
                  ${isActive ? 'text-accent' : 'text-text-muted'}
                `}
              >
                <Icon className="h-[18px] w-[18px]" />
              </motion.div>
              <span
                className={`text-[9px] font-medium leading-none mt-0.5 transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {t(`nav.${item.id}`)}
              </span>
              {item.id === 'chat' && unreadTotal > 0 && (
                <span className="absolute top-0.5 right-1/4 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-gradient-to-r from-danger to-red-500 text-[8px] font-bold text-white leading-none shadow-lg shadow-danger/30">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
