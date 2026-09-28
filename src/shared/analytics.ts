export interface FunnelStage {
  key: 'applied' | 'assessment' | 'interview' | 'secondPlus' | 'offer'
  label: string
  value: number
}

export interface DirectionMetric {
  direction: string
  applications: number
  interviews: number
  offers: number
}

export interface ChannelMetric {
  channel: string
  applications: number
}

export interface ResponseTimeMetric {
  sampleCount: number
  averageDays: number | null
  medianDays: number | null
}

export interface AnalyticsDashboardData {
  funnel: FunnelStage[]
  directions: DirectionMetric[]
  channels: ChannelMetric[]
  responseTime: ResponseTimeMetric
}
