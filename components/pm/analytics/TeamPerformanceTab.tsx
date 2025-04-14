import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, 
  CartesianGrid, ReferenceLine, Cell
} from 'recharts'
import { COLORS, CustomTooltip } from './AnalyticsHelperFunctions'

interface MemberPerformance {
  userId: string;
  name: string;
  tasksAssigned: number;
  tasksCompleted: number;
}

interface TeamPerformanceTabProps {
  memberPerformance: MemberPerformance[];
}

export default function TeamPerformanceTab({ memberPerformance }: TeamPerformanceTabProps) {
  // Prepare member performance for radar chart
  const memberRadarData = memberPerformance.map(member => {
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
    <div className="space-y-6">
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
                data={memberPerformance}
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
        {memberPerformance.map((member) => {
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
    </div>
  );
}