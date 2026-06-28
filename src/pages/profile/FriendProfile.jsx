import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiFileText, FiHeart, FiUsers, FiGlobe, FiLock, FiMessageCircle, FiMail, FiCalendar, FiMapPin, FiAtSign, FiFlag } from 'react-icons/fi'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getUserProfile } from '../../api/users'
import { createReport } from '../../api/admin'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { addToast } from '../../store/slices/uiSlice'

export default function FriendProfile() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const onlineUsers = useSelector((s) => s.chat.onlineUsers)
  const [activeTab, setActiveTab] = useState('posts')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')

  const reportMutation = useMutation({
    mutationFn: (payload) => createReport(payload),
    onSuccess: () => {
      dispatch(addToast({ type: 'success', title: 'Report submitted' }))
      setShowReportModal(false)
      setReportReason('')
      setReportDesc('')
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to submit report' })),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', uid],
    queryFn: () => getUserProfile(uid),
    enabled: !!uid,
    retry: false,
  })

  if (isLoading) {
    return (
      <>
        <TopBar title="Profile" leftButton={<button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400 transition-colors"><FiArrowLeft className="h-5 w-5" /></button>} />
        <div className="flex-1 overflow-y-auto scrollbar-gutter">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="max-w-lg mx-auto px-4 md:px-8 -mt-12 space-y-6 pb-8">
              <Skeleton className="w-24 h-24 rounded-full mx-auto" />
              <Skeleton className="h-7 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <TopBar title="Profile" leftButton={<button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400 transition-colors"><FiArrowLeft className="h-5 w-5" /></button>} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted text-sm">{error?.response?.data?.error?.message || 'Profile not found'}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-accent-light text-sm hover:underline">Go back</button>
          </div>
        </div>
      </>
    )
  }

  const { user, stats, posts } = data
  const isOnline = onlineUsers[user.uid]?.status === 'online' || user.status === 'online'

  const tabs = [
    { id: 'posts', label: 'Posts', count: posts?.length ?? stats?.postCount ?? 0 },
    { id: 'about', label: 'About' },
  ]

  return (
    <>
      <TopBar
        title={user.displayName || 'Profile'}
        leftButton={
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-400 transition-colors">
            <FiArrowLeft className="h-5 w-5" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto">
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-accent/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.623 0.214 259.8 / 0.12),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.546 0.245 262.9 / 0.06),transparent_60%)]" />
            <div className="absolute top-1/4 -left-16 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative px-4 md:px-8 -mt-14 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-6"
            >
              <div className="relative shrink-0 -ml-1">
                <Avatar src={user.photoURL} name={user.displayName} size="2xl" status={isOnline ? 'online' : 'offline'} className="ring-4 ring-dark-150/80" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="text-xl font-bold text-text-primary truncate">{user.displayName}</h1>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                    aria-label="Report user"
                  >
                    <FiFlag className="h-4 w-4" />
                  </button>
                </div>
                {user.email && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FiAtSign className="h-3 w-3 text-text-muted" />
                    <p className="text-sm text-text-muted">{user.email}</p>
                  </div>
                )}
                {user.bio && (
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap line-clamp-3">{user.bio}</p>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ icon: FiFileText, label: 'Posts', value: stats?.postCount }, { icon: FiUsers, label: 'Friends', value: stats?.friendCount }, { icon: FiHeart, label: 'Likes', value: stats?.totalLikes }].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -2 }}
                  className="bg-dark-100 rounded-xl p-4 text-center hover:border-accent/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-dark-200 flex items-center justify-center mx-auto mb-2">
                    <item.icon className="h-4 w-4 text-accent-light" />
                  </div>
                  <p className="text-xl font-bold text-text-primary">{item.value ?? '-'}</p>
                  <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider">{item.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-1 mb-5 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
                    activeTab === tab.id ? 'text-accent-light' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      activeTab === tab.id ? 'bg-accent-bg text-accent-light' : 'bg-dark-250 text-text-muted'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div layoutId="friend-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'about' ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-dark-100 rounded-xl p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {user.bio && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiFileText className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Bio</p>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">{user.bio}</p>
                        </div>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiMail className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Email</p>
                          <p className="text-sm text-text-primary">{user.email}</p>
                        </div>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiMapPin className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Address</p>
                          <p className="text-sm text-text-primary">{user.address}</p>
                        </div>
                      </div>
                    )}
                    {user.birthday && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiCalendar className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Birthday</p>
                          <p className="text-sm text-text-primary">
                            {new Date(user.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                    {user.gender && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiUsers className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Gender</p>
                          <p className="text-sm text-text-primary capitalize">{user.gender}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                      <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                        <FiCalendar className="h-4 w-4 text-accent-light" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Joined</p>
                        <p className="text-sm font-medium text-text-primary">
                          {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                      <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                        <FiUsers className="h-4 w-4 text-accent-light" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-text-muted">Status</p>
                        <p className="text-sm font-medium text-text-primary capitalize">{isOnline ? 'Online' : 'Offline'}</p>
                      </div>
                    </div>
                    {user.lastSeen && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                          <FiCalendar className="h-4 w-4 text-accent-light" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Last Seen</p>
                          <p className="text-sm text-text-primary">{new Date(user.lastSeen).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {posts?.length > 0 ? (
                    <div className="space-y-3">
                      {posts.map((note) => (
                        <div key={note._id} className="bg-dark-100 border border-dark-400 rounded-xl p-4 hover:border-accent/30 transition-all">
                          <div className="flex items-start gap-3 mb-2">
                            <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">{user.displayName}</span>
                                <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  note.visibility === 'public' ? 'bg-accent-bg text-accent-light' : 'bg-dark-250 text-text-muted'
                                }`}>
                                  {note.visibility === 'public' ? <FiGlobe className="h-2.5 w-2.5" /> : <FiLock className="h-2.5 w-2.5" />}
                                  {note.visibility}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-text-primary whitespace-pre-wrap mb-3 ml-11">{note.content}</p>
                          {note.images?.length > 0 && (
                            <div className={`grid gap-2 mb-3 ml-11 ${note.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {note.images.map((url, i) => (
                                <img key={i} src={url} alt="" loading="lazy" className="w-full rounded-xl object-cover max-h-64 border border-border-light" />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 ml-11 pt-2.5 border-t border-border">
                            <span className="flex items-center gap-1.5 text-xs text-text-muted">
                              <FiHeart className="h-3.5 w-3.5" /> {note.reactionCount || 0}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-text-muted">
                              <FiMessageCircle className="h-3.5 w-3.5" /> {note.commentCount || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-dark-150/20 rounded-2xl border border-dashed border-border-light">
                      <FiFileText className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                      <p className="text-text-muted text-sm">No posts yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportReason(''); setReportDesc('') }}
        title="Report User"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Report <strong className="text-text-primary">{user.displayName}</strong> for violating the community guidelines.
          </p>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Select a reason</option>
              <option value="Harassment">Harassment</option>
              <option value="Spam">Spam</option>
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Fake account">Fake account</option>
              <option value="Hate speech">Hate speech</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Description (optional)</label>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Provide additional details..."
              className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => { setShowReportModal(false); setReportReason(''); setReportDesc('') }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              disabled={!reportReason}
              onClick={() => reportMutation.mutate({ targetType: 'user', targetId: uid, reason: reportReason, description: reportDesc })}
              loading={reportMutation.isPending}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
