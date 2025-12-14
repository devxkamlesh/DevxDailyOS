'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Droplets, Plus, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface WeatherEntry {
  id: string
  date: string
  condition: string
  temperature: number
  humidity: number
  api_data: any
  created_at: string
}

interface WeatherFormData {
  date: string
  condition: string
  temperature: number
  humidity: number
}

const weatherConditions = [
  { value: 'sunny', label: 'Sunny', icon: Sun, color: 'text-yellow-500' },
  { value: 'cloudy', label: 'Cloudy', icon: Cloud, color: 'text-gray-500' },
  { value: 'rainy', label: 'Rainy', icon: CloudRain, color: 'text-blue-500' },
  { value: 'snowy', label: 'Snowy', icon: CloudSnow, color: 'text-blue-300' },
  { value: 'windy', label: 'Windy', icon: Wind, color: 'text-green-500' },
]

const initialFormData: WeatherFormData = {
  date: new Date().toISOString().split('T')[0],
  condition: 'sunny',
  temperature: 25,
  humidity: 50
}

export default function WeatherPage() {
  const [weatherEntries, setWeatherEntries] = useState<WeatherEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<WeatherFormData>(initialFormData)
  const [editingEntry, setEditingEntry] = useState<WeatherEntry | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchWeatherEntries()
  }, [])

  const fetchWeatherEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_weather')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      setWeatherEntries(data || [])
    } catch (error) {
      console.error('Error fetching weather entries:', error)
      toast.error('Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('daily_weather')
          .update({
            condition: formData.condition,
            temperature: formData.temperature,
            humidity: formData.humidity
          })
          .eq('id', editingEntry.id)

        if (error) throw error
        toast.success('Weather entry updated')
      } else {
        const { error } = await supabase
          .from('daily_weather')
          .insert([formData])

        if (error) throw error
        toast.success('Weather entry added')
      }

      setDialogOpen(false)
      setEditingEntry(null)
      setFormData(initialFormData)
      fetchWeatherEntries()
    } catch (error) {
      console.error('Error saving weather entry:', error)
      toast.error('Failed to save weather entry')
    }
  }

  const handleEdit = (entry: WeatherEntry) => {
    setEditingEntry(entry)
    setFormData({
      date: entry.date,
      condition: entry.condition,
      temperature: entry.temperature,
      humidity: entry.humidity
    })
    setDialogOpen(true)
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this weather entry?')) return

    try {
      const { error } = await supabase
        .from('daily_weather')
        .delete()
        .eq('id', entryId)

      if (error) throw error
      toast.success('Weather entry deleted')
      fetchWeatherEntries()
    } catch (error) {
      console.error('Error deleting weather entry:', error)
      toast.error('Failed to delete weather entry')
    }
  }

  const getWeatherIcon = (condition: string) => {
    const weatherCondition = weatherConditions.find(w => w.value === condition)
    return weatherCondition || weatherConditions[0]
  }

  const getWeatherStats = () => {
    if (weatherEntries.length === 0) return null

    const avgTemp = weatherEntries.reduce((sum, entry) => sum + entry.temperature, 0) / weatherEntries.length
    const avgHumidity = weatherEntries.reduce((sum, entry) => sum + entry.humidity, 0) / weatherEntries.length
    
    const conditionCounts = weatherEntries.reduce((acc, entry) => {
      acc[entry.condition] = (acc[entry.condition] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostCommonCondition = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    return {
      avgTemp: Math.round(avgTemp),
      avgHumidity: Math.round(avgHumidity),
      mostCommonCondition
    }
  }

  const stats = getWeatherStats()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weather Tracking</h1>
          <p className="text-muted-foreground">
            Track daily weather conditions and analyze patterns
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEntry(null)
              setFormData(initialFormData)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Weather Entry
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Weather Entry' : 'Add Weather Entry'}
              </DialogTitle>
              <DialogDescription>
                Record the weather conditions for a specific day
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={!!editingEntry}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Weather Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherConditions.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        <div className="flex items-center gap-2">
                          <condition.icon className={`h-4 w-4 ${condition.color}`} />
                          {condition.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                    min="-50"
                    max="60"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="humidity">Humidity (%)</Label>
                  <Input
                    id="humidity"
                    type="number"
                    value={formData.humidity}
                    onChange={(e) => setFormData(prev => ({ ...prev, humidity: parseInt(e.target.value) }))}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Update' : 'Add'} Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weather Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Temperature</p>
                <p className="text-2xl font-bold">{stats.avgTemp}°C</p>
              </div>
              <Thermometer className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Humidity</p>
                <p className="text-2xl font-bold">{stats.avgHumidity}%</p>
              </div>
              <Droplets className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Common</p>
                <p className="text-2xl font-bold capitalize">{stats.mostCommonCondition}</p>
              </div>
              {(() => {
                const condition = getWeatherIcon(stats.mostCommonCondition)
                return <condition.icon className={`h-8 w-8 ${condition.color}`} />
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weather Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Weather History</CardTitle>
          <CardDescription>
            Your recorded weather data for the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weatherEntries.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Weather Data</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking daily weather conditions
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {weatherEntries.map((entry) => {
                const condition = getWeatherIcon(entry.condition)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <condition.icon className={`h-6 w-6 ${condition.color}`} />
                      <div>
                        <div className="font-medium">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {condition.label}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <span>{entry.temperature}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span>{entry.humidity}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}