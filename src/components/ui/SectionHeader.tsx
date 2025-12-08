import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function SectionHeader({ title, actionLabel, actionHref, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {actionLabel && actionHref && (
        <Link 
          href={actionHref}
          className="text-sm text-accent-primary hover:underline"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="text-sm text-accent-primary hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
