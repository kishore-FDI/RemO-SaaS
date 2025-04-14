import { AnalyticsData,CustomTooltipProps } from './AnalyticsTypes';
import React from 'react';
export const calculateTrends = (data: AnalyticsData['taskActivityOverTime']) => {
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

export const calculateProjectHealth = (data: AnalyticsData) => {
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
export const CustomTooltip = React.memo(({ active, payload, label }: CustomTooltipProps) => {
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
});

export const calculateCumulativeActivityData = (data: AnalyticsData['taskActivityOverTime']) => {
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

export const COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo-500
];