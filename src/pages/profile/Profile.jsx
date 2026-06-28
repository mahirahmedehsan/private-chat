import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCamera, FiEdit2, FiCheck, FiX, FiLoader, FiFileText, FiHeart, FiUsers, FiGlobe, FiLock, FiMessageCircle, FiEye, FiCalendar, FiMail, FiMapPin, FiTrash2, FiMoreVertical, FiUser, FiAtSign } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe, updateProfile, getProfileStats } from '../../api/users'
import { getMyNotes, updateNote, deleteNote, createNote } from '../../api/notes'
import { uploadFile } from '../../api/upload'
import { setUser } from '../../store/slices/authSlice'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { addToast } from '../../store/slices/uiSlice'

export default function Profile() {
  const dispatch = useDispatch()
  const authUser = useSelector((s) => s.auth.user)
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ displayName: '', bio: '', address: '', birthday: '', gender: '' })
  const [uploadingPic, setUploadingPic] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [editNoteVisibility, setEditNoteVisibility] = useState('public')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.note-menu')) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMe,
  })

  const { data: stats } = useQuery({
    queryKey: ['users', 'me', 'stats'],
    queryFn: getProfileStats,
  })

  const { data: myNotesData } = useQuery({
    queryKey: ['notes', 'my'],
    queryFn: () => getMyNotes({ page: 1, limit: 50 }),
  })

  const user = profile || authUser

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        address: user.address || '',
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        gender: user.gender || '',
      })
    }
  }, [user?.displayName, user?.bio, user?.address, user?.birthday, user?.gender])

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      dispatch(setUser(data.user || data))
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      setEditing(false)
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'my'] })
      dispatch(addToast({ type: 'success', title: 'Post deleted' }))
    },
    onError: () => {
      dispatch(addToast({ type: 'error', title: 'Failed to delete post' }))
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, ...payload }) => updateNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'my'] })
      setEditingNoteId(null)
      dispatch(addToast({ type: 'success', title: 'Post updated' }))
    },
    onError: () => {
      dispatch(addToast({ type: 'error', title: 'Failed to update post' }))
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      displayName: form.displayName,
      bio: form.bio,
      address: form.address,
      birthday: form.birthday || undefined,
      gender: form.gender,
    })
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPic(true)
    try {
      const { url } = await uploadFile(file)
      await updateMutation.mutateAsync({ photoURL: url })
      await createNote({
        content: 'Updated their profile picture',
        images: [url],
        visibility: 'public',
      }).catch(() => {})
      dispatch(addToast({ type: 'success', title: 'Profile picture updated' }))
    } catch {
      dispatch(addToast({ type: 'error', title: 'Failed to upload picture' }))
    } finally {
      setUploadingPic(false)
    }
  }

  if (isLoading && !user) {
    return (
      <>
        <TopBar title="Profile" />
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

  function VisLabel({ value }) {
    const colors = {
      public: 'bg-accent-bg text-accent-light',
      friends: 'bg-warning/15 text-warning',
      only_me: 'bg-danger/10 text-danger',
    }
    const labels = { public: 'Public', friends: 'Friends', only_me: 'Only Me' }
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[value] || 'bg-dark-250 text-text-muted'}`}>
        {labels[value] || value}
      </span>
    )
  }

  const tabs = [
    { id: 'posts', label: 'Posts', count: stats?.postCount ?? myNotesData?.notes?.length ?? 0 },
    { id: 'about', label: 'About' },
  ]

  return (
    <>
      <TopBar title="Profile" />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto">
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-accent/15 via-blue-500/8 to-dark-150" />
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
                <Avatar src={user?.photoURL} name={user?.displayName} size="2xl" status="online" className="ring-4 ring-dark-150/80" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPic}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light text-white flex items-center justify-center hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
                >
                  {uploadingPic ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiCamera className="h-3.5 w-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-text-primary truncate">{user?.displayName}</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FiAtSign className="h-3 w-3 text-text-muted" />
                      <p className="text-sm text-text-muted">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={editing ? FiX : FiEdit2}
                    onClick={() => setEditing(!editing)}
                    className="shrink-0"
                  />
                </div>
                {user?.bio && !editing && (
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap line-clamp-3">{user.bio}</p>
                )}
              </div>
            </motion.div>

            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 glass-card rounded-2xl p-5 card-shadow"
              >
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Edit Profile</h3>
                <div className="space-y-4">
                  <Input
                    label="Display Name"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  />
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      maxLength={500}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                    />
                    <p className="text-[10px] text-text-muted text-right mt-1">{form.bio.length}/500</p>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Address</label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Your address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted block mb-1.5">Birthday</label>
                      <Input
                        type="date"
                        value={form.birthday}
                        onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1.5">Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSave} size="sm" loading={updateMutation.isPending} icon={FiCheck}>
                      Save Changes
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setForm({ displayName: user?.displayName, bio: user?.bio || '', address: user?.address || '', birthday: user?.birthday ? user.birthday.split('T')[0] : '', gender: user?.gender || '' }) }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ icon: FiFileText, label: 'Posts', value: stats?.postCount }, { icon: FiUsers, label: 'Friends', value: stats?.friendCount }, { icon: FiHeart, label: 'Likes', value: stats?.totalLikes }].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -2 }}
                  className="glass-card rounded-xl p-4 text-center hover:border-accent/20 transition-all card-shadow"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-2">
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
                    activeTab === tab.id
                      ? 'text-accent-light'
                      : 'text-text-muted hover:text-text-primary'
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
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent-light rounded-full"
                    />
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
                  className="glass-card rounded-2xl p-5 card-shadow space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                        <FiMail className="h-4 w-4 text-accent-light" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-text-muted">Email</p>
                          <VisLabel value={user?.emailVisibility} />
                        </div>
                        <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                      </div>
                    </div>
                    {user?.address && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                          <FiMapPin className="h-4 w-4 text-accent-light" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-text-muted">Address</p>
                            <VisLabel value={user.addressVisibility} />
                          </div>
                          <p className="text-sm font-medium text-text-primary">{user.address}</p>
                        </div>
                      </div>
                    )}
                    {user?.birthday && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                          <FiCalendar className="h-4 w-4 text-accent-light" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-text-muted">Birthday</p>
                            <VisLabel value={user.birthdayVisibility} />
                          </div>
                          <p className="text-sm font-medium text-text-primary">
                            {new Date(user.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                    {user?.gender && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                          <FiUsers className="h-4 w-4 text-accent-light" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-text-muted">Gender</p>
                            <VisLabel value={user.genderVisibility} />
                          </div>
                          <p className="text-sm font-medium text-text-primary capitalize">{user.gender}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                        <FiCalendar className="h-4 w-4 text-accent-light" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Joined</p>
                        <p className="text-sm font-medium text-text-primary">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-200/60 rounded-xl border border-border-light">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
                        <FiEye className="h-4 w-4 text-accent-light" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-text-muted">Profile Privacy</p>
                        <p className="text-sm font-medium text-text-primary capitalize">{user?.profilePrivacy || 'public'}</p>
                      </div>
                      <button
                        onClick={() => updateMutation.mutate({ profilePrivacy: user?.profilePrivacy === 'public' ? 'friends' : 'public' })}
                        disabled={updateMutation.isPending}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          user?.profilePrivacy === 'friends'
                            ? 'bg-accent-bg text-accent-light'
                            : 'bg-dark-250 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {user?.profilePrivacy === 'friends' ? 'Friends only' : 'Public'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {myNotesData?.notes?.length > 0 ? (
                    <div className="space-y-3">
                      {myNotesData.notes.map((note) => (
                        <div key={note._id} className="glass-card rounded-2xl p-4 hover:border-border transition-all card-shadow">
                          <div className="flex items-start gap-3 mb-2">
                            <Avatar src={user?.photoURL} name={user?.displayName} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">{user?.displayName}</span>
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
                            <div className="relative note-menu">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === note._id ? null : note._id)}
                                className="p-1.5 rounded-lg hover:bg-dark-250 text-text-muted hover:text-text-primary transition-colors"
                              >
                                <FiMoreVertical className="h-4 w-4" />
                              </button>
                              {menuOpenId === note._id && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-dark-200 border border-border rounded-xl p-1.5 shadow-2xl min-w-[130px] backdrop-blur-md">
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(note._id)
                                      setEditNoteContent(note.content)
                                      setEditNoteVisibility(note.visibility)
                                      setMenuOpenId(null)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-dark-350 rounded-lg transition-colors"
                                  >
                                    <FiEdit2 className="h-3.5 w-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null)
                                      if (window.confirm('Delete this post?')) {
                                        deleteNoteMutation.mutate(note._id)
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {editingNoteId === note._id ? (
                            <div className="ml-11 mb-3 space-y-3">
                              <textarea
                                value={editNoteContent}
                                onChange={(e) => setEditNoteContent(e.target.value)}
                                maxLength={2000}
                                rows={3}
                                className="w-full bg-dark-350/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                              />
                              <div className="flex items-center gap-3">
                                <select
                                  value={editNoteVisibility}
                                  onChange={(e) => setEditNoteVisibility(e.target.value)}
                                  className="bg-dark-350 border border-border-light rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                >
                                  <option value="public">Public</option>
                                  <option value="friends">Friends</option>
                                </select>
                                <div className="flex gap-1.5 ml-auto">
                                  <Button
                                    size="xs"
                                    icon={FiCheck}
                                    onClick={() => updateNoteMutation.mutate({ id: note._id, content: editNoteContent, visibility: editNoteVisibility })}
                                    loading={updateNoteMutation.isPending}
                                  >
                                    Save
                                  </Button>
                                  <Button size="xs" variant="secondary" icon={FiX} onClick={() => setEditingNoteId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-text-primary whitespace-pre-wrap mb-3 ml-11">{note.content}</p>
                          )}
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
    </>
  )
}
