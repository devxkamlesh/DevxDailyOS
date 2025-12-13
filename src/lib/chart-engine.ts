/**
 * Centralized Chart Data Engine
 * Unified system to manage all Recharts chart types dynamically
 */

// Base interfaces for the chart engine
export interface ChartDataSource {
  source: 'api' | 'database' | 'static'
  dataset: any[]
  timeKey: string
  metrics: string[]
  dimensions: string[]
}

export interface ChartConfig {
  chartId: string
  type: 'simple_area' | 'fill_by_value' | 'composed' | 'banded' | 'multi_x_axis'
  xAxis?: string
  yAxis?: string | string[]
  [key: string]: any
}

export interface ChartThreshold {
  min: number
  max: number
  type: string
  color?: string
}

export interface ChartSeries {
  type: 'bar' | 'line' | 'area'
  key: string
  color?: string
  yAxisId?: string
}

// Chart Engine Class
export class ChartDataEngine {
  private datasets: Map<string, any[]> = new Map()
  private configs: Map<string, ChartConfig> = new Map()

  // CMD: INIT_CHART_DATA_ENGINE
  initEngine(source: ChartDataSource): void {
    // Clear previous configurations and datasets
    this.configs.clear()
    this.datasets.clear()
    
    const normalizedData = this.normalizeData(source)
    this.datasets.set('main', normalizedData)
  }

  // CMD: CONFIGURE_SIMPLE_AREA_CHART
  configureSimpleAreaChart(config: {
    chartId: string
    xAxis: string
    yAxis: string[]
    area: {
      key: string
      aggregation: 'sum' | 'avg' | 'none'
    }
  }): any[] {
    const data = this.datasets.get('main') || []
    this.configs.set(config.chartId, { ...config, type: 'simple_area' })
    
    return this.processSimpleArea(data, config)
  }

  // CMD: CONFIGURE_FILL_BY_VALUE_AREA
  configureFillByValueArea(config: {
    chartId: string
    xAxis: string
    yAxis: string
    thresholds: ChartThreshold[]
  }): any[] {
    const data = this.datasets.get('main') || []
    this.configs.set(config.chartId, { ...config, type: 'fill_by_value' })
    
    return this.processFillByValue(data, config)
  }

  // CMD: CONFIGURE_COMPOSED_CHART
  configureComposedChart(config: {
    chartId: string
    xAxis: string
    series: ChartSeries[]
  }): any[] {
    const data = this.datasets.get('main') || []
    this.configs.set(config.chartId, { ...config, type: 'composed' })
    
    return this.processComposed(data, config)
  }

  // CMD: CONFIGURE_BANDED_CHART
  configureBandedChart(config: {
    chartId: string
    xAxis: string
    bands: {
      low: string
      high: string
    }
    actual: string
  }): any[] {
    const data = this.datasets.get('main') || []
    this.configs.set(config.chartId, { ...config, type: 'banded' })
    
    return this.processBanded(data, config)
  }

  // CMD: CONFIGURE_MULTI_X_AXIS_CHART
  configureMultiXAxisChart(config: {
    chartId: string
    xAxes: Array<{ id: string; key: string }>
    yAxis: string[]
  }): any[] {
    const data = this.datasets.get('main') || []
    this.configs.set(config.chartId, { ...config, type: 'multi_x_axis' })
    
    return this.processMultiXAxis(data, config)
  }

  // CMD: UPDATE_CHART_DATA
  updateChartData(params: {
    chartId: string | 'all'
    newData: any[]
    mode: 'append' | 'replace' | 'merge'
  }): void {
    const currentData = this.datasets.get('main') || []
    
    switch (params.mode) {
      case 'replace':
        this.datasets.set('main', params.newData)
        break
      case 'append':
        this.datasets.set('main', [...currentData, ...params.newData])
        break
      case 'merge':
        const merged = this.mergeData(currentData, params.newData)
        this.datasets.set('main', merged)
        break
    }
  }

  // CMD: REFRESH_CHARTS
  refreshCharts(): Map<string, any[]> {
    const results = new Map<string, any[]>()
    
    this.configs.forEach((config, chartId) => {
      const data = this.datasets.get('main') || []
      
      switch (config.type) {
        case 'simple_area':
          results.set(chartId, this.processSimpleArea(data, config as any))
          break
        case 'fill_by_value':
          results.set(chartId, this.processFillByValue(data, config as any))
          break
        case 'composed':
          results.set(chartId, this.processComposed(data, config as any))
          break
        case 'banded':
          results.set(chartId, this.processBanded(data, config as any))
          break
        case 'multi_x_axis':
          results.set(chartId, this.processMultiXAxis(data, config as any))
          break
      }
    })
    
    return results
  }

  // CMD: RESET_CHART
  resetChart(chartId: string): void {
    this.configs.delete(chartId)
  }

