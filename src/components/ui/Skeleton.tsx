'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface rounded-lg ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border-subtle">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface p-5 rounded-2xl border border-border-subtle">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-16 h-8" />
          </div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonGraph() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonKanban() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-6" />
          </div>
          <div className="min-h-[400px] bg-surface/50 rounded-xl p-3 border-2 border-dashed border-border-subtle space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-surface p-4 rounded-lg border border-border-subtle">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-3" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonCalendar() {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTemplates() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2 mb-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
