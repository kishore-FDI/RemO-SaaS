'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCcw, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types
import { AnalyticsData } from './analytics/AnalyticsTypes'

// Components
import { ProjectHeader, ProjectInfoCard, Loading, Error } from './analytics/components'
import { KeyMetricsGrid } from './analytics/KeyMetricsGrid'

// Dynamic Tabs
const OverviewTab = dynamic(() => import('./analytics/OverviewTab'), {
  ssr: false,
  loading: () => <div>Loading overview...</div>,
})
const ActivityTab = dynamic(() => import('./analytics/ActivityTab'), {
  ssr: false,
  loading: () => <div>Loading activity trends...</div>,
})
const TeamPerformanceTab = dynamic(() => import('./analytics/TeamPerformanceTab'), {
  ssr: false,
  loading: () => <div>Loading team performance...</div>,
})
const AIInsightsTab = dynamic(() => import('./analytics/AIInsightsTab'), {
  ssr: false,
  loading: () => <div>Loading AI insights...</div>,
})
const ForecastingTab = dynamic(() => import('./analytics/ForecastingTab'), {
  ssr: false,
  loading: () => <div>Loading forecasting...</div>,
})

// Helper functions
import { 
  calculateTrends, 
  calculateProjectHealth, 
  calculateCumulativeActivityData 
} from './analytics/utils/analyticsCalculations'

export default function ProjectAnalytics({ projectId, onBack }: { projectId: string, onBack: () => void }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7days' | '14days' | '30days'>('14days')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/analytics?projectId=${projectId}&timeRange=${timeRange}`)
      const data = await res.json()
      // @ts-ignore
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics')
      setAnalyticsData(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [projectId, timeRange])

  const projectHealth = useMemo(() =>
    analyticsData ? calculateProjectHealth(analyticsData) : null,
    [analyticsData]
  )

  const activityTrends = useMemo(() =>
    analyticsData ? calculateTrends(analyticsData.taskActivityOverTime) : null,
    [analyticsData]
  )

  const cumulativeActivityData = useMemo(() =>
    analyticsData ? calculateCumulativeActivityData(analyticsData.taskActivityOverTime) : [],
    [analyticsData]
  )

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <Error fetchAnalytics={fetchAnalytics} error={error} />
  }

  if (!analyticsData) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <ProjectHeader title={analyticsData.project.title} />

        <div className="flex gap-2 flex-wrap">
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="14days">Last 14 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10"
          >
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <KeyMetricsGrid
        projectHealth={projectHealth}
        taskMetrics={analyticsData.taskMetrics}
        activityTrends={activityTrends}
        overdueTasksCount={analyticsData.tasksByDueDate.overdue}
      />

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        {activeTab === 'overview' && (
          <TabsContent value="overview">
            <OverviewTab
              taskStatusData={analyticsData.taskMetrics}
              dueDateData={analyticsData.tasksByDueDate}
              cumulativeActivityData={cumulativeActivityData}
            />
          </TabsContent>
        )}

        {activeTab === 'activity' && (
          <TabsContent value="activity">
            <ActivityTab
              taskActivityData={analyticsData.taskActivityOverTime}
              cumulativeActivityData={cumulativeActivityData}
            />
          </TabsContent>
        )}

        {activeTab === 'team' && (
          <TabsContent value="team">
            <TeamPerformanceTab memberPerformance={analyticsData.memberPerformance} />
          </TabsContent>
        )}

        {activeTab === 'ai-insights' && (
          <TabsContent value="ai-insights">
            <AIInsightsTab
              aiInsights={analyticsData.aiInsights || []}
              businessMetrics={analyticsData.businessMetrics}
              taskMetrics={analyticsData.taskMetrics}
            />
          </TabsContent>
        )}

        {activeTab === 'forecasting' && (
          <TabsContent value="forecasting">
            <ForecastingTab
              timeSeriesAnalysis={analyticsData.timeSeriesAnalysis}
              taskActivityData={analyticsData.taskActivityOverTime}
            />
          </TabsContent>
        )}
      </Tabs>

      <ProjectInfoCard project={analyticsData.project} />
    </div>
  )
}