  // Private processing methods
  private normalizeData(source: ChartDataSource): any[] {
    return source.dataset.map(item => {
      // Handle missing/null values
      const normalized = { ...item }
      source.metrics.forEach(metric => {
        if (normalized[metric] === null || normalized[metric] === undefined) {
          normalized[metric] = 0
        }
      })
      return normalized
    })
  }

  private processSimpleArea(data: any[], config: any): any[] {
    return data.map(item => ({
      [config.xAxis]: item[config.xAxis],
      [config.area.key]: this.applyAggregation(item[config.area.key], config.area.aggregation)
    }))
  }

  private processFillByValue(data: any[], config: any): any[] {
    return data.map(item => {
      const value = item[config.yAxis]
      const threshold = config.thresholds.find((t: ChartThreshold) => 
        value >= t.min && value < t.max
      )
      
      return {
        [config.xAxis]: item[config.xAxis],
        [config.yAxis]: value,
        zone: threshold?.type || 'neutral',
        fill: threshold?.color || '#6366f1'
      }
    })
  }

  private processComposed(data: any[], config: any): any[] {
    return data.map(item => {
      const result: any = { [config.xAxis]: item[config.xAxis] }
      
      config.series.forEach((series: ChartSeries) => {
        result[series.key] = item[series.key] || 0
      })
      
      return result
    })
  }

  private processBanded(data: any[], config: any): any[] {
    return data.map(item => ({
      [config.xAxis]: item[config.xAxis],
      [config.bands.low]: item[config.bands.low] || 0,
      [config.bands.high]: item[config.bands.high] || 100,
      [config.actual]: item[config.actual] || 0
    }))
  }

  private processMultiXAxis(data: any[], config: any): any[] {
    return data.map(item => {
      const result: any = {}
      
      config.xAxes.forEach((axis: any) => {
        result[axis.key] = item[axis.key]
      })
      
      config.yAxis.forEach((metric: string) => {
        result[metric] = item[metric] || 0
      })
      
      return result
    })
  }

  private applyAggregation(value: any, aggregation: string): number {
    switch (aggregation) {
      case 'sum':
        return Array.isArray(value) ? value.reduce((a, b) => a + b, 0) : Number(value) || 0
      case 'avg':
        return Array.isArray(value) ? value.reduce((a, b) => a + b, 0) / value.length : Number(value) || 0
      default:
        return Number(value) || 0
    }
  }

  private mergeData(current: any[], newData: any[]): any[] {
    const merged = [...current]
    
    newData.forEach(newItem => {
      const existingIndex = merged.findIndex(item => 
        item.id === newItem.id || item.timestamp === newItem.timestamp
      )
      
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newItem }
      } else {
        merged.push(newItem)
      }
    })
    
    return merged
  }
}

// Demo Data Generator
export class DemoDataGenerator {
  static generateHabitAnalytics(days: number = 30): any[] {
    const data = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      data.push({
        timestamp: date.toISOString(),
        date: date.toISOString().split('T')[0],
        completions: Math.floor(Math.random() * 10) + 1,
        target: 8,
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        focusTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        streakDays: Math.floor(Math.random() * 15) + 1,
        productivity: Math.floor(Math.random() * 50) + 50, // 50-100%
        mood: Math.floor(Math.random() * 5) + 6, // 6-10 scale
        energy: Math.floor(Math.random() * 4) + 7, // 7-10 scale
        category: ['morning', 'work', 'evening', 'health'][Math.floor(Math.random() * 4)],
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        hour: Math.floor(Math.random() * 16) + 6, // 6 AM to 10 PM
        revenue: Math.floor(Math.random() * 1000) + 500, // For business metrics
        users: Math.floor(Math.random() * 100) + 50,
        profit: Math.floor(Math.random() * 300) + 100,
        minValue: Math.floor(Math.random() * 20) + 40, // For banded charts
        maxValue: Math.floor(Math.random() * 20) + 80,
        currentValue: Math.floor(Math.random() * 40) + 50
      })
    }
    
    return data
  }

  static generateFinancialData(days: number = 30): any[] {
    const data = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const baseValue = 1000 + Math.sin(i / 10) * 200
      const volatility = (Math.random() - 0.5) * 100
      
      data.push({
        timestamp: date.toISOString(),
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue + volatility),
        volume: Math.floor(Math.random() * 1000000) + 500000,
        change: volatility,
        high: Math.round(baseValue + volatility + Math.random() * 50),
        low: Math.round(baseValue + volatility - Math.random() * 50),
        open: Math.round(baseValue + (Math.random() - 0.5) * 50),
        close: Math.round(baseValue + volatility)
      })
    }
    
    return data
  }
}

// Global chart engine instance
export const chartEngine = new ChartDataEngine()