import { FiSearch, FiBell } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../locales/i18n.jsx'

export default function TopBar({ title, onSearch, searchValue, children }) {
  const t = useT()
  const navigate = useNavigate()
  const { activeSection } = useSelector((s) => s.ui)
  const { notificationUnreadCount } = useSelector((s) => s.chat)

  return (
    <header className="h-14 min-h-[56px] bg-dark-100/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
      <h1 className="text-[17px] font-bold text-text-primary tracking-tight">
        {title || t(`topbar.${activeSection}`) || activeSection}
      </h1>
      <div className="flex items-center gap-2">
        {onSearch && (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder={t('topbar.search')}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="w-40 md:w-56 bg-dark-300 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all"
            />
          </div>
        )}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-dark-200 transition-all"
        >
          <FiBell className={`h-[18px] w-[18px] ${notificationUnreadCount > 0 ? 'animate-scale-bounce' : ''}`} />
          {notificationUnreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white shadow-lg">
              {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
            </span>
          )}
        </button>
        {children}
      </div>
    </header>
  )
}
