import { useEffect } from 'react'
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

export default function Notifications() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
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

  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const respondRequest = useMutation({
    mutationFn: ({ requestId, action }) => respondToFriendRequest(requestId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

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
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
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
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/5 to-transparent border border-border-light flex items-center justify-center mx-auto mb-5">
                  <FiMessageSquare className="h-9 w-9 text-accent-light" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">All clear</h3>
                <p className="text-text-muted text-sm mt-1.5">You have no notifications at this time</p>
              </div>
            </motion.div>
          ) : (
            <>
              {notifications.map((notif, i) => {
                const config = typeConfig[notif.type] || typeConfig.system
                const Icon = config.icon
                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card hover padded={false}>
                      <div
                        className={`flex items-start gap-3 p-4 ${
                          !notif.read ? 'border-l-2 border-accent bg-accent-bg/30' : ''
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary">
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
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-dark-400 transition-colors"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </>
  )
}
