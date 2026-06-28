import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiFileText, FiTrash2, FiHeart, FiMessageCircle, FiGlobe, FiLock, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAdminNotes, adminDeleteNote } from '../../api/admin'
import TopBar from '../../components/layout/TopBar'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { addToast } from '../../store/slices/uiSlice'
import { useDispatch } from 'react-redux'

export default function AdminNotes() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchAuthor, setSearchAuthor] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notes', page, searchAuthor],
    queryFn: () => getAdminNotes({ page, author: searchAuthor || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: adminDeleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes'] })
      dispatch(addToast({ type: 'success', title: 'Post deleted' }))
    },
    onError: () => dispatch(addToast({ type: 'error', title: 'Failed to delete post' })),
  })

  return (
    <>
      <TopBar title="Moderate Posts" />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchAuthor}
              onChange={(e) => { setSearchAuthor(e.target.value); setPage(1) }}
              placeholder="Filter by author UID..."
              className="w-full bg-dark-350/80 border border-border-light rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                  <div className="h-24 bg-dark-300 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.notes?.map((note, i) => (
                <motion.div
                  key={note._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-4 card-shadow"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar src={note.authorData?.photoURL} name={note.authorData?.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{note.authorData?.displayName || note.author}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          note.visibility === 'public' ? 'bg-accent-bg text-accent-light' : 'bg-dark-250 text-text-muted'
                        }`}>
                          {note.visibility === 'public' ? <FiGlobe className="h-2.5 w-2.5" /> : <FiLock className="h-2.5 w-2.5" />}
                          {note.visibility}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="danger"
                      icon={FiTrash2}
                      onClick={() => { if (window.confirm('Delete this post?')) deleteMutation.mutate(note._id) }}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="text-sm text-text-primary whitespace-pre-wrap mb-3 ml-11">{note.content}</p>
                  {note.images?.length > 0 && (
                    <div className={`grid gap-2 mb-3 ml-11 ${note.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {note.images.map((url, i) => (
                        <img key={i} src={url} alt="" loading="lazy" className="w-full rounded-xl object-cover max-h-48 border border-border-light" />
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
                    <span className="text-xs text-text-muted ml-auto">UID: {note.author}</span>
                  </div>
                </motion.div>
              ))}
              {data?.notes?.length === 0 && (
                <div className="text-center py-16">
                  <FiFileText className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No posts found</p>
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
