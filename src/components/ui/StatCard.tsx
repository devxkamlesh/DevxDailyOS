import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle hover:border-accent-primary/30 transition">
      <div className="text-foreground-muted text-sm mb-2">{label}</div>
      <div className="text-3xl font-semibold flex items-center gap-2">
        {value}
        {Icon && <Icon size={28} className="text-accent-primary" />}
      </div>
    </div>
  )
}
