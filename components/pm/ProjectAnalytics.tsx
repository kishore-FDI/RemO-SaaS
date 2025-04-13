'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { RefreshCcw, ArrowLeft, Calendar, Clock, Zap, TrendingUp, Award, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Scatter, ScatterChart, ReferenceLine, ComposedChart 
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types
type AnalyticsData = {
  project: {
    id: string
    title: string
    description: string
    createdAt: string
    updatedAt: string
  }
  taskMetrics: {
    total: number
    completed: number
    incomplete: number
    archived: number
  }
  tasksByDueDate: {
    overdue: number
    dueToday: number
    dueThisWeek: number
    dueLater: number
    noDueDate: number
  }
  taskActivityOverTime: {
    date: string
    created: number
    completed: number
  }[]
  memberPerformance: {
    userId: string
    name: string
    tasksAssigned: number
    tasksCompleted: number
  }[]
}

type CustomTooltipProps = {
  active?: boolean
  payload?: any[]
  label?: string
}

// Enhanced data calculation utilities
const calculateTrends = (data: AnalyticsData['taskActivityOverTime']) => {
  if (!data || data.length < 2) return { created: 0, completed: 0 };
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfCreated = firstHalf.reduce((acc, day) => acc + day.created, 0);
  const secondHalfCreated = secondHalf.reduce((acc, day) => acc + day.created, 0);
  
  const firstHalfCompleted = firstHalf.reduce((acc, day) => acc + day.completed, 0);
  const secondHalfCompleted = secondHalf.reduce((acc, day) => acc + day.completed, 0);
  
  const createdTrend = firstHalfCreated === 0 ? 
    secondHalfCreated * 100 : 
    ((secondHalfCreated - firstHalfCreated) / firstHalfCreated) * 100;
    
  const completedTrend = firstHalfCompleted === 0 ? 
    secondHalfCompleted * 100 : 
    ((secondHalfCompleted - firstHalfCompleted) / firstHalfCompleted) * 100;
  
  return {
    created: Math.round(createdTrend),
    completed: Math.round(completedTrend)
  };
};

const calculateProjectHealth = (data: AnalyticsData) => {
  // Define weights
  const weights = {
    completionRate: 0.4,
    overdueRate: 0.3,
    activityLevel: 0.3
  };
  
  // Calculate completion rate (0-100)
  const completionRate = data.taskMetrics.total > 0 ? 
    (data.taskMetrics.completed / data.taskMetrics.total) * 100 : 0;
  
  // Calculate overdue rate (0-100, inversed so higher is better)
  const totalActiveTasks = data.taskMetrics.total - data.taskMetrics.archived;
  const overdueRate = totalActiveTasks > 0 ? 
    100 - ((data.tasksByDueDate.overdue / totalActiveTasks) * 100) : 100;
  
  // Calculate recent activity level (0-100)
  const recentDays = data.taskActivityOverTime.slice(-7);
  const maxActivity = 10; // Assuming 10 tasks per day is very active
  const avgActivity = recentDays.reduce((acc, day) => 
    acc + day.created + day.completed, 0) / (recentDays.length * 2);
  const activityLevel = Math.min((avgActivity / maxActivity) * 100, 100);
  
  // Calculate weighted health score
  const healthScore = (
    completionRate * weights.completionRate + 
    overdueRate * weights.overdueRate + 
    activityLevel * weights.activityLevel
  );
  
  // Determine health status
  let healthStatus;
  if (healthScore >= 80) healthStatus = 'Excellent';
  else if (healthScore >= 60) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Fair';
  else healthStatus = 'Needs Attention';
  
  return {
    score: Math.round(healthScore),
    status: healthStatus,
    details: {
      completionRate: Math.round(completionRate),
      overdueRate: Math.round(overdueRate),
      activityLevel: Math.round(activityLevel)
    }
  };
};

// Enhanced visualization components
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const calculateCumulativeActivityData = (data: AnalyticsData['taskActivityOverTime']) => {
  let cumCreated = 0;
  let cumCompleted = 0;
  
  return data.map(day => {
    cumCreated += day.created;
    cumCompleted += day.completed;
    
    return {
      ...day,
      cumulativeCreated: cumCreated,
      cumulativeCompleted: cumCompleted,
      backlog: cumCreated - cumCompleted
    };
  });
};

const COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo-500
];

