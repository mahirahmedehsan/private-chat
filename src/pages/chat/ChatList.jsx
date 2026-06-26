import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiSearch, FiUsers, FiSlash } from 'react-icons/fi'
import { getFriends, unblockUser, getBlockedList } from '../../api/friends'
import { setConversations, setActiveConversation } from '../../store/slices/chatSlice'
import ConversationItem from '../../components/chat/ConversationItem'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { ConversationSkeleton } from '../../components/ui/Skeleton'
import { searchUsers } from '../../api/users'
import { sendFriendRequest } from '../../api/friends'

export default function ChatList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { conversations, activeConversation } = useSelector((s) => s.chat)
  const { user } = useSelector((s) => s.auth)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userSearch), 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends', 'accepted'],
    queryFn: () => getFriends({ status: 'accepted', limit: 100 }),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })

  const { data: blockedData, refetch: refetchBlocked } = useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: () => getBlockedList(),
    enabled: showBlocked,
  })

  useEffect(() => {
    if (friendsData?.friends) {
      const friendIds = new Set(friendsData.friends.map((f) => f.uid))
      const convs = friendsData.friends.map((f) => {
        const id = [user?.uid, f.uid].sort().join(':')
        const existing = conversations.find((c) => c.id === id)
        return existing || {
          id,
          user: f,
          lastMessage: null,
          unreadCount: 0,
          status: f.status,
          lastActivity: null,
        }
      })
      const preserved = conversations.filter((c) => {
        const otherUid = c.id.replace(`${user?.uid}:`, '').replace(`:${user?.uid}`, '')
        return otherUid && !friendIds.has(otherUid)
      })
      dispatch(setConversations([...convs, ...preserved]))
    }
  }, [friendsData])

  const filteredConvs = [...conversations]
    .filter((c) =>
      c.user?.displayName?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aTime = new Date(a.lastActivity || 0).getTime()
      const bTime = new Date(b.lastActivity || 0).getTime()
      return bTime - aTime
    })

  return (
    <>
      <TopBar title="Chats" onSearch={setSearch} searchValue={search}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewChat(true)}
          className="!rounded-xl"
        >
          <FiPlus className="h-5 w-5" />
        </Button>
      </TopBar>

      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        {isLoading ? (
          <div className="py-2 space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : filteredConvs.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 w-full max-w-sm"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/5 to-transparent border border-border-light flex items-center justify-center mx-auto mb-5">
                <FiUsers className="h-8 w-8 text-accent-light" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1.5">
                {search ? 'No results found' : 'No conversations yet'}
              </h3>
              <p className="text-text-secondary text-sm max-w-xs mx-auto">
                {search
                  ? `No conversations match "${search}"`
                  : 'Add friends to start chatting with them here'
                }
              </p>
              {!search && (
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                  New Conversation
                </button>
              )}
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredConvs.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ConversationItem
                  conversation={conv}
                  isActive={activeConversation?.id === conv.id}
                  onClick={() => {
                    dispatch(setActiveConversation(conv))
                    navigate(`/chat/${conv.id}`)
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {filteredConvs.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={() => setShowBlocked(true)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <FiSlash className="h-4 w-4" />
            Blocked users
          </button>
        </div>
      )}

      <Modal
        isOpen={showBlocked}
        onClose={() => setShowBlocked(false)}
        title="Blocked Users"
      >
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {blockedData?.friends?.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-dark-250/60 flex items-center justify-center mx-auto mb-3">
                <FiSlash className="h-6 w-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">No blocked users</p>
            </div>
          )}
          {(blockedData?.friends || []).map((u) => (
            <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-250/50 transition-colors">
              <button type="button" onClick={() => navigate(`/profile/${u.uid}`)}>
                <Avatar src={u.photoURL} name={u.displayName} size="md" />
              </button>
              <button type="button" onClick={() => navigate(`/profile/${u.uid}`)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-text-primary">{u.displayName}</p>
                <p className="text-xs text-text-muted truncate">{u.email}</p>
                {u.blockedUntil && new Date(u.blockedUntil) > new Date() && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {(() => {
                      const diff = new Date(u.blockedUntil) - new Date()
                      const h = Math.floor(diff / 3600000)
                      const m = Math.floor((diff % 3600000) / 60000)
                      return `${h > 0 ? `${h}h ` : ''}${m}m remaining`
                    })()}
                  </p>
                )}
              </button>
              <button
                onClick={async () => {
                  try {
                    await unblockUser(u.uid)
                    refetchBlocked()
                  } catch {}
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors shrink-0"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showNewChat}
        onClose={() => { setShowNewChat(false); setUserSearch('') }}
        title="New Conversation"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            icon={FiSearch}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {(searchResults || [])?.map((u) => (
              <motion.button
                key={u.uid}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await sendFriendRequest(u.uid)
                    setShowNewChat(false)
                    setUserSearch('')
                  } catch {}
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-250/50 transition-colors"
              >
                <Avatar src={u.photoURL} name={u.displayName} size="md" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">{u.displayName}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </div>
              </motion.button>
            ))}
            {debouncedSearch.length >= 2 && Array.isArray(searchResults) && searchResults.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">No users found</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
