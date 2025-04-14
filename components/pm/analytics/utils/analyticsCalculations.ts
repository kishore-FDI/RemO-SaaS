// utils/analyticsCalculations.ts
import { TaskActivity, AnalyticsData, ProjectHealth, ActivityTrends, CumulativeActivity, TaskMetrics, TasksByDueDate } from '../AnalyticsTypes';

// Colors for charts
export const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const calculateProjectHealth = (data: AnalyticsData): ProjectHealth => {
  // Calculate completion rate
  const completionRate = data.taskMetrics.total > 0 
    ? Math.round((data.taskMetrics.completed / data.taskMetrics.total) * 100) 
    : 0;
  
  // Calculate overdue rate (inverse - higher is better)
  const totalWithDueDate = data.taskMetrics.total - data.tasksByDueDate.noDueDate;
  const overdueRate = totalWithDueDate > 0 
    ? Math.max(0, 100 - Math.round((data.tasksByDueDate.overdue / totalWithDueDate) * 100))
    : 100;
  
  // Calculate activity level based on recent activity
  const recentDays = Math.min(7, data.taskActivityOverTime.length);
  const recentActivity = data.taskActivityOverTime.slice(-recentDays);
  
  const totalPossibleActivityDays = recentDays * 2; // both creation and completion for each day
  const daysWithActivity = recentActivity.reduce((count, day) => {
    return count + (day.created > 0 ? 1 : 0) + (day.completed > 0 ? 1 : 0);
  }, 0);
  
  const activityLevel = Math.round((daysWithActivity / totalPossibleActivityDays) * 100);
  
  // Calculate overall health score (weighted average)
  const score = Math.round((completionRate * 0.4) + (overdueRate * 0.4) + (activityLevel * 0.2));
  
  // Determine status based on score
  let status: ProjectHealth['status'] = 'Needs Improvement';
  if (score >= 80) status = 'Excellent';
  else if (score >= 65) status = 'Good';
  else if (score >= 50) status = 'Fair';
  
  return {
    score,
    status,
    details: {
      completionRate,
      overdueRate,
      activityLevel
    }
  };
};

export const calculateTrends = (activityData: TaskActivity[]): ActivityTrends => {
  if (activityData.length < 2) {
    return { created: 0, completed: 0 };
  }
  
  // Get data for current period and previous period
  const halfLength = Math.floor(activityData.length / 2);
  const currentPeriod = activityData.slice(-halfLength);
  const previousPeriod = activityData.slice(-halfLength * 2, -halfLength);
  
  // Calculate sums for each period
  const currentCreated = currentPeriod.reduce((sum, day) => sum + day.created, 0);
  const previousCreated = previousPeriod.reduce((sum, day) => sum + day.created, 0);
  
  const currentCompleted = currentPeriod.reduce((sum, day) => sum + day.completed, 0);
  const previousCompleted = previousPeriod.reduce((sum, day) => sum + day.completed, 0);
  
  // Calculate percentage changes
  const createdChange = previousCreated === 0 
    ? 100 
    : Math.round(((currentCreated - previousCreated) / previousCreated) * 100);
    
  const completedChange = previousCompleted === 0 
    ? 100 
    : Math.round(((currentCompleted - previousCompleted) / previousCompleted) * 100);
  
  return {
    created: createdChange,
    completed: completedChange
  };
};

export const calculateCumulativeActivityData = (activityData: TaskActivity[]): CumulativeActivity[] => {
  let cumulativeCreated = 0;
  let cumulativeCompleted = 0;
  
  return activityData.map(day => {
    cumulativeCreated += day.created;
    cumulativeCompleted += day.completed;
    
    return {
      ...day,
      cumulativeCreated,
      cumulativeCompleted,
      backlog: cumulativeCreated - cumulativeCompleted
    };
  });
};

export const getFormattedTaskStatusData = (taskMetrics: TaskMetrics) => {
  return [
    { name: 'Completed', value: taskMetrics.completed },
    { name: 'Incomplete', value: taskMetrics.incomplete },
    { name: 'Archived', value: taskMetrics.archived }
  ].filter(item => item.value > 0);
};

export const getFormattedDueDateData = (tasksByDueDate: TasksByDueDate) => {
  return [
    { name: 'Overdue', value: tasksByDueDate.overdue },
    { name: 'Due Today', value: tasksByDueDate.dueToday },
    { name: 'This Week', value: tasksByDueDate.dueThisWeek },
    { name: 'Later', value: tasksByDueDate.dueLater },
    { name: 'No Due Date', value: tasksByDueDate.noDueDate }
  ].filter(item => item.value > 0);
};