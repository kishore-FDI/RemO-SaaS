import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
  Legend, AreaChart, Area, ReferenceLine
} from 'recharts'
import { CustomTooltip } from './AnalyticsHelperFunctions'

interface TaskActivityItem {
  date: string;
  created: number;
  completed: number;
}

interface CumulativeActivityItem {
  date: string;
  created: number;
  completed: number;
  cumulativeCreated: number;
  cumulativeCompleted: number;
  backlog: number;
}

interface ActivityTabProps {
  taskActivityData: TaskActivityItem[];
  cumulativeActivityData: CumulativeActivityItem[];
}

export default function ActivityTab({ taskActivityData, cumulativeActivityData }: ActivityTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Task Creation vs Completion</CardTitle>
            <CardDescription>
              Daily comparison of tasks created vs completed
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taskActivityData}
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
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="created" name="Tasks Created" fill="#8884d8" />
                <Bar dataKey="completed" name="Tasks Completed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Velocity Trend</CardTitle>
            <CardDescription>
              7-day moving average of task completion rate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cumulativeActivityData.map((day, index, arr) => {
                  // Calculate 7-day moving average for completion
                  const startIdx = Math.max(0, index - 6);
                  const period = arr.slice(startIdx, index + 1);
                  const avgCompleted = period.reduce((sum, d) => sum + d.completed, 0) / period.length;
                  
                  return {
                    ...day,
                    avgCompleted: parseFloat(avgCompleted.toFixed(1))
                  };
                })}
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
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Tasks Completed" 
                  stroke="#82ca9d" 
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCompleted" 
                  name="7-day Average" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                  dot={false}
                />
                <ReferenceLine 
                  y={cumulativeActivityData.reduce((sum, day) => sum + day.completed, 0) / cumulativeActivityData.length} 
                  label="Average" 
                  stroke="red" 
                  strokeDasharray="3 3" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Project Burndown</CardTitle>
          <CardDescription>
            Cumulative view of project task completion over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cumulativeActivityData}
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
              <Area 
                type="monotone" 
                dataKey="backlog" 
                name="Remaining Tasks" 
                fill="#ff7300" 
                stroke="#ff7300" 
                fillOpacity={0.3} 
              />
              <Area 
                type="monotone" 
                dataKey="cumulativeCompleted" 
                name="Completed Tasks" 
                fill="#82ca9d" 
                stroke="#82ca9d" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}