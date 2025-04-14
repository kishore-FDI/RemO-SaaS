// AIInsightsTab.tsx
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Progress } from "@/components/ui/progress"
import { Clock, Zap, Calendar, AlertTriangle } from 'lucide-react'

// Types
type AIInsight = {
  title: string
  description: string
  metric: string
  type: 'positive' | 'negative' | 'warning' | 'info'
}

type BusinessMetrics = {
  cycleTime: number | null
  throughput: number
  onTimeDelivery: number | null
  riskAssessment: {
    level: string
    score: number
  }
  estimatedCompletion?: {
    date: string
    daysRemaining: number
  }
}

type TaskMetrics = {
  total: number
  completed: number
  incomplete: number
  archived: number
}

type AIInsightsTabProps = {
  aiInsights: AIInsight[]
  businessMetrics?: BusinessMetrics
  taskMetrics: TaskMetrics
}

export default function AIInsightsTab({ aiInsights, businessMetrics, taskMetrics }: AIInsightsTabProps) {
  return (
    <div className="space-y-6">
      {/* AI Insights Cards */}
      {aiInsights && aiInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiInsights.map((insight, index) => (
            <Card key={index} className={`border-l-4 ${
              insight.type === 'positive' ? 'border-l-green-500' :
              insight.type === 'negative' ? 'border-l-red-500' :
              insight.type === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium">{insight.title}</CardTitle>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    insight.type === 'positive' ? 'bg-green-100 text-green-800' :
                    insight.type === 'negative' ? 'bg-red-100 text-red-800' :
                    insight.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">{insight.description}</p>
                  <div className="font-medium">{insight.metric}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Not enough data to generate AI insights yet. Continue using the project to receive personalized insights.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Business Metrics */}
      {businessMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cycle Time */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-medium">Avg. Cycle Time</CardTitle>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-2xl font-bold">
                  {businessMetrics.cycleTime !== null ? 
                    `${businessMetrics.cycleTime} days` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg. time to complete tasks
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Throughput */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-2xl font-bold">
                  {businessMetrics.throughput} tasks/day
                </div>
                <div className="text-sm text-muted-foreground">
                  Completion rate
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* On-Time Delivery */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                <Calendar className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-2xl font-bold">
                  {businessMetrics.onTimeDelivery !== null ? 
                    `${businessMetrics.onTimeDelivery}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tasks completed on time
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Risk Assessment */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-medium">Project Risk</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">
                    {businessMetrics.riskAssessment.level}
                  </div>
                  <div className={`ml-2 text-sm ${
                    businessMetrics.riskAssessment.level === 'Low' ? 'text-green-500' :
                    businessMetrics.riskAssessment.level === 'Medium' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {businessMetrics.riskAssessment.score}/100
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Risk assessment score
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Estimated Completion */}
      {businessMetrics?.estimatedCompletion && (
        <Card>
          <CardHeader>
            <CardTitle>Estimated Completion</CardTitle>
            <CardDescription>
              Based on current velocity and remaining work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Estimated completion date:</span>
                <span className="font-medium">
                  {new Date(businessMetrics.estimatedCompletion.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Days remaining:</span>
                <span className="font-medium">
                  {businessMetrics.estimatedCompletion.daysRemaining}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tasks remaining:</span>
                <span className="font-medium">
                  {taskMetrics.incomplete}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}