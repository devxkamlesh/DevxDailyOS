'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SystemLog } from '@/types/database'
import {
  FileText, Search, Filter, RefreshCw, Trash2, AlertCircle,
  Info, AlertTriangle, XCircle, Bug, ChevronDown, X
} from 'lucide-react'

const levelConfig = {
  debug: { label: 'Debug', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Bug },
  info: { label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Info },
  warn: { label: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertTriangle },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  fatal: { label: 'Fatal', color: 'text-red-600', bg: 'bg-red-600/10', icon: AlertCircle }
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const supabase = createClient()

  const fetchLogs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (data) {
      setLogs(data)
      const uniqueCategories = [...new Set(data.map(l => l.category))]
      setCategories(uniqueCategories)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const clearLogs = async (level?: string) => {
    const msg = level ? `Clear all ${level} logs?` : 'Clear ALL logs?'
    if (!confirm(msg)) return
    
    if (level) {
      await supabase.from('system_logs').delete().eq('level', level)
    } else {
      await supabase.from('system_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    fetchLogs()
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory
    return matchesSearch && matchesLevel && matchesCategory
  })

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error' || l.level === 'fatal').length,
    warnings: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">System Logs</h1>
          <p className="text-[var(--foreground-muted)]">Monitor system events and errors</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchLogs()} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--background)] transition">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => clearLogs()} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition">
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total Logs</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Errors</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-yellow-400">{stats.warnings}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Warnings</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border-subtle)]">
          <p className="text-2xl font-bold text-blue-400">{stats.info}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Info</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input type="text" placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg focus:outline-none" />
        </div>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
          <option value="all">All Levels</option>
          {Object.entries(levelConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg">
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--foreground-muted)]">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-[var(--foreground-muted)]">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background)]">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-[var(--foreground-muted)]">Level</th>
                  <th className="text-left p-3 text-sm font-medium text-[var(--foreground-muted)]">Category</th>
                  <th className="text-left p-3 text-sm font-medium text-[var(--foreground-muted)]">Message</th>
                  <th className="text-left p-3 text-sm font-medium text-[var(--foreground-muted)]">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 100).map(log => {
                  const levelCfg = levelConfig[log.level]
                  const LevelIcon = levelCfg.icon
                  return (
                    <tr key={log.id} onClick={() => setSelectedLog(log)} className="border-t border-[var(--border-subtle)] hover:bg-[var(--background)] cursor-pointer">
                      <td className="p-3">
                        <span className={`flex items-center gap-1 text-xs ${levelCfg.color}`}>
                          <LevelIcon size={14} /> {levelCfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{log.category}</td>
                      <td className="p-3 text-sm max-w-md truncate">{log.message}</td>
                      <td className="p-3 text-xs text-[var(--foreground-muted)]">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => { const cfg = levelConfig[selectedLog.level]; const Icon = cfg.icon; return <div className={`p-2 rounded-lg ${cfg.bg}`}><Icon size={20} className={cfg.color} /></div> })()}
                <div>
                  <h2 className="font-bold">{selectedLog.category}</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-[var(--background)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-1">Message</p>
                <p className="bg-[var(--background)] p-4 rounded-lg">{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">Details</p>
                  <pre className="bg-[var(--background)] p-4 rounded-lg text-xs overflow-x-auto">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              )}
              {selectedLog.page_url && (
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">Page URL</p>
                  <p className="text-xs bg-[var(--background)] p-2 rounded font-mono">{selectedLog.page_url}</p>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">User Agent</p>
                  <p className="text-xs bg-[var(--background)] p-2 rounded font-mono break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
