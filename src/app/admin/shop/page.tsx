'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Plus, Edit2, Trash2, X, Coins, Palette, User, Sparkles } from 'lucide-react'

interface ShopItem {
  id: string
  name: string
  description: string | null
  plan_type: 'theme' | 'avatar' | 'feature'
  coin_price: number
  icon: string | null
  is_active: boolean
  created_at: string
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: 'theme' as 'theme' | 'avatar' | 'feature',
    coin_price: 100,
    icon: '',
    is_active: true
  })
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('shop_plans')
      .select('*')
      .order('plan_type')
      .order('coin_price')
    setItems(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingItem) {
      await supabase.from('shop_plans').update(formData).eq('id', editingItem.id)
    } else {
      await supabase.from('shop_plans').insert(formData)
    }

    resetForm()
    fetchItems()
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', plan_type: 'theme', coin_price: 100, icon: '', is_active: true })
    setShowForm(false)
    setEditingItem(null)
  }

  const openEdit = (item: ShopItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      plan_type: item.plan_type,
      coin_price: item.coin_price,
      icon: item.icon || '',
      is_active: item.is_active
    })
    setShowForm(true)
  }

  const toggleActive = async (item: ShopItem) => {
    await supabase.from('shop_plans').update({ is_active: !item.is_active }).eq('id', item.id)
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('shop_plans').delete().eq('id', id)
    fetchItems()
  }

  const typeIcons = { theme: Palette, avatar: User, feature: Sparkles }
  const typeColors = { theme: 'text-purple-400 bg-purple-500/20', avatar: 'text-blue-400 bg-blue-500/20', feature: 'text-green-400 bg-green-500/20' }

  const groupedItems = {
    theme: items.filter(i => i.plan_type === 'theme'),
    avatar: items.filter(i => i.plan_type === 'avatar'),
    feature: items.filter(i => i.plan_type === 'feature')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-green-400" />
            Shop Items
          </h1>
          <p className="text-foreground-muted">Manage themes, avatars, and features</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl hover:opacity-90 transition"
        >
          <Plus size={18} />
          New Item
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(['theme', 'avatar', 'feature'] as const).map((type) => {
            const Icon = typeIcons[type]
            const typeItems = groupedItems[type]
            
            return (
              <div key={type}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 capitalize">
                  <Icon size={20} className={typeColors[type].split(' ')[0]} />
                  {type}s ({typeItems.length})
                </h2>
                
                {typeItems.length === 0 ? (
                  <div className="text-center py-8 bg-surface rounded-2xl border border-border-subtle">
                    <p className="text-foreground-muted">No {type}s yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeItems.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-surface rounded-2xl p-5 border transition ${
                          item.is_active ? 'border-border-subtle' : 'border-border-subtle opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-xl ${typeColors[type]}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-background rounded-lg">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="p-1.5 hover:bg-background rounded-lg text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="font-bold mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-foreground-muted mb-3">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Coins size={16} /> {item.coin_price}
                          </span>
                          <button
                            onClick={() => toggleActive(item)}
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'New Shop Item'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-background rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                  >
                    <option value="theme">Theme</option>
                    <option value="avatar">Avatar</option>
                    <option value="feature">Feature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (Coins)</label>
                  <input
                    type="number"
                    value={formData.coin_price}
                    onChange={(e) => setFormData({ ...formData, coin_price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon (optional)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-xl"
                  placeholder="e.g., 🎨 or icon-name"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2.5 bg-background border border-border-subtle rounded-xl hover:bg-surface transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-accent-primary text-white rounded-xl hover:opacity-90 transition">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
