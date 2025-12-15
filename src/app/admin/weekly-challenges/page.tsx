'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Trophy, Calendar, Target, Coins, Zap, Users } from 'lucide-react'
import { toast } from 'sonner'

interface WeeklyChallenge {
  id: string
  title: string
  description: string
  target_type: 'completions' | 'streak' | 'perfect_days'
  target_value: number
  coin_reward: number
  xp_reward: number
  is_active: boolean
  week_start: string
  week_end: string
  created_at: string
}

interface ChallengeFormData {
  title: string
  description: string
  target_type: 'completions' | 'streak' | 'perfect_days'
  target_value: number
  coin_reward: number
  xp_reward: number
  is_active: boolean
  week_start: string
  week_end: string
}

const initialFormData: ChallengeFormData = {
  title: '',
  description: '',
  target_type: 'completions',
  target_value: 10,
  coin_reward: 50,
  xp_reward: 100,
  is_active: true,
  week_start: '',
  week_end: ''
}

export default function AdminWeeklyChallengesPage() {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<WeeklyChallenge | null>(null)
  const [formData, setFormData] = useState<ChallengeFormData>(initialFormData)
  const supabase = createClient()

  useEffect(() => {
    fetchChallenges()
    
    // Set default week dates (current week)
    const today = new Date()
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    setFormData(prev => ({
      ...prev,
      week_start: monday.toISOString().split('T')[0],
      week_end: sunday.toISOString().split('T')[0]
    }))
  }, [])

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setChallenges(data || [])
    } catch (error) {
      console.error('Error fetching challenges:', error)
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingChallenge) {
        // Update existing challenge
        const { error } = await supabase
          .from('weekly_challenges')
          .update(formData)
          .eq('id', editingChallenge.id)

        if (error) throw error
        toast.success('Challenge updated successfully')
      } else {
        // Create new challenge
        const { error } = await supabase
          .from('weekly_challenges')
          .insert([formData])

        if (error) throw error
        toast.success('Challenge created successfully')
      }

      setDialogOpen(false)
      setEditingChallenge(null)
      setFormData(initialFormData)
      fetchChallenges()
    } catch (error) {
      console.error('Error saving challenge:', error)
      toast.error('Failed to save challenge')
    }
  }

  const handleEdit = (challenge: WeeklyChallenge) => {
    setEditingChallenge(challenge)
    setFormData({
      title: challenge.title ?? '',
      description: challenge.description ?? '',
      target_type: challenge.target_type ?? 'completions',
      target_value: challenge.target_value ?? 10,
      coin_reward: challenge.coin_reward ?? 50,
      xp_reward: challenge.xp_reward ?? 100,
      is_active: challenge.is_active ?? true,
      week_start: challenge.week_start ?? '',
      week_end: challenge.week_end ?? ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return

    try {
      const { error } = await supabase
        .from('weekly_challenges')
        .delete()
        .eq('id', challengeId)

      if (error) throw error
      toast.success('Challenge deleted successfully')
      fetchChallenges()
    } catch (error) {
      console.error('Error deleting challenge:', error)
      toast.error('Failed to delete challenge')
    }
  }

  const toggleActive = async (challengeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('weekly_challenges')
        .update({ is_active: !isActive })
        .eq('id', challengeId)

      if (error) throw error
      toast.success(`Challenge ${!isActive ? 'activated' : 'deactivated'}`)
      fetchChallenges()
    } catch (error) {
      console.error('Error toggling challenge:', error)
      toast.error('Failed to update challenge')
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'completions': return 'Completions'
      case 'streak': return 'Day Streak'
      case 'perfect_days': return 'Perfect Days'
      default: return 'Target'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-10 bg-surface rounded-2xl border border-border-subtle animate-pulse w-1/4"></div>
            <div className="h-10 bg-surface rounded-2xl border border-border-subtle animate-pulse w-40"></div>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-border-subtle">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-background rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weekly Challenges</h1>
          <p className="text-muted-foreground">
            Manage weekly challenges for users to complete
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingChallenge(null)
              setFormData(initialFormData)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Challenge
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
              </DialogTitle>
              <DialogDescription>
                Set up a weekly challenge for users to complete
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Challenge title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target_type">Target Type</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: 'completions' | 'streak' | 'perfect_days') => 
                      setFormData(prev => ({ ...prev, target_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completions">Completions</SelectItem>
                      <SelectItem value="streak">Day Streak</SelectItem>
                      <SelectItem value="perfect_days">Perfect Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Challenge description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coin_reward">Coin Reward</Label>
                  <Input
                    id="coin_reward"
                    type="number"
                    value={formData.coin_reward ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, coin_reward: parseInt(e.target.value) || 0 }))}
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="xp_reward">XP Reward</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    value={formData.xp_reward ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="week_start">Week Start</Label>
                  <Input
                    id="week_start"
                    type="date"
                    value={formData.week_start ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="week_end">Week End</Label>
                  <Input
                    id="week_end"
                    type="date"
                    value={formData.week_end ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_end: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingChallenge ? 'Update' : 'Create'} Challenge
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges</CardTitle>
          <CardDescription>
            Manage weekly challenges and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Rewards</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{challenge.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {challenge.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTargetTypeLabel(challenge.target_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{challenge.target_value}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span>{challenge.coin_reward}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-500" />
                        <span>{challenge.xp_reward}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(challenge.week_start).toLocaleDateString()} - {' '}
                      {new Date(challenge.week_end).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={challenge.is_active ? "default" : "secondary"}>
                      {challenge.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(challenge.id, challenge.is_active)}
                      >
                        {challenge.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(challenge)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(challenge.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {challenges.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Challenges Yet</h3>
              <p className="text-muted-foreground">
                Create your first weekly challenge to engage users
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}