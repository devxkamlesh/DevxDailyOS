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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, BarChart3, LineChart, PieChart, TrendingUp, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'

interface ChartConfiguration {
  id: string
  chart_id: string
  chart_type: string
  config: any
  user_id: string | null
  is_global: boolean
  title: string
  description: string
  is_active: boolean
  created_at: string
}

interface ChartMetric {
  id: string
  recorded_at: string
  date: string
  metric: string
  value: number
  group_key: string
  category: string
  meta: any
  user_id: string | null
}

interface ChartFormData {
  chart_id: string
  chart_type: string
  title: string
  description: string
  is_global: boolean
  is_active: boolean
  config: string
}

const chartTypes = [
  { value: 'simple_area', label: 'Area Chart', icon: BarChart3 },
  { value: 'line_chart', label: 'Line Chart', icon: LineChart },
  { value: 'bar_chart', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie_chart', label: 'Pie Chart', icon: PieChart },
  { value: 'fill_by_value', label: 'Fill by Value', icon: TrendingUp },
]

const initialFormData: ChartFormData = {
  chart_id: '',
  chart_type: 'simple_area',
  title: '',
  description: '',
  is_global: false,
  is_active: true,
  config: JSON.stringify({
    xAxis: 'date',
    yAxis: 'value',
    colors: ['#3b82f6'],
    showGrid: true,
    showLegend: true
  }, null, 2)
}

export default function AdminChartsPage() {
  const [chartConfigs, setChartConfigs] = useState<ChartConfiguration[]>([])
  const [chartMetrics, setChartMetrics] = useState<ChartMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChart, setEditingChart] = useState<ChartConfiguration | null>(null)
  const [formData, setFormData] = useState<ChartFormData>(initialFormData)
  const [activeTab, setActiveTab] = useState('configurations')
  const supabase = createClient()

  useEffect(() => {
    fetchChartConfigurations()
    fetchChartMetrics()
  }, [])

  const fetchChartConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_configurations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setChartConfigs(data || [])
    } catch (error) {
      console.error('Error fetching chart configurations:', error)
      toast.error('Failed to load chart configurations')
    }
  }

  const fetchChartMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setChartMetrics(data || [])
    } catch (error) {
      console.error('Error fetching chart metrics:', error)
      toast.error('Failed to load chart metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let config
      try {
        config = JSON.parse(formData.config)
      } catch {
        toast.error('Invalid JSON configuration')
        return
      }

      const chartData = {
        chart_id: formData.chart_id,
        chart_type: formData.chart_type,
        title: formData.title,
        description: formData.description,
        is_global: formData.is_global,
        is_active: formData.is_active,
        config,
        user_id: formData.is_global ? null : (await supabase.auth.getUser()).data.user?.id
      }

      if (editingChart) {
        const { error } = await supabase
          .from('chart_configurations')
          .update(chartData)
          .eq('id', editingChart.id)

        if (error) throw error
        toast.success('Chart configuration updated')
      } else {
        const { error } = await supabase
          .from('chart_configurations')
          .insert([chartData])

        if (error) throw error
        toast.success('Chart configuration created')
      }

      setDialogOpen(false)
      setEditingChart(null)
      setFormData(initialFormData)
      fetchChartConfigurations()
    } catch (error) {
      console.error('Error saving chart configuration:', error)
      toast.error('Failed to save chart configuration')
    }
  }

  const handleEdit = (chart: ChartConfiguration) => {
    setEditingChart(chart)
    setFormData({
      chart_id: chart.chart_id,
      chart_type: chart.chart_type,
      title: chart.title,
      description: chart.description,
      is_global: chart.is_global,
      is_active: chart.is_active,
      config: JSON.stringify(chart.config, null, 2)
    })
    setDialogOpen(true)
  }

  const handleDelete = async (chartId: string) => {
    if (!confirm('Are you sure you want to delete this chart configuration?')) return

    try {
      const { error } = await supabase
        .from('chart_configurations')
        .delete()
        .eq('id', chartId)

      if (error) throw error
      toast.success('Chart configuration deleted')
      fetchChartConfigurations()
    } catch (error) {
      console.error('Error deleting chart configuration:', error)
      toast.error('Failed to delete chart configuration')
    }
  }

  const toggleActive = async (chartId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chart_configurations')
        .update({ is_active: !isActive })
        .eq('id', chartId)

      if (error) throw error
      toast.success(`Chart ${!isActive ? 'activated' : 'deactivated'}`)
      fetchChartConfigurations()
    } catch (error) {
      console.error('Error toggling chart:', error)
      toast.error('Failed to update chart')
    }
  }

  const getChartTypeIcon = (type: string) => {
    const chartType = chartTypes.find(t => t.value === type)
    return chartType?.icon || BarChart3
  }

  const getMetricStats = () => {
    if (chartMetrics.length === 0) return null

    const totalMetrics = chartMetrics.length
    const uniqueMetrics = new Set(chartMetrics.map(m => m.metric)).size
    const uniqueCategories = new Set(chartMetrics.map(m => m.category)).size
    const latestMetric = chartMetrics[0]

    return {
      totalMetrics,
      uniqueMetrics,
      uniqueCategories,
      latestMetric
    }
  }

  const stats = getMetricStats()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chart Management</h1>
          <p className="text-muted-foreground">
            Manage chart configurations and view metrics data
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingChart(null)
              setFormData(initialFormData)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chart Config
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingChart ? 'Edit Chart Configuration' : 'Create Chart Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure a new chart for the analytics dashboard
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chart_id">Chart ID</Label>
                  <Input
                    id="chart_id"
                    value={formData.chart_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, chart_id: e.target.value }))}
                    placeholder="unique-chart-id"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chart_type">Chart Type</Label>
                  <Select
                    value={formData.chart_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, chart_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chartTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Chart title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Chart description"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  value={formData.config}
                  onChange={(e) => setFormData(prev => ({ ...prev, config: e.target.value }))}
                  placeholder="Chart configuration in JSON format"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_global"
                    checked={formData.is_global}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_global: checked }))}
                  />
                  <Label htmlFor="is_global">Global Chart</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingChart ? 'Update' : 'Create'} Configuration
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="configurations">
            Chart Configurations ({chartConfigs.length})
          </TabsTrigger>
          <TabsTrigger value="metrics">
            Metrics Data ({chartMetrics.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations">
          <Card>
            <CardHeader>
              <CardTitle>Chart Configurations</CardTitle>
              <CardDescription>
                Manage chart configurations for the analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chart</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartConfigs.map((chart) => {
                    const ChartIcon = getChartTypeIcon(chart.chart_type)
                    return (
                      <TableRow key={chart.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{chart.title}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {chart.chart_id}
                            </div>
                            {chart.description && (
                              <div className="text-sm text-muted-foreground">
                                {chart.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChartIcon className="h-4 w-4" />
                            <span className="capitalize">{chart.chart_type.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={chart.is_global ? "default" : "secondary"}>
                            {chart.is_global ? 'Global' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={chart.is_active ? "default" : "secondary"}>
                            {chart.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(chart.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(chart.id, chart.is_active)}
                            >
                              {chart.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(chart)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(chart.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              
              {chartConfigs.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Chart Configurations</h3>
                  <p className="text-muted-foreground">
                    Create your first chart configuration
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Chart Metrics Data</CardTitle>
              <CardDescription>
                Recent metrics data used by charts (showing last 100 entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>
                        {new Date(metric.recorded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{metric.metric}</TableCell>
                      <TableCell>{metric.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.category}</Badge>
                      </TableCell>
                      <TableCell>{metric.group_key || '-'}</TableCell>
                      <TableCell>
                        {metric.user_id ? (
                          <Badge variant="secondary">User</Badge>
                        ) : (
                          <Badge variant="default">System</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {chartMetrics.length === 0 && (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Metrics Data</h3>
                  <p className="text-muted-foreground">
                    Metrics data will appear here as it's collected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Metrics</p>
                    <p className="text-2xl font-bold">{stats.totalMetrics}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Metrics</p>
                    <p className="text-2xl font-bold">{stats.uniqueMetrics}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{stats.uniqueCategories}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Value</p>
                    <p className="text-2xl font-bold">{stats.latestMetric?.value || 0}</p>
                    <p className="text-xs text-muted-foreground">{stats.latestMetric?.metric}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}