import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiShield, FiUser, FiXCircle, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiMail, FiCalendar } from 'react-icons/fi'
import { getAdminUsers, updateUserRole, toggleBanUser } from '../../api/admin'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { addToast } from '../../store/slices/uiSlice'
import { useDispatch } from 'react-redux'

export default function AdminUsers() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, filterRole],
    queryFn: () => getAdminUsers({ page, search: search || undefined, role: filterRole || undefined }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }) => updateUserRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      dispatch(addToast({ type: 'success', title: 'Role updated' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to update role' })),
  })

  const banMutation = useMutation({
    mutationFn: (uid) => toggleBanUser(uid),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      dispatch(addToast({ type: 'success', title: data.user?.banned ? 'User banned' : 'User unbanned' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to toggle ban' })),
  })

  return (
    <>
      <TopBar title="Manage Users" />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name, email, or UID..."
                className="w-full bg-dark-350/80 border border-border-light rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex items-center gap-1 bg-dark-400/60 rounded-lg p-0.5">
              {['', 'user', 'admin'].map((r) => (
                <button
                  key={r || 'all'}
                  onClick={() => { setFilterRole(r); setPage(1) }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterRole === r ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {r ? (r === 'admin' ? 'Admins' : 'Users') : 'All'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-dark-100 rounded-xl p-4 animate-pulse">
                  <div className="h-12 bg-dark-300 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.users?.map((user, i) => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-dark-100 rounded-xl p-4 ${user.banned ? 'border-danger/20' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar src={user.photoURL} name={user.displayName} size="md" status={user.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary truncate">{user.displayName}</span>
                        {user.role === 'admin' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-bg text-accent-light">
                            <FiShield className="h-2.5 w-2.5" /> Admin
                          </span>
                        )}
                        {user.banned && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-danger/10 text-danger">
                            <FiXCircle className="h-2.5 w-2.5" /> Banned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <FiMail className="h-3 w-3" /> {user.email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <FiCalendar className="h-3 w-3" /> {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user.role !== 'admin' && (
                        <Button
                          size="xs"
                          variant={user.banned ? 'ghost' : 'danger'}
                          icon={user.banned ? FiCheck : FiXCircle}
                          onClick={() => banMutation.mutate(user.uid)}
                          loading={banMutation.isPending}
                        >
                          {user.banned ? 'Unban' : 'Ban'}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant={user.role === 'admin' ? 'secondary' : 'primary'}
                        icon={user.role === 'admin' ? FiUser : FiShield}
                        onClick={() => roleMutation.mutate({ uid: user.uid, role: user.role === 'admin' ? 'user' : 'admin' })}
                        loading={roleMutation.isPending}
                      >
                        {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {data?.users?.length === 0 && (
                <div className="text-center py-16">
                  <FiUser className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No users found</p>
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
              <span className="text-sm text-text-muted">
                Page {data?.page || page} of {data?.totalPages || 1}
              </span>
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
