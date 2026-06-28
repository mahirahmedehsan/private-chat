export function Skeleton({ className = '' }) {
  return <div className={`shimmer-bg rounded-xl ${className}`} />
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-2">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function NoteSkeleton() {
  return (
    <div className="bg-dark-200/70 border border-border rounded-2xl p-4 space-y-3 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-12 rounded-lg" />
        <Skeleton className="h-6 w-12 rounded-lg" />
      </div>
    </div>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-44" />
      </div>
    </div>
  )
}
