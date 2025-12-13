'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CreditCard, Search, Filter, Download, Eye, 
  CheckCircle2, XCircle, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, Calendar, DollarSign,
  Users, TrendingUp, Coins, Package
} from 'lucide-react'

interface Transaction {
  id: string
  payment_id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  package_id?: string
  coins_purchased?: number
  bonus_coins?: number
  created_at: string
  user?: {
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface PaymentOrder {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: 'created' | 'paid' | 'failed' | 'refunded'
  payment_id?: string
  receipt?: string
  notes?: any
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface Stats {
  totalTransactions: number
  totalRevenue: number
  successfulTransactions: number
  failedTransactions: number
  pendingTransactions: number
  refundedTransactions: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'transactions' | 'orders'>('transactions')
  const [stats, setStats] = useState<Stats>({
    totalTransactions: 0,
    totalRevenue: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0
  })
  
  const pageSize = 20
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [page, search, statusFilter, dateFilter, activeTab])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: transactionData } = await supabase
        .from('payment_transactions')
        .select('amount, status')

      const { data: orderData } = await supabase
        .from('payment_orders')
        .select('amount, status')

      if (transactionData) {
        const totalTransactions = transactionData.length
        const totalRevenue = transactionData
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0) / 100

        const successfulTransactions = transactionData.filter(t => t.status === 'completed').length
        const failedTransactions = transactionData.filter(t => t.status === 'failed').length
        const pendingTransactions = transactionData.filter(t => t.status === 'pending').length
        const refundedTransactions = transactionData.filter(t => t.status === 'refunded').length

        setStats({
          totalTransactions,
          totalRevenue,
          successfulTransactions,
          failedTransactions,
          pendingTransactions,
          refundedTransactions
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'transactions') {
        await fetchTransactions()
      } else {
        await fetchOrders()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        profiles!payment_transactions_user_id_fkey (
          full_name,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply filters
    if (search) {
      query = query.or(`payment_id.ilike.%${search}%,order_id.ilike.%${search}%`)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      if (dateFilter !== 'all') {
        query = query.gte('created_at', startDate.toISOString())
      }
    }

    const { data, count, error } = await query

    if (error) throw error

    setTransactions(data?.map(item => ({
      ...item,
      user: item.profiles
    })) || [])
    setTotalCount(count || 0)
  }

  const fetchOrders = async () => {
    let query = supabase
      .from('payment_orders')
      .select(`
        *,
        profiles!payment_orders_user_id_fkey (
          full_name,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply filters
    if (search) {
      query = query.or(`order_id.ilike.%${search}%,payment_id.ilike.%${search}%`)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      if (dateFilter !== 'all') {
        query = query.gte('created_at', startDate.toISOString())
      }
    }

    const { data, count, error } = await query

    if (error) throw error

    setOrders(data?.map(item => ({
      ...item,
      user: item.profiles
    })) || [])
    setTotalCount(count || 0)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle2 size={16} className="text-green-400" />
      case 'failed':
        return <XCircle size={16} className="text-red-400" />
      case 'pending':
      case 'created':
        return <RefreshCw size={16} className="text-yellow-400" />
      case 'refunded':
        return <AlertCircle size={16} className="text-orange-400" />
      default:
        return <AlertCircle size={16} className="text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-500/20 text-green-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'pending':
      case 'created':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'refunded':
        return 'bg-orange-500/20 text-orange-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const exportData = () => {
    const dataToExport = activeTab === 'transactions' ? transactions : orders
    const csvContent = [
      // Header
      activeTab === 'transactions' 
        ? ['ID', 'Payment ID', 'Order ID', 'User', 'Amount', 'Coins', 'Status', 'Date'].join(',')
        : ['ID', 'Order ID', 'Payment ID', 'User', 'Amount', 'Status', 'Date'].join(','),
      // Data
      ...dataToExport.map(item => {
        if (activeTab === 'transactions') {
          const t = item as Transaction
          return [
            t.id,
            t.payment_id,
            t.order_id,
            t.user?.full_name || t.user?.username || 'Unknown',
            `₹${(t.amount / 100).toFixed(2)}`,
            t.coins_purchased || 0,
            t.status,
            new Date(t.created_at).toLocaleDateString()
          ].join(',')
        } else {
          const o = item as PaymentOrder
          return [
            o.id,
            o.order_id,
            o.payment_id || '',
            o.user?.full_name || o.user?.username || 'Unknown',
            `₹${(o.amount / 100).toFixed(2)}`,
            o.status,
            new Date(o.created_at).toLocaleDateString()
          ].join(',')
        }
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="text-blue-400" />
            Transaction Management
          </h1>
          <p className="text-foreground-muted">Monitor all payment transactions and orders</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CreditCard size={20} className="text-blue-400" />
            </div>
            <span className="text-foreground-muted">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <span className="text-foreground-muted">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <span className="text-foreground-muted">Successful</span>
          </div>
          <p className="text-2xl font-bold">{stats.successfulTransactions}</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle size={20} className="text-red-400" />
            </div>
            <span className="text-foreground-muted">Failed</span>
          </div>
          <p className="text-2xl font-bold">{stats.failedTransactions}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-background p-1 rounded-xl">
        <button
          onClick={() => { setActiveTab('transactions'); setPage(1) }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'transactions'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => { setActiveTab('orders'); setPage(1) }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'orders'
              ? 'bg-accent-primary text-white'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Payment Orders
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder={`Search by ${activeTab === 'transactions' ? 'payment' : 'order'} ID...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="created">Created</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                {activeTab === 'transactions' ? (
                  <>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Payment ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Coins</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Date</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Order ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Payment ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-muted">Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-10 bg-background rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (activeTab === 'transactions' ? transactions : orders).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground-muted">
                    No {activeTab} found
                  </td>
                </tr>
              ) : (
                (activeTab === 'transactions' ? transactions : orders).map((item) => (
                  <tr key={item.id} className="hover:bg-background/50 transition">
                    {activeTab === 'transactions' ? (
                      <>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{(item as Transaction).payment_id}</p>
                            <p className="text-sm text-foreground-muted">Order: {(item as Transaction).order_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                              {item.user?.avatar_url ? (
                                <img src={item.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <span className="text-accent-primary font-bold text-sm">
                                  {(item.user?.full_name || item.user?.username || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.user?.full_name || 'No name'}</p>
                              <p className="text-xs text-foreground-muted">@{item.user?.username || 'no-username'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">₹{(item.amount / 100).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Coins size={14} className="text-yellow-400" />
                            <span>{(item as Transaction).coins_purchased || 0}</span>
                            {(item as Transaction).bonus_coins && (
                              <span className="text-green-400 text-sm">+{(item as Transaction).bonus_coins}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{(item as PaymentOrder).order_id}</p>
                            <p className="text-sm text-foreground-muted">{(item as PaymentOrder).receipt || 'No receipt'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                              {item.user?.avatar_url ? (
                                <img src={item.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <span className="text-accent-primary font-bold text-sm">
                                  {(item.user?.full_name || item.user?.username || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.user?.full_name || 'No name'}</p>
                              <p className="text-xs text-foreground-muted">@{item.user?.username || 'no-username'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">₹{(item.amount / 100).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground-muted">
                            {(item as PaymentOrder).payment_id || 'Not assigned'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p className="text-sm text-foreground-muted">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 bg-background rounded-lg text-sm">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-background rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}