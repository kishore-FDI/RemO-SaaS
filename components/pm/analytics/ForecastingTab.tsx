// ForecastingTab.tsx
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { 
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, Line, Scatter, ReferenceLine, ResponsiveContainer 
} from 'recharts'

// Types
type TimeSeriesAnalysis = {
  forecast: {
    dates: string[]
    created: number[]
    completed: number[]
  }
  seasonality: {
    created: {
      hasSeasonality: boolean
      pattern: number[]
    }
    completed: {
      hasSeasonality: boolean
      pattern: number[]
    }
  }
  anomalies: {
    created: Array<{ index: number, value: number }>
    completed: Array<{ index: number, value: number }>
  }
  movingAverages: {
    created: number[]
    completed: number[]
  }
}

type TaskActivity = {
  date: string
  created: number
  completed: number
}

type ForecastingTabProps = {
  timeSeriesAnalysis?: TimeSeriesAnalysis
  taskActivityData: TaskActivity[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
        {payload[0].payload.isForecast && (
          <p className="text-xs text-muted-foreground mt-1">Forecasted data</p>
        )}
      </div>
    );
  }
  return null;
};

export default function ForecastingTab({ timeSeriesAnalysis, taskActivityData }: ForecastingTabProps) {
  return (
    <div className="space-y-6">
      {timeSeriesAnalysis ? (
        <>
          {/* Task Forecast Chart */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Task Forecast (Next 7 Days)</CardTitle>
              <CardDescription>
                Predicted task creation and completion based on historical patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    ...taskActivityData.slice(-14),
                    ...timeSeriesAnalysis.forecast.dates.map((date, i) => ({
                      date,
                      created: timeSeriesAnalysis?.forecast.created[i] || 0,
                      completed: timeSeriesAnalysis?.forecast.completed[i] || 0,
                      isForecast: true
                    }))
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="created" name="Actual Created" fill="#8884d8" />
                  <Bar dataKey="completed" name="Actual Completed" fill="#82ca9d" />
                  <Line 
                    dataKey="created" 
                    name="Forecast Created" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    connectNulls
                  />
                  <Line 
                    dataKey="completed" 
                    name="Forecast Completed" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Seasonality Analysis */}
          {(timeSeriesAnalysis.seasonality.created.hasSeasonality || 
            timeSeriesAnalysis.seasonality.completed.hasSeasonality) && (
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Weekly Patterns</CardTitle>
                <CardDescription>
                  Detected seasonality in task creation and completion
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      
                      return timeSeriesAnalysis?.seasonality.created.pattern.map((val, i) => ({
                        day: dayNames[(startOfWeek.getDay() + i) % 7],
                        created: val,
                        completed: timeSeriesAnalysis?.seasonality.completed.pattern[i] || 0
                      }));
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="created" name="Avg. Created" fill="#8884d8" />
                    <Bar dataKey="completed" name="Avg. Completed" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          
          {/* Anomaly Detection */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                Unusual patterns in task activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={taskActivityData.map((day, i) => ({
                    ...day,
                    isCompletedAnomaly: timeSeriesAnalysis?.anomalies.completed.some(a => a.index === i),
                    isCreatedAnomaly: timeSeriesAnalysis?.anomalies.created.some(a => a.index === i),
                    avgCompleted: timeSeriesAnalysis?.movingAverages.completed[Math.max(0, i - 3)] || null,
                    avgCreated: timeSeriesAnalysis?.movingAverages.created[Math.max(0, i - 3)] || null
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="created" name="Tasks Created" fill="#8884d8" />
                  <Bar dataKey="completed" name="Tasks Completed" fill="#82ca9d" />
                  <Line 
                    type="monotone" 
                    dataKey="avgCreated" 
                    name="Avg. Created" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgCompleted" 
                    name="Avg. Completed" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Scatter 
                    dataKey="completed" 
                    data={taskActivityData
                      .map((day, i) => ({
                        ...day,
                        completed: timeSeriesAnalysis?.anomalies.completed.some(a => a.index === i) ? day.completed : null
                      }))
                      .filter(day => day.completed !== null)
                    }
                    fill="red"
                    name="Completion Anomalies"
                  />
                  <Scatter 
                    dataKey="created" 
                    data={taskActivityData
                      .map((day, i) => ({
                        ...day,
                        created: timeSeriesAnalysis?.anomalies.created.some(a => a.index === i) ? day.created : null
                      }))
                      .filter(day => day.created !== null)
                    }
                    fill="orange"
                    name="Creation Anomalies"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Forecasting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Not enough historical data to generate forecasts. Continue using the project to enable forecasting features.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}