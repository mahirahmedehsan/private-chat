import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiMessageSquare, FiChevronLeft } from 'react-icons/fi'
import { getAdminHelpConversations } from '../../api/helpLine'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import HelpLineChat from '../../components/chat/HelpLineChat'

export default function AdminHelpLine() {
  const [selectedUser, setSelectedUser] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'help-line', 'conversations'],
    queryFn: getAdminHelpConversations,
    refetchInterval: 10000,
  })

  const conversations = data?.conversations || []

  return (
    <>
      <TopBar title="Help Line" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 min-w-[200px] border-r border-dark-400 flex flex-col overflow-hidden hide-mobile">
          <div className="p-3 border-b border-dark-400">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-dark-200 border border-dark-400 flex items-center justify-center mb-3">
                  <FiMessageSquare className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-muted">No help conversations yet</p>
                <p className="text-xs text-text-muted mt-1">Users will appear here when they send a help message</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                    selectedUser?.userId === conv.userId
                      ? 'bg-accent-bg border-l-2 border-accent'
                      : 'hover:bg-dark-150 border-l-2 border-transparent'
                  }`}
                >
                  <Avatar src={conv.user?.photoURL} name={conv.user?.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {conv.user?.displayName || conv.userId}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {conv.lastMessage?.text?.slice(0, 50) || 'No messages'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="px-4 py-3 border-b border-dark-400 bg-dark-100 flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-350/60 transition-all show-desktop">
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <Avatar src={selectedUser.user?.photoURL} name={selectedUser.user?.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {selectedUser.user?.displayName || selectedUser.userId}
                  </p>
                  <p className="text-xs text-text-muted truncate">{selectedUser.user?.email || ''}</p>
                </div>
                <span className="ml-auto text-[10px] font-medium px-2 py-1 rounded bg-accent-bg text-accent-light">Help Line</span>
              </div>
              <div className="flex-1">
                <HelpLineChat userId={selectedUser.userId} isAdmin userName={selectedUser.user?.displayName} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-dark-200 border border-dark-400 flex items-center justify-center mx-auto mb-5">
                  <FiMessageSquare className="h-9 w-9 text-accent-light" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Help Line</h3>
                <p className="text-text-muted text-sm mt-1.5 max-w-xs">
                  Select a conversation on the left to respond to a user
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
