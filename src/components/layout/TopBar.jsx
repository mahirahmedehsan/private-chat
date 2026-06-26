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
    <header className="h-14 min-h-[56px] bg-dark-100/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-[17px] font-semibold text-text-primary tracking-tight">
          {title || t(`topbar.${activeSection}`) || activeSection}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onSearch && (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder={t('topbar.search')}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="w-44 md:w-60 bg-dark-350/80 border border-border-light rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
            />
          </div>
        )}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-dark-300 transition-all"
          title={t('topbar.notifications')}
        >
          <FiBell className={`h-[18px] w-[18px] ${notificationUnreadCount > 0 ? 'animate-scale-bounce' : ''}`} />
          {notificationUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white leading-none shadow-lg shadow-danger/30">
              {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
            </span>
          )}
        </button>
        {children}
      </div>
    </header>
  )
}