export default function ProjectAnalytics({ projectId, onBack }: { projectId: string, onBack: () => void }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7days' | '14days' | '30days'>('14days')
  const router = useRouter()

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/projects/analytics?projectId=${projectId}&timeRange=${timeRange}`)
      const data = await res.json()
      
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

  // Computed metrics
  const projectHealth = useMemo(() => 
    analyticsData ? calculateProjectHealth(analyticsData) : null, 
    [analyticsData]
  );
  
  const activityTrends = useMemo(() => 
    analyticsData ? calculateTrends(analyticsData.taskActivityOverTime) : null,
    [analyticsData]
  );
  
  const cumulativeActivityData = useMemo(() => 
    analyticsData ? calculateCumulativeActivityData(analyticsData.taskActivityOverTime) : [],
    [analyticsData]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-72 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="h-72">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error loading analytics</h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
          <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    )
  }

  if (!analyticsData) return null

  // Prepare data for visualizations
  const taskStatusData = [
    { name: 'Completed', value: analyticsData.taskMetrics.completed },
    { name: 'Incomplete', value: analyticsData.taskMetrics.incomplete },
    { name: 'Archived', value: analyticsData.taskMetrics.archived }
  ].filter(item => item.value > 0);

  const dueDateData = [
    { name: 'Overdue', value: analyticsData.tasksByDueDate.overdue },
    { name: 'Due Today', value: analyticsData.tasksByDueDate.dueToday },
    { name: 'This Week', value: analyticsData.tasksByDueDate.dueThisWeek },
    { name: 'Later', value: analyticsData.tasksByDueDate.dueLater },
    { name: 'No Due Date', value: analyticsData.tasksByDueDate.noDueDate }
  ].filter(item => item.value > 0);
  
  // Prepare member performance for radar chart
  const memberRadarData = analyticsData.memberPerformance.map(member => {
    // Calculate completion rate
    const completionRate = member.tasksAssigned > 0 ? 
      Math.round((member.tasksCompleted / member.tasksAssigned) * 100) : 0;
    
    return {
      name: member.name,
      tasksAssigned: member.tasksAssigned,
      tasksCompleted: member.tasksCompleted,
      completionRate
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{analyticsData.project.title}</h2>
          <p className="text-muted-foreground mt-1">
            Advanced analytics and performance insights
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[150px]">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-sm font-medium">Project Health</CardTitle>
              <HoverCard>
                <HoverCardTrigger><Zap className="w-4 h-4 text-primary" /></HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Health Score Components</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{projectHealth?.details.completionRate}%</span>
                      </div>
                      <Progress value={projectHealth?.details.completionRate} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>On-Time Performance</span>
                        <span>{projectHealth?.details.overdueRate}%</span>
                      </div>
                      <Progress value={projectHealth?.details.overdueRate} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Activity Level</span>
                        <span>{projectHealth?.details.activityLevel}%</span>
                      </div>
                      <Progress value={projectHealth?.details.activityLevel} />
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">{projectHealth?.score}%</div>
              <div className={`ml-2 text-sm ${
                projectHealth?.status === 'Excellent' ? 'text-green-500' :
                projectHealth?.status === 'Good' ? 'text-blue-500' :
                projectHealth?.status === 'Fair' ? 'text-amber-500' : 'text-red-500'
              }`}>
                {projectHealth?.status}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">
                  {analyticsData.taskMetrics.total > 0 
                    ? Math.round((analyticsData.taskMetrics.completed / analyticsData.taskMetrics.total) * 100) 
                    : 0}%
                </div>
                <div className="ml-2 text-sm text-muted-foreground">
                  {analyticsData.taskMetrics.completed}/{analyticsData.taskMetrics.total} tasks
                </div>
              </div>
              <Progress 
                value={analyticsData.taskMetrics.total > 0 
                  ? (analyticsData.taskMetrics.completed / analyticsData.taskMetrics.total) * 100 
                  : 0} 
                className="h-1.5 mt-2"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-sm font-medium">Task Velocity</CardTitle>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold">
                {activityTrends?.completed >= 0 ? '+' : ''}{activityTrends?.completed}%
              </div>
              <div className="text-sm text-muted-foreground">
                Completion trend
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold">
                {analyticsData.tasksByDueDate.overdue}
              </div>
              <div className="text-sm text-muted-foreground">
                Require attention
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of all tasks by their current status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry, index) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Task Timeline</CardTitle>
                <CardDescription>
                  Tasks by due date category
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dueDateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dueDateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry, index) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Task Completion Progress</CardTitle>
              <CardDescription>
                Backlog and completion progress over time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
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
                    dataKey="cumulativeCreated" 
                    name="Total Tasks" 
                    fill="#8884d8" 
                    stroke="#8884d8" 
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
                  <Line 
                    type="monotone" 
                    dataKey="backlog" 
                    name="Backlog" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Trends Tab */}
        <TabsContent value="activity" className="space-y-6">
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
                    data={analyticsData.taskActivityOverTime}
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
                    <ReferenceLine y={cumulativeActivityData.reduce((sum, day) => sum + day.completed, 0) / cumulativeActivityData.length} 
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
        </TabsContent>
        
        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Team Workload Distribution</CardTitle>
                <CardDescription>
                  Tasks assigned to each team member
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.memberPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="tasksAssigned" name="Assigned" fill="#8884d8" />
                    <Bar dataKey="tasksCompleted" name="Completed" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Completion Rate by Member</CardTitle>
                <CardDescription>
                  Performance analysis of team members
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={90} 
                    width={500} 
                    height={300} 
                    data={memberRadarData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar 
                      name="Completion Rate (%)" 
                      dataKey="completionRate" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Team Member Performance Matrix</CardTitle>
              <CardDescription>
                Relationship between tasks assigned and completion efficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    dataKey="tasksAssigned" 
                    name="Tasks Assigned" 
                    domain={[0, 'dataMax + 2']}
                    label={{ value: 'Tasks Assigned', position: 'insideBottom', offset: -10 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="completionRate" 
                    name="Completion Rate" 
                    domain={[0, 100]}
                    label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background p-3 border rounded-md shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Assigned: {data.tasksAssigned} tasks</p>
                            <p className="text-sm">Completed: {data.tasksCompleted} tasks</p>
                            <p className="text-sm">Completion Rate: {data.completionRate}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Scatter 
                    name="Team Members" 
                    data={memberRadarData} 
                    fill="#8884d8"
                    shape="circle"
                  >
                    {memberRadarData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Scatter>
                  {/* Reference lines for average values */}
                  {memberRadarData.length > 0 && (
                    <>
                      <ReferenceLine 
                        x={memberRadarData.reduce((sum, m) => sum + m.tasksAssigned, 0) / memberRadarData.length} 
                        stroke="#666" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Avg Assigned', position: 'top' }} 
                      />
                      <ReferenceLine 
                        y={memberRadarData.reduce((sum, m) => sum + m.completionRate, 0) / memberRadarData.length} 
                        stroke="#666" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Avg Rate', position: 'right' }} 
                      />
                    </>
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Team Members Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsData.memberPerformance.map((member, index) => {
              const completionRate = member.tasksAssigned > 0 ? 
                Math.round((member.tasksCompleted / member.tasksAssigned) * 100) : 0;
                
              // Determine performance status
              let performanceStatus;
              if (completionRate >= 80) performanceStatus = 'Excellent';
              else if (completionRate >= 60) performanceStatus = 'Good';
              else if (completionRate >= 40) performanceStatus = 'Fair';
              else performanceStatus = 'Needs Attention';
              
              return (
                <Card key={member.userId} className={`border-l-4 ${
                  performanceStatus === 'Excellent' ? 'border-l-green-500' :
                  performanceStatus === 'Good' ? 'border-l-blue-500' :
                  performanceStatus === 'Fair' ? 'border-l-amber-500' : 'border-l-red-500'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">{member.name}</CardTitle>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        performanceStatus === 'Excellent' ? 'bg-green-100 text-green-800' :
                        performanceStatus === 'Good' ? 'bg-blue-100 text-blue-800' :
                        performanceStatus === 'Fair' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {performanceStatus}
                      </div>
                    </div>
                    <CardDescription>{member.tasksAssigned} tasks assigned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="text-sm font-medium">{completionRate}%</span>
                      </div>
                      <Progress 
                        value={completionRate}
                        className={`h-2 ${
                          performanceStatus === 'Excellent' ? 'bg-green-100' :
                          performanceStatus === 'Good' ? 'bg-blue-100' :
                          performanceStatus === 'Fair' ? 'bg-amber-100' : 'bg-red-100'
                        }`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>{member.tasksCompleted} completed</span>
                        <span>{member.tasksAssigned - member.tasksCompleted} remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Project Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p>{analyticsData.project.description || 'No description provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
              <p>{new Date(analyticsData.project.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
              <p>{new Date(analyticsData.project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}