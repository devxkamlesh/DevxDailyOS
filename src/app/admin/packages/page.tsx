'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins, Plus, Edit2, Trash2, X, Star, IndianRupee, Gift, TrendingUp } from 'lucide-react'

interface CoinPackage {
  id: string
  name: string
  description: string | null
  coins: number
  bonus_coins: number
  price_inr: number
  is_popular: boolean
  badge: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CoinPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins: 100,
    bonus_coins: 0,
    price_inr: 4900,
    is_popular: false,
    badge: '',
    sort_order: 0,
    is_active: true
  })
  const supabase = createClient()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    const { data } = await supabase
      .from('coin_packages')
      .select('*')
      .order('sort_order')
    setPackages(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      coins: formData.coins,
      bonus_coins: formData.bonus_coins,
      price_inr: formData.price_inr,
      is_popular: formData.is_popular,
      badge: formData.badge || null,
      sort_order: formData.sort_order,
      is_active: formData.is_active
    }

    if (editingPackage) {
      await supabase.from('coin_packages').update(payload).eq('id', editingPackage.id)
    } else {
      await supabase.from('coin_packages').insert(payload)
    }

    resetForm()
    fetchPackages()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      coins: 100,
      bonus_coins: 0,
      price_inr: 4900,
      is_popular: false,
      badge: '',
      sort_order: 0,
      is_active: true
    })
    setEditingPackage(null)
    setShowForm(false)
  }

  const openEdit = (pkg: CoinPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      coins: pkg.coins,
      bonus_coins: pkg.bonus_coins,
      price_inr: pkg.price_inr,
      is_popular: pkg.is_popular,
      badge: pkg.badge || '',
      sort_order: pkg.sort_order,
      is_active: pkg.is_active
    })
    setShowForm(true)
  }

  const toggleActive = async (pkg: CoinPackage) => {
    await supabase.from('coin_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id)
    fetchPackages()
  }

  const deletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    await supabase.from('coin_packages').delete().eq('id', id)
    fetchPackages()
  }

  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-surface rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <IndianRupee className="text-green-500" size={24} />
            </div>
            Coin Packages
          </h1>
          <p className="text-foreground-muted mt-1">Manage real money coin packages (Razorpay)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
        >
          <Plus size={18} /> Add Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Gift className="text-blue-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{packages.length}</div>
              <div className="text-sm text-foreground-muted">Total Packages</div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</div>
              <div className="text-sm text-foreground-muted">Active</div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Star className="text-yellow-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{packages.filter(p => p.is_popular).length}</div>
              <div className="text-sm text-foreground-muted">Popular</div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Coins className="text-purple-500" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {packages.reduce((sum, p) => sum + p.coins + p.bonus_coins, 0).toLocaleString()}
              </div>
              <div className="text-sm text-foreground-muted">Total Coins Offered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative bg-surface rounded-2xl border-2 p-5 transition-all ${
              pkg.is_popular
                ? 'border-yellow-500/50 bg-yellow-500/5'
                : pkg.is_active
                ? 'border-border-subtle'
                : 'border-red-500/30 opacity-60'
            }`}
          >
            {/* Badge */}
            {pkg.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                {pkg.badge}
              </div>
            )}

            {/* Popular Star */}
            {pkg.is_popular && (
              <div className="absolute top-3 right-3">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
              </div>
            )}

            {/* Coins Display */}
            <div className="text-center mb-4 pt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl mb-3">
                <Coins className="text-yellow-500" size={32} />
              </div>
              <h3 className="font-bold text-lg">{pkg.name}</h3>
              {pkg.description && (
                <p className="text-sm text-foreground-muted mt-1">{pkg.description}</p>
              )}
            </div>

            {/* Coins Info */}
            <div className="bg-background rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground-muted">Base Coins</span>
                <span className="font-bold">{pkg.coins.toLocaleString()}</span>
              </div>
              {pkg.bonus_coins > 0 && (
                <div className="flex items-center justify-between text-green-500">
                  <span>Bonus Coins</span>
                  <span className="font-bold">+{pkg.bonus_coins.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border-subtle mt-2 pt-2 flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-yellow-500">
                  {(pkg.coins + pkg.bonus_coins).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-green-500">{formatPrice(pkg.price_inr)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(pkg)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => toggleActive(pkg)}
                className={`flex-1 py-2 rounded-lg transition ${
                  pkg.is_active
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {pkg.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => deletePackage(pkg.id)}
                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Status */}
            <div className="mt-3 text-center">
              <span className={`text-xs px-2 py-1 rounded-full ${
                pkg.is_active 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {pkg.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border-subtle">
          <IndianRupee size={48} className="mx-auto mb-4 text-foreground-muted opacity-50" />
          <p className="text-foreground-muted mb-4">No coin packages yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
          >
            Create First Package
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border-subtle">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h2 className="text-lg font-bold">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-background rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Package Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="e.g., Starter Pack"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                  rows={2}
                  placeholder="Short description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Base Coins *</label>
                  <input
                    type="number"
                    value={formData.coins}
                    onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bonus Coins</label>
                  <input
                    type="number"
                    value={formData.bonus_coins}
                    onChange={(e) => setFormData({ ...formData, bonus_coins: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Price (INR in paise) *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price_inr}
                    onChange={(e) => setFormData({ ...formData, price_inr: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    min="100"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">
                    = {formatPrice(formData.price_inr)}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">100 paise = ₹1</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="e.g., Best Value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-4 h-4 rounded border-border-subtle"
                  />
                  <span className="text-sm">Mark as Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-border-subtle"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
