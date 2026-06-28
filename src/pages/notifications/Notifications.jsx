import { useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FiUserPlus,
  FiMessageSquare,
  FiPhone,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiHeart,
  FiMessageCircle,
  FiBell,
  FiClock,
} from 'react-icons/fi'
import { getNotifications, markNotificationsRead } from '../../api/notifications'
import { respondToFriendRequest } from '../../api/friends'
import { getSocket } from '../../config/socket'
import { setNotificationUnreadCount } from '../../store/slices/chatSlice'
import TopBar from '../../components/layout/TopBar'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

const typeConfig = {
  friend_request: { icon: FiUserPlus, color: 'text-accent-light', label: 'Friend Request' },
  friend_accepted: { icon: FiUserPlus, color: 'text-success', label: 'Request Accepted' },
  new_message: { icon: FiMessageSquare, color: 'text-accent-light', label: 'New Message' },
  call: { icon: FiPhone, color: 'text-success', label: 'Call' },
  system: { icon: FiMessageSquare, color: 'text-warning', label: 'System' },
  note_like: { icon: FiHeart, color: 'text-danger', label: 'Note Liked' },
  note_comment: { icon: FiMessageCircle, color: 'text-accent-light', label: 'Note Comment' },
}

function groupNotifications(notifications) {
  const groups = {}
  const now = new Date()
  for (const n of notifications) {
    const d = new Date(n.createdAt)
    const diff = now - d
    const day = d.toDateString()
    let key
    if (diff < 3600000) key = 'recent'
    else if (diff < 86400000) key = 'today'
    else if (diff < 172800000) key = 'yesterday'
    else if (diff < 604800000) key = 'week'
    else key = day
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  }
  return groups
}

const groupLabels = {
  recent: { icon: FiClock, label: 'Recent' },
  today: { icon: FiClock, label: 'Today' },
  yesterday: { icon: FiClock, label: 'Yesterday' },
  week: { icon: FiClock, label: 'This Week' },
}

export default function Notifications() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
  })

  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const respondRequest = useMutation({
    mutationFn: ({ requestId, action }) => respondToFriendRequest(requestId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    dispatch(setNotificationUnreadCount(0))
  }, [dispatch])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    socket.on('notification:new', handler)
    return () => { socket.off('notification:new', handler) }
  }, [queryClient])

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const groups = useMemo(() => groupNotifications(notifications), [notifications])

  const handleMarkAllRead = () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n._id)
    if (ids.length) markRead.mutate({ ids })
  }

  return (
    <>
      <TopBar title="Notifications">
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={FiCheckCircle} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </TopBar>
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-dark-100 rounded-2xl">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center py-24"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-dark-200 border border-dark-400 flex items-center justify-center mx-auto mb-5">
                  <FiBell className="h-9 w-9 text-accent-light" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">All clear</h3>
                <p className="text-text-muted text-sm mt-1.5">You have no notifications at this time</p>
              </div>
            </motion.div>
          ) : (
            Object.entries(groups).map(([groupKey, groupNotifs]) => {
              const groupLabel = groupLabels[groupKey] || { icon: FiClock, label: groupKey }
              const GroupIcon = groupLabel.icon
              return (
                <div key={groupKey}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-6 h-6 rounded-lg bg-dark-200 flex items-center justify-center">
                      <GroupIcon className="h-3 w-3 text-accent-light" />
                    </div>
                    <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">{groupLabel.label}</h2>
                  </div>
                  <div className="space-y-2">
                    {groupNotifs.map((notif, i) => {
                      const config = typeConfig[notif.type] || typeConfig.system
                      const Icon = config.icon
                      return (
                        <motion.div
                          key={notif._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <div className={`rounded-2xl border transition-all duration-200 ${
                            !notif.read ? 'border-accent/30 bg-dark-100' : 'border-dark-400 bg-dark-100'
                          }`}>
                            <div className={`flex items-start gap-3 p-4 ${
                              !notif.read ? 'border-l-[3px] border-accent rounded-l-2xl' : ''
                            }`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                !notif.read
                                  ? 'bg-dark-200'
                                  : 'bg-dark-350/60'
                              }`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                                  {notif.payload?.message || config.label}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                                {notif.type === 'friend_request' && (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      icon={FiCheck}
                                      onClick={() => respondRequest.mutate({ requestId: notif.payload?.requestId, action: 'accept' })}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={FiX}
                                      onClick={() => respondRequest.mutate({ requestId: notif.payload?.requestId, action: 'reject' })}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {!notif.read && (
                                <button
                                  onClick={() => markRead.mutate({ ids: [notif._id] })}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400/60 transition-colors"
                                  aria-label="Mark as read"
                                >
                                  <FiCheck className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
