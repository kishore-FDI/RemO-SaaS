'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ComposedChart,
  CartesianGrid,
  Area,
  Line,
  XAxis,
  YAxis
} from 'recharts';

import { COLORS, CustomTooltip } from './AnalyticsHelperFunctions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

interface TaskStatusData {
  total: number;
  completed: number;
  incomplete: number;
  archived: number;
}

interface DueDateData {
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  dueLater: number;
  noDueDate: number;
}

interface CumulativeActivityDataItem {
  date: string;
  cumulativeCreated: number;
  cumulativeCompleted: number;
  backlog: number;
}

interface OverviewTabProps {
  taskStatusData: TaskStatusData;
  dueDateData: DueDateData;
  cumulativeActivityData: CumulativeActivityDataItem[];
}

const OverviewTab = React.memo(function OverviewTab({
  taskStatusData,
  dueDateData,
  cumulativeActivityData
}: OverviewTabProps) {
  const [isAnimationActive, setIsAnimationActive] = useState(true); // Track animation state

  const taskStatusChartData = useMemo(() => [
    { name: 'Completed', value: taskStatusData.completed },
    { name: 'Incomplete', value: taskStatusData.incomplete },
    { name: 'Archived', value: taskStatusData.archived }
  ].filter(item => item.value > 0), [taskStatusData]);

  const dueDateChartData = useMemo(() => [
    { name: 'Overdue', value: dueDateData.overdue },
    { name: 'Due Today', value: dueDateData.dueToday },
    { name: 'This Week', value: dueDateData.dueThisWeek },
    { name: 'Later', value: dueDateData.dueLater },
    { name: 'No Due Date', value: dueDateData.noDueDate }
  ].filter(item => item.value > 0), [dueDateData]);

  useEffect(() => {
    // Set animation to false after first load or tab switch
    const timeout = setTimeout(() => {
      setIsAnimationActive(false);
    }, 1000); // Set a small timeout for the initial animation

    return () => clearTimeout(timeout); // Cleanup timeout on unmount or re-render
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Pie Chart */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of all tasks by their current status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={isAnimationActive} 
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {taskStatusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-status-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Due Date Pie Chart */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Task Timeline</CardTitle>
            <CardDescription>Tasks by due date category</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dueDateChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={isAnimationActive} 
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dueDateChartData.map((entry, index) => (
                    <Cell
                      key={`cell-due-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Activity Chart */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Task Completion Progress</CardTitle>
          <CardDescription>
            Backlog and completion progress over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-80 min-w-0">
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
                isAnimationActive={isAnimationActive}  
              />
              <Area
                type="monotone"
                dataKey="cumulativeCompleted"
                name="Completed Tasks"
                fill="#82ca9d"
                stroke="#82ca9d"
                fillOpacity={0.3}
                isAnimationActive={isAnimationActive}  
              />
              <Line
                type="monotone"
                dataKey="backlog"
                name="Backlog"
                stroke="#ff7300"
                strokeWidth={2}
                isAnimationActive={isAnimationActive}  
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

export default OverviewTab;
