// components/KeyMetricsGrid.tsx
import { 
    Card, CardContent, CardHeader, CardTitle 
  } from "@/components/ui/card";
  import { Progress } from "@/components/ui/progress";
  import { 
    HoverCard, HoverCardContent, HoverCardTrigger 
  } from "@/components/ui/hover-card";
  import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
  import { ProjectHealth, ActivityTrends, TaskMetrics } from './AnalyticsTypes';
  
  interface KeyMetricsGridProps {
    projectHealth: ProjectHealth | null;
    taskMetrics: TaskMetrics;
    activityTrends: ActivityTrends | null;
    overdueTasksCount: number;
  }
  
  export const KeyMetricsGrid = ({ 
    projectHealth, 
    taskMetrics, 
    activityTrends, 
    overdueTasksCount 
  }: KeyMetricsGridProps) => {
    return (
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
                  {taskMetrics.total > 0 
                    ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) 
                    : 0}%
                </div>
                <div className="ml-2 text-sm text-muted-foreground">
                  {taskMetrics.completed}/{taskMetrics.total} tasks
                </div>
              </div>
              <Progress 
                value={taskMetrics.total > 0 
                  ? (taskMetrics.completed / taskMetrics.total) * 100 
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
                {activityTrends?.completed !== undefined ? 
                  `${activityTrends.completed >= 0 ? '+' : ''}${activityTrends.completed}%` : 
                  'N/A'}
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
                {overdueTasksCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Require attention
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };