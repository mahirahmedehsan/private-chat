import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiAlertTriangle, FiCheck, FiX, FiUser, FiFileText, FiMessageSquare, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAdminReports, resolveReport } from '../../api/admin'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { addToast } from '../../store/slices/uiSlice'
import { useDispatch } from 'react-redux'

const typeConfig = {
  user: { icon: FiUser, label: 'User' },
  note: { icon: FiFileText, label: 'Post' },
  message: { icon: FiMessageSquare, label: 'Message' },
}

export default function AdminReports() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', page, filterStatus],
    queryFn: () => getAdminReports({ page, status: filterStatus || undefined }),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, action }) => resolveReport(id, status, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      dispatch(addToast({ type: 'success', title: 'Report resolved' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to resolve report' })),
  })

  return (
    <>
      <TopBar title="Reports" />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-1 bg-dark-400/60 rounded-lg p-0.5 w-fit">
            {[
              { key: '', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'dismissed', label: 'Dismissed' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setFilterStatus(t.key); setPage(1) }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filterStatus === t.key ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                  <div className="h-20 bg-dark-300 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.reports?.map((report, i) => {
                const config = typeConfig[report.targetType] || { icon: FiAlertTriangle, label: report.targetType }
                const Icon = config.icon
                return (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`glass-card rounded-2xl p-4 card-shadow border-l-[3px] ${
                      report.status === 'pending' ? 'border-warning' :
                      report.status === 'resolved' ? 'border-success' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning/15 to-warning/5 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-text-primary">{report.reason}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            report.status === 'pending' ? 'bg-warning/15 text-warning' :
                            report.status === 'resolved' ? 'bg-success/15 text-success' : 'bg-dark-250 text-text-muted'
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <FiClock className="h-2.5 w-2.5" />
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-text-secondary mt-1">{report.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span>Reported by: {report.reporter?.displayName || report.reporterId}</span>
                          <span>Target: {report.targetType} ({report.targetId.slice(0, 16)}...)</span>
                        </div>
                        {report.action && (
                          <p className="text-xs text-text-muted mt-1">Action taken: {report.action}</p>
                        )}
                        {report.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="xs"
                              icon={FiCheck}
                              onClick={() => resolveMutation.mutate({ id: report._id, status: 'resolved', action: 'Reviewed and resolved' })}
                              loading={resolveMutation.isPending}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="xs"
                              variant="secondary"
                              icon={FiX}
                              onClick={() => resolveMutation.mutate({ id: report._id, status: 'dismissed' })}
                              loading={resolveMutation.isPending}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {data?.reports?.length === 0 && (
                <div className="text-center py-16">
                  <FiAlertTriangle className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No reports found</p>
                </div>
              )}
            </div>
          )}

          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350/60 disabled:opacity-40 transition-all"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-text-muted">Page {data?.page || page} of {data?.totalPages || 1}</span>
              <button
                onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
                disabled={page >= (data?.totalPages || 1)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350/60 disabled:opacity-40 transition-all"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
