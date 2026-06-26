import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUserPlus,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiX,
  FiSlash,
  FiUsers,
  FiMail,
  FiCalendar,
  FiChevronDown,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi'
import { getFriends, removeFriend, sendFriendRequest, respondToFriendRequest, blockUser, unblockUser, getBlockedList } from '../../api/friends'
import { searchUsers } from '../../api/users'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'

const tabs = [
  { id: 'all', label: 'All Friends', icon: FiUsers },
  { id: 'pending', label: 'Pending', icon: FiClock },
  { id: 'add', label: 'Add Friend', icon: FiUserPlus },
  { id: 'blocked', label: 'Blocked', icon: FiSlash },
]

const blockDurations = [
  { label: '30 min', minutes: 30, description: 'Short break' },
  { label: '1 hour', minutes: 60, description: 'Brief cooldown' },
  { label: '8 hours', minutes: 480, description: 'Work day' },
  { label: '24 hours', minutes: 1440, description: 'Full day' },
  { label: 'Permanent', minutes: null, description: 'Indefinite' },
]

function FriendCard({ friend, onlineUsers, activeTab, onRespond, onRemove, onBlock, onUnblock }) {
  const navigate = useNavigate()
  const [blockOpen, setBlockOpen] = useState(false)
  const blockRef = useRef(null)

  useEffect(() => {
    if (!blockOpen) return
    const handler = (e) => {
      if (blockRef.current && !blockRef.current.contains(e.target)) setBlockOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [blockOpen])

  const status = onlineUsers[friend.uid]?.status || friend.status
  const isOnline = status === 'online'

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const timeLeft = friend.blockedUntil && new Date(friend.blockedUntil) > new Date()
    ? (() => {
        const diff = new Date(friend.blockedUntil) - new Date()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        return `${h}h ${m}m`
      })()
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="group relative flex items-center gap-3 px-4 py-3.5 bg-dark-150 border border-border rounded-xl hover:bg-dark-200 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200 mb-2 card-shadow">
        <button type="button" onClick={() => navigate(`/profile/${friend.uid}`)} className="shrink-0">
          <Avatar src={friend.photoURL} name={friend.displayName} size="md" status={isOnline ? 'online' : undefined} />
        </button>

        <button
          type="button"
          onClick={() => navigate(`/profile/${friend.uid}`)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-light transition-colors">
              {friend.displayName}
            </p>
            {isOnline && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {friend.email && (
              <p className="text-xs text-text-muted truncate">{friend.email}</p>
            )}
            {friend.direction === 'sent' && (
              <span className="flex items-center gap-1 text-[11px] text-warning font-medium">
                <FiClock className="h-3 w-3" />
                Awaiting response
              </span>
            )}
            {friend.direction === 'received' && (
              <span className="flex items-center gap-1 text-[11px] text-accent-light font-medium">
                <FiUserCheck className="h-3 w-3" />
                Respond now
              </span>
            )}
            {timeLeft && (
              <span className="flex items-center gap-1 text-[11px] text-text-muted font-mono">
                <FiClock className="h-3 w-3" />
                {timeLeft} left
              </span>
            )}
            {friend.createdAt && !friend.direction && (
              <span className="text-[11px] text-text-muted">
                Friends since {formatDate(friend.createdAt)}
              </span>
            )}
          </div>
        </button>

        {friend.direction === 'received' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onRespond?.(friend.requestId, 'accept')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
            >
              <FiCheck className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={() => onRespond?.(friend.requestId, 'reject')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted bg-dark-350 hover:bg-dark-450 hover:text-text-primary rounded-lg transition-colors"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {friend.direction === 'sent' && (
          <button
            onClick={() => onRemove?.(friend.uid)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted bg-dark-350 hover:bg-danger-bg hover:text-danger rounded-lg transition-colors shrink-0"
          >
            <FiX className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}

        {activeTab === 'blocked' && (
          <button
            onClick={() => onUnblock?.(friend.uid)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:text-white bg-accent-bg hover:bg-accent rounded-lg transition-colors shrink-0"
          >
            <FiUserCheck className="h-3.5 w-3.5" />
            Unblock
          </button>
        )}

        {activeTab !== 'blocked' && !friend.direction && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onRemove?.(friend.uid)}
              className="p-2 text-text-muted hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
              title="Remove friend"
            >
              <FiUserX className="h-4 w-4" />
            </button>
            <div className="relative" ref={blockRef}>
              <button
                onClick={() => setBlockOpen(!blockOpen)}
                className="p-2 text-text-muted hover:text-warning hover:bg-warning-bg rounded-lg transition-colors"
                title="Block user"
              >
                <FiSlash className="h-4 w-4" />
              </button>
              {blockOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-dark-150 border border-border-light rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3 pb-1.5 mb-1 border-b border-border">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Block duration</p>
                  </div>
                  {blockDurations.map((d) => (
                    <button
                      key={d.label}
                      onClick={() => { onBlock?.(friend.uid, d.minutes); setBlockOpen(false) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-dark-250 transition-colors"
                    >
                      <span>{d.label}</span>
                      <span className="text-[11px] text-text-muted">{d.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!friend.direction && activeTab !== 'blocked' && (
          <div className="flex items-center gap-1 shrink-0 md:hidden group-hover:hidden">
            <button
              onClick={() => onRemove?.(friend.uid)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted bg-dark-350 hover:bg-danger-bg hover:text-danger rounded-lg transition-colors"
            >
              <FiUserX className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setBlockOpen(!blockOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted bg-dark-350 hover:bg-warning-bg hover:text-warning rounded-lg transition-colors"
            >
              <FiSlash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function EmptyState({ activeTab, onAddFriend }) {
  const config = {
    all: {
      icon: FiUsers,
      title: 'No friends yet',
      desc: 'Search for users to add and start connecting',
      action: 'Add Friends',
    },
    pending: {
      icon: FiClock,
      title: 'No pending requests',
      desc: 'Friend requests you send or receive will appear here',
    },
    add: {
      icon: FiUserPlus,
      title: 'Search for people',
      desc: 'Find users by name or email to send a friend request',
    },
    blocked: {
      icon: FiSlash,
      title: 'No blocked users',
      desc: 'Users you block will appear here',
    },
  }

  const c = config[activeTab] || config.all

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-dark-250/50 border border-border-light flex items-center justify-center mb-5">
        <c.icon className="h-7 w-7 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{c.title}</h3>
      <p className="text-sm text-text-muted mt-1.5 max-w-xs text-center">{c.desc}</p>
      {c.action && activeTab !== 'add' && (
        <Button variant="primary" size="sm" className="mt-5" icon={FiUserPlus} onClick={onAddFriend}>
          {c.action}
        </Button>
      )}
    </motion.div>
  )
}

function SearchResult({ user, onSendRequest }) {
  return (
    <motion.button
      key={user.uid}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSendRequest(user.uid)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-250/70 transition-colors group"
    >
      <Avatar src={user.photoURL} name={user.displayName} size="md" />
      <div className="text-left flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <FiMail className="h-3 w-3 text-text-muted shrink-0" />
          <p className="text-xs text-text-muted truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-accent-light group-hover:text-accent transition-colors shrink-0">
        <span className="text-xs font-medium hidden sm:inline">Add Friend</span>
        <FiUserPlus className="h-4 w-4" />
      </div>
    </motion.button>
  )
}

export default function Friends() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const onlineUsers = useSelector((s) => s.chat.onlineUsers)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userSearch), 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends', activeTab],
    queryFn: () => activeTab === 'blocked' ? getBlockedList() : getFriends({ status: activeTab === 'pending' ? 'pending' : 'accepted', limit: 100 }),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  const requestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      setShowAddModal(false)
      setUserSearch('')
      setDebouncedSearch('')
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })

  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }) => respondToFriendRequest(requestId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  const blockMutation = useMutation({
    mutationFn: ({ uid, duration }) => blockUser(uid, duration),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })

  const friends = activeTab === 'pending'
    ? [
        ...(friendsData?.received || []).map((r) => ({ ...r.user, requestId: r._id, direction: 'received', createdAt: r.createdAt })),
        ...(friendsData?.sent || []).map((r) => ({ ...r.user, requestId: r._id, direction: 'sent', createdAt: r.createdAt })),
      ].filter(Boolean)
    : (friendsData?.friends || [])

  const filteredFriends = friends.filter((f) =>
    f.displayName?.toLowerCase().includes(search.toLowerCase())
  )

  const totalCount = activeTab === 'all' ? friends.length : null

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'add') setShowAddModal(true)
  }

  return (
    <>
      <TopBar title="Friends" onSearch={activeTab !== 'add' ? setSearch : undefined} searchValue={search}>
        {activeTab === 'all' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-dark-300 transition-all"
            title="Add Friend"
          >
            <FiUserPlus className="h-5 w-5" />
          </button>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto p-4 md:p-6">

          <div className="flex gap-1 mb-5 p-1 bg-dark-150/70 border border-border rounded-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${isActive
                      ? 'bg-accent text-white shadow-sm shadow-accent/20'
                      : 'text-text-muted hover:text-text-primary'
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {totalCount !== null && filteredFriends.length > 0 && (
            <div className="flex items-center gap-2 px-1 mb-3">
              <FiUsers className="h-3.5 w-3.5 text-text-muted" />
              <p className="text-xs text-text-muted font-medium">
                {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-dark-150 border border-border rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <EmptyState activeTab={activeTab} onAddFriend={() => setShowAddModal(true)} />
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.uid}
                  friend={friend}
                  onlineUsers={onlineUsers}
                  activeTab={activeTab}
                  onRespond={(requestId, action) => respondMutation.mutate({ requestId, action })}
                  onRemove={(uid) => removeMutation.mutate(uid)}
                  onBlock={(uid, duration) => blockMutation.mutate({ uid, duration })}
                  onUnblock={(uid) => unblockMutation.mutate(uid)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setUserSearch(''); setDebouncedSearch('') }} title="Add Friend" size="lg">
        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              autoFocus
              className="w-full bg-dark-350/80 border border-border-light rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
            {debouncedSearch.length >= 2 && Array.isArray(searchResults) ? (
              searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <SearchResult key={u.uid} user={u} onSendRequest={requestMutation.mutate} />
                ))
              ) : (
                <div className="flex flex-col items-center py-10">
                  <FiAlertCircle className="h-8 w-8 text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">No users found</p>
                  <p className="text-xs text-text-muted mt-0.5">Try a different name or email</p>
                </div>
              )
            ) : debouncedSearch.length < 2 ? (
              <div className="flex flex-col items-center py-10">
                <FiSearch className="h-8 w-8 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">Type at least 2 characters to search</p>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  )
}
