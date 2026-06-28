import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiUsers, FiFileText, FiMessageSquare, FiAlertTriangle, FiXCircle, FiGlobe, FiShield } from 'react-icons/fi'
import { getAdminStats } from '../../api/admin'
import TopBar from '../../components/layout/TopBar'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  })

  const cards = [
    { icon: FiUsers, label: 'Total Users', value: stats?.totalUsers, color: 'bg-dark-200 text-accent-light' },
    { icon: FiGlobe, label: 'Online', value: stats?.onlineUsers, color: 'bg-dark-200 text-success' },
    { icon: FiFileText, label: 'Total Posts', value: stats?.totalNotes, color: 'bg-dark-200 text-accent-light' },
    { icon: FiMessageSquare, label: 'Total Messages', value: stats?.totalMessages, color: 'bg-dark-200 text-accent-light' },
    { icon: FiAlertTriangle, label: 'Pending Reports', value: stats?.pendingReports, color: 'bg-dark-200 text-warning' },
    { icon: FiXCircle, label: 'Banned Users', value: stats?.bannedUsers, color: 'bg-dark-200 text-danger' },
  ]

  return (
    <>
      <TopBar title="Admin Dashboard" />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-dark-200 flex items-center justify-center">
              <FiShield className="h-5 w-5 text-accent-light" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Admin Dashboard</h1>
              <p className="text-sm text-text-muted">Platform overview and moderation controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-dark-100 rounded-2xl p-5"
              >
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {isLoading ? '...' : (card.value ?? 0)}
                </p>
                <p className="text-sm text-text-muted mt-1">{card.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-dark-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Manage Users', path: '/admin/users', icon: FiUsers },
                { label: 'Moderate Posts', path: '/admin/notes', icon: FiFileText },
                { label: 'View Reports', path: '/admin/reports', icon: FiAlertTriangle },
                { label: 'Chat as Admin', path: '/admin/chat', icon: FiMessageSquare },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-200/60 hover:bg-dark-350/60 border border-border-light hover:border-accent/20 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center">
                    <action.icon className="h-4 w-4 text-accent-light" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
