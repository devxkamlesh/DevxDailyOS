'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Plus, Edit2, Trash2, X, Copy, Check, Calendar, Users } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_purchase: 0,
    max_uses: 0,
    expires_at: '',
    is_active: true
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_purchase: formData.min_purchase,
      max_uses: formData.max_uses,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active
    }

    try {
      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('coupons').insert(payload)
        if (error) throw error
      }
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      console.error('Error saving coupon:', error)
      alert(`Error: ${error.message || 'Failed to save coupon. Check if table exists and RLS policies allow admin operations.'}`)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: 0,
      expires_at: '',
      is_active: true
    })
    setShowForm(false)
    setEditingCoupon(null)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active
    })
    setShowForm(true)
  }

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    fetchCoupons()
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchCoupons()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const isExpired = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="text-pink-400" />
            Coupons
          </h1>
          <p className="text-foreground-muted">Manage discount coupons for the shop</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
        >
          <Plus size={18} />
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <p className="text-foreground-muted text-sm">Total Coupons</p>
          <p className="text-2xl font-bold">{coupons.length}</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <p className="text-foreground-muted text-sm">Active Coupons</p>
          <p className="text-2xl font-bold text-green-400">{coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 border border-border-subtle">
          <p className="text-foreground-muted text-sm">Total Uses</p>
          <p className="text-2xl font-bold text-accent-primary">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
        </div>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border-subtle">
          <Ticket size={48} className="mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-muted">No coupons yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon.expires_at)
            const usedUp = coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses
            
            return (
              <div
                key={coupon.id}
                className={`bg-surface rounded-2xl p-5 border transition ${
                  !coupon.is_active || expired || usedUp
                    ? 'border-border-subtle opacity-60'
                    : 'border-pink-500/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/20 rounded-xl">
                      <Ticket size={24} className="text-pink-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{coupon.code}</span>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1 hover:bg-background rounded transition"
                        >
                          {copied === coupon.code ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-foreground-muted" />
                          )}
                        </button>
                        {!coupon.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Inactive</span>
                        )}
                        {expired && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">Expired</span>
                        )}
                        {usedUp && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Used Up</span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-foreground-muted">{coupon.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-pink-400">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} coins`}
                      </p>
                      <p className="text-xs text-foreground-muted">Discount</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-bold">{coupon.used_count}{coupon.max_uses > 0 ? `/${coupon.max_uses}` : ''}</p>
                      <p className="text-xs text-foreground-muted">Uses</p>
                    </div>

                    {coupon.expires_at && (
                      <div className="text-center">
                        <p className="font-bold text-sm">{new Date(coupon.expires_at).toLocaleDateString()}</p>
                        <p className="text-xs text-foreground-muted">Expires</p>
                      </div>
                    )}

                    <div className="flex gap-1">
                      <button onClick={() => openEdit(coupon)} className="p-2 hover:bg-background rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleActive(coupon)} className={`p-2 hover:bg-background rounded-lg ${coupon.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                        {coupon.is_active ? <Check size={16} /> : <X size={16} />}
                      </button>
                      <button onClick={() => deleteCoupon(coupon.id)} className="p-2 hover:bg-background rounded-lg text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg border border-border-subtle">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-background rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2.5 bg-background border border-border-subtle rounded-xl uppercase font-mono"
                    placeholder="SAVE20"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                  placeholder="Summer sale discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (Coins)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(Coins)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={1}
                    max={formData.discount_type === 'percentage' ? 100 : 10000}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Purchase (Coins)</label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Uses (0 = unlimited)</label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 accent-accent-primary"
                />
                <span>Active</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
