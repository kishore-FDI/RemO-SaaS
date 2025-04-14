// app/api/projects/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper functions for advanced analytics
const calculateLinearRegression = (data: Array<{x: number, y: number}>) => {
  // Simple linear regression implementation
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  // Calculate means
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  // Calculate coefficients
  const ssXY = data.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const ssXX = data.reduce((sum, point) => sum + (point.x - meanX) * (point.x - meanX), 0);
  const ssYY = data.reduce((sum, point) => sum + (point.y - meanY) * (point.y - meanY), 0);
  
  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const r2 = Math.pow(ssXY, 2) / (ssXX * ssYY); // R-squared value
  
  return { slope, intercept, r2 };
};

const detectAnomalies = (data: number[], threshold = 2) => {
  // Z-score anomaly detection
  if (data.length < 3) return [];
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squareDiffs = data.map(val => Math.pow(val - mean, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / data.length);
  
  return data.map((val, index) => {
    const zScore = Math.abs((val - mean) / stdDev);
    return { value: val, index, isAnomaly: zScore > threshold, zScore };
  }).filter(item => item.isAnomaly);
};

const forecastValues = (data: number[], periods = 7) => {
  if (data.length < 10) return Array(periods).fill(null);
  
  // Convert to x,y format for regression
  const xyData = data.map((y, x) => ({ x, y }));
  const { slope, intercept } = calculateLinearRegression(xyData);
  
  // Generate forecast
  return Array.from({ length: periods }, (_, i) => {
    const forecastX = data.length + i;
    return Math.max(0, Math.round((slope * forecastX + intercept) * 10) / 10);
  });
};

const calculateMovingAverage = (data: number[], window = 7) => {
  if (data.length < window) return [];
  
  const result = [];
  for (let i = 0; i <= data.length - window; i++) {
    const windowSlice = data.slice(i, i + window);
    const avg = windowSlice.reduce((sum, val) => sum + val, 0) / window;
    result.push(Math.round(avg * 10) / 10);
  }
  
  return result;
};

const calculateSeasonality = (data: number[], period = 7) => {
  if (data.length < period * 2) return { hasSeasonality: false, pattern: [] };
  
  // Simple seasonality detection by comparing patterns
  const patterns = [];
  for (let i = 0; i < Math.floor(data.length / period); i++) {
    patterns.push(data.slice(i * period, (i + 1) * period));
  }
  
  // Calculate average pattern
  const avgPattern = Array(period).fill(0);
  patterns.forEach(pattern => {
    pattern.forEach((val, idx) => {
      avgPattern[idx] += val / patterns.length;
    });
  });
  
  // Calculate correlation between actual data and seasonal pattern
  let seasonalityStrength = 0;
  for (let i = 0; i < Math.min(data.length, period * 3); i++) {
    const patternIdx = i % period;
    const correlation = data[i] / (avgPattern[patternIdx] || 1);
    seasonalityStrength += Math.abs(correlation - 1);
  }
  
  seasonalityStrength = 1 - (seasonalityStrength / (period * 3));
  
  return {
    hasSeasonality: seasonalityStrength > 0.7,
    strength: Math.round(seasonalityStrength * 100) / 100,
    pattern: avgPattern.map(val => Math.round(val * 10) / 10)
  };
};

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user using Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get projectId and timeRange from request parameters
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const timeRange = searchParams.get('timeRange') || '14days'
    
    // Parse the time range
    const daysToInclude = timeRange === '7days' ? 7 : 
                         timeRange === '30days' ? 30 : 14; // Default to 14 days

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch the project with tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              include: {
                user: true
              }
            }
          }
        },
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access to this project
    const userIsMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    })

    const userIsCompanyMember = await prisma.companyMember.findFirst({
      where: {
        companyId: project.companyId,
        userId
      }
    })

    if (!userIsMember && !userIsCompanyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate task metrics
    const taskMetrics = {
      total: project.tasks.length,
      completed: project.tasks.filter(task => task.completed).length,
      incomplete: project.tasks.filter(task => !task.completed && !task.archived).length,
      archived: project.tasks.filter(task => task.archived).length
    }

    // Calculate tasks by due date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
    
    const tasksByDueDate = {
      overdue: project.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < today && !task.completed
      ).length,
      dueToday: project.tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) >= today && 
        new Date(task.dueDate) <= endOfToday && 
        !task.completed
      ).length,
      dueThisWeek: project.tasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) > endOfToday && 
        new Date(task.dueDate) <= endOfWeek && 
        !task.completed
      ).length,
      dueLater: project.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) > endOfWeek && !task.completed
      ).length,
      noDueDate: project.tasks.filter(task => !task.dueDate && !task.completed).length
    }

    // Calculate task activity over time (based on requested timeRange)
    const dates = []
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      dates.push(date)
    }

    const taskActivityOverTime = dates.map(date => {
      const nextDay = new Date(date)
      nextDay.setDate(date.getDate() + 1)
      
      const dateString = date.toISOString().split('T')[0]
      
      return {
        date: dateString,
        created: project.tasks.filter(task => {
          const createdDate = new Date(task.createdAt)
          return createdDate >= date && createdDate < nextDay
        }).length,
        completed: project.tasks.filter(task => {
          if (!task.completed) return false
          // For completed tasks, we're approximating completion date using updatedAt
          const completedDate = new Date(task.updatedAt)
          return completedDate >= date && completedDate < nextDay && task.completed
        }).length
      }
    })

    // Calculate member performance with enhanced metrics
    const memberPerformance = project.members.map(member => {
      const memberTasks = project.tasks.filter(task => 
        task.assignedTo === member.id
      )
      
      const tasksAssigned = memberTasks.length
      const tasksCompleted = memberTasks.filter(task => task.completed).length
      
      // Calculate average completion time (in days)
      let avgCompletionTime = null
      const completedTasks = memberTasks.filter(task => task.completed)
      
      if (completedTasks.length > 0) {
        const totalCompletionTime = completedTasks.reduce((sum, task) => {
          const createdDate = new Date(task.createdAt).getTime()
          const completedDate = new Date(task.updatedAt).getTime()
          return sum + (completedDate - createdDate) / (1000 * 60 * 60 * 24) // Convert ms to days
        }, 0)
        
        avgCompletionTime = Math.round((totalCompletionTime / completedTasks.length) * 10) / 10 // Round to 1 decimal
      }
      
      // Tasks overdue
      const tasksOverdue = memberTasks.filter(task => 
        !task.completed && task.dueDate && new Date(task.dueDate) < today
      ).length
      
      return {
        userId: member.userId,
        name: member.user.name,
        tasksAssigned,
        tasksCompleted,
        avgCompletionTime,
        tasksOverdue
      }
    }).filter(member => member.tasksAssigned > 0)

    // Extract time series data for analysis
    const completedByDay = taskActivityOverTime.map(day => day.completed);
    const createdByDay = taskActivityOverTime.map(day => day.created);
    const backlogByDay = taskActivityOverTime.map((day, index) => {
      const createdSoFar = createdByDay.slice(0, index + 1).reduce((sum, val) => sum + val, 0);
      const completedSoFar = completedByDay.slice(0, index + 1).reduce((sum, val) => sum + val, 0);
      return createdSoFar - completedSoFar;
    });
    
    // Calculate time series metrics
    const timeSeriesAnalysis = {
      // Trend analysis
      trends: {
        created: calculateLinearRegression(createdByDay.map((y, x) => ({ x, y }))),
        completed: calculateLinearRegression(completedByDay.map((y, x) => ({ x, y }))),
        backlog: calculateLinearRegression(backlogByDay.map((y, x) => ({ x, y })))
      },
      
      // Moving averages
      movingAverages: {
        created: calculateMovingAverage(createdByDay, Math.min(7, Math.floor(createdByDay.length / 2))),
        completed: calculateMovingAverage(completedByDay, Math.min(7, Math.floor(completedByDay.length / 2)))
      },
      
      // Anomaly detection
      anomalies: {
        created: detectAnomalies(createdByDay),
        completed: detectAnomalies(completedByDay)
      },
      
      // Seasonality detection
      seasonality: {
        created: calculateSeasonality(createdByDay),
        completed: calculateSeasonality(completedByDay)
      },
      
      // Forecasting
      forecast: {
        created: forecastValues(createdByDay, 7),
        completed: forecastValues(completedByDay, 7),
        dates: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return date.toISOString().split('T')[0];
        })
      }
    };
    
    // Calculate AI-powered insights
    const aiInsights = [];
    
    // Insight 1: Project velocity trend
    const velocityTrend = timeSeriesAnalysis.trends.completed.slope;
    if (velocityTrend > 0.1) {
      aiInsights.push({
        type: 'positive',
        title: 'Increasing Velocity',
        description: 'Task completion rate is trending upward, indicating improved team productivity.',
        metric: `+${Math.round(velocityTrend * 100) / 100} tasks/day`
      });
    } else if (velocityTrend < -0.1) {
      aiInsights.push({
        type: 'negative',
        title: 'Decreasing Velocity',
        description: 'Task completion rate is trending downward. Consider checking for blockers or team capacity issues.',
        metric: `${Math.round(velocityTrend * 100) / 100} tasks/day`
      });
    }
    
    // Insight 2: Backlog growth
    const backlogTrend = timeSeriesAnalysis.trends.backlog.slope;
    if (backlogTrend > 0.2) {
      aiInsights.push({
        type: 'warning',
        title: 'Growing Backlog',
        description: 'Your backlog is growing faster than completion rate. Consider scope management or increasing capacity.',
        metric: `+${Math.round(backlogTrend * 100) / 100} tasks/day`
      });
    } else if (backlogTrend < -0.1) {
      aiInsights.push({
        type: 'positive',
        title: 'Shrinking Backlog',
        description: 'Your team is completing tasks faster than new ones are being added, reducing the backlog.',
        metric: `${Math.round(backlogTrend * 100) / 100} tasks/day`
      });
    }
    
    // Insight 3: Overdue tasks
    const overduePercentage = taskMetrics.total > 0 ? 
      (tasksByDueDate.overdue / taskMetrics.total) * 100 : 0;
    if (overduePercentage > 20) {
      aiInsights.push({
        type: 'warning',
        title: 'High Overdue Rate',
        description: `${Math.round(overduePercentage)}% of tasks are overdue. Consider reviewing due dates or reallocating resources.`,
        metric: `${tasksByDueDate.overdue} tasks`
      });
    }
    
    // Insight 4: Team workload balance
    if (memberPerformance.length > 1) {
      const taskCounts = memberPerformance.map(m => m.tasksAssigned);
      const maxTasks = Math.max(...taskCounts);
      const minTasks = Math.min(...taskCounts);
      const taskDisparity = maxTasks / (minTasks || 1);
      
      if (taskDisparity > 3) {
        const mostTasksMember = memberPerformance.find(m => m.tasksAssigned === maxTasks);
        const fewestTasksMember = memberPerformance.find(m => m.tasksAssigned === minTasks);
        
        aiInsights.push({
          type: 'warning',
          title: 'Unbalanced Workload',
          description: `Workload is unevenly distributed. ${mostTasksMember?.name} has ${maxTasks} tasks while ${fewestTasksMember?.name} has only ${minTasks}.`,
          metric: `${Math.round(taskDisparity * 10) / 10}x difference`
        });
      }
    }
    
    // Insight 5: Anomaly detection
    const completedAnomalies = timeSeriesAnalysis.anomalies.completed;
    if (completedAnomalies.length > 0) {
      const latestAnomaly = completedAnomalies[completedAnomalies.length - 1];
      const anomalyDate = taskActivityOverTime[latestAnomaly.index]?.date;
      
      if (anomalyDate && latestAnomaly.index >= taskActivityOverTime.length - 7) {
        aiInsights.push({
          type: latestAnomaly.value > 0 ? 'positive' : 'negative',
          title: latestAnomaly.value > 0 ? 'Productivity Spike' : 'Productivity Drop',
          description: `Unusual ${latestAnomaly.value > 0 ? 'increase' : 'decrease'} in task completion detected on ${anomalyDate}.`,
          metric: `${latestAnomaly.value} tasks`
        });
      }
    }
    
    // Insight 6: Seasonality patterns
    if (timeSeriesAnalysis.seasonality.completed.hasSeasonality) {
      const pattern = timeSeriesAnalysis.seasonality.completed.pattern;
      // @ts-ignore
      const maxDay = pattern.indexOf(Math.max(...pattern));
      // @ts-ignore
      const minDay = pattern.indexOf(Math.min(...pattern));
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const maxDayName = dayNames[(startOfWeek.getDay() + maxDay) % 7];
      const minDayName = dayNames[(startOfWeek.getDay() + minDay) % 7];
      
      aiInsights.push({
        type: 'insight',
        title: 'Weekly Pattern Detected',
        description: `Team productivity tends to peak on ${maxDayName}s and dip on ${minDayName}s.`,
        // @ts-ignore
        metric: `${Math.round(timeSeriesAnalysis.seasonality.completed.strength * 100)}% confidence`
      });
    }
    
    // Calculate business metrics
    const businessMetrics = {
      // Cycle time (average days to complete a task)
      cycleTime: (() => {
        const completedTasks = project.tasks.filter(task => task.completed);
        if (completedTasks.length === 0) return null;
        
        const totalDays = completedTasks.reduce((sum, task) => {
          const createdDate = new Date(task.createdAt).getTime();
          const completedDate = new Date(task.updatedAt).getTime();
          return sum + (completedDate - createdDate) / (1000 * 60 * 60 * 24); // ms to days
        }, 0);
        
        return Math.round((totalDays / completedTasks.length) * 10) / 10;
      })(),
      
      // Throughput (tasks completed per day over the time period)
      throughput: (() => {
        const totalCompleted = completedByDay.reduce((sum, val) => sum + val, 0);
        return Math.round((totalCompleted / daysToInclude) * 10) / 10;
      })(),
      
      // Estimated completion date (for all current tasks)
      estimatedCompletion: (() => {
        const incompleteTasks = taskMetrics.incomplete;
        if (incompleteTasks === 0) return null;
        
        const avgCompletionRate = completedByDay.slice(-14).reduce((sum, val) => sum + val, 0) / 14;
        if (avgCompletionRate <= 0) return null;
        
        const daysToComplete = Math.ceil(incompleteTasks / avgCompletionRate);
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + daysToComplete);
        
        return {
          date: completionDate.toISOString().split('T')[0],
          daysRemaining: daysToComplete
        };
      })(),
      
      // On-time delivery rate
      onTimeDelivery: (() => {
        const tasksWithDueDate = project.tasks.filter(task => task.completed && task.dueDate);
        if (tasksWithDueDate.length === 0) return null;
        
        const onTimeCount = tasksWithDueDate.filter(task => {
          const dueDate = new Date(task.dueDate!);
          dueDate.setHours(23, 59, 59, 999);
          const completedDate = new Date(task.updatedAt);
          return completedDate <= dueDate;
        }).length;
        
        return Math.round((onTimeCount / tasksWithDueDate.length) * 100);
      })(),
      
      // Risk assessment
      riskAssessment: (() => {
        // Calculate risk score based on multiple factors
        let riskScore = 0;
        
        // Factor 1: Overdue tasks percentage
        const overduePercentage = taskMetrics.total > 0 ? 
          (tasksByDueDate.overdue / taskMetrics.total) * 100 : 0;
        riskScore += overduePercentage > 20 ? 25 : 
                    overduePercentage > 10 ? 15 : 
                    overduePercentage > 5 ? 5 : 0;
        
        // Factor 2: Backlog trend
        riskScore += backlogTrend > 0.3 ? 25 : 
                    backlogTrend > 0.1 ? 15 : 
                    backlogTrend > 0 ? 5 : 0;
        
        // Factor 3: Velocity trend
        riskScore += velocityTrend < -0.2 ? 25 : 
                    velocityTrend < -0.1 ? 15 : 
                    velocityTrend < 0 ? 5 : 0;
        
        // Factor 4: Completion rate
        const completionRate = taskMetrics.total > 0 ? 
          (taskMetrics.completed / taskMetrics.total) * 100 : 0;
        riskScore += completionRate < 30 ? 25 : 
                    completionRate < 50 ? 15 : 
                    completionRate < 70 ? 5 : 0;
        
        // Determine risk level
        let riskLevel;
        if (riskScore >= 60) riskLevel = 'High';
        else if (riskScore >= 30) riskLevel = 'Medium';
        else riskLevel = 'Low';
        
        return { score: riskScore, level: riskLevel };
      })()
    };
    
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      taskMetrics,
      tasksByDueDate,
      taskActivityOverTime,
      memberPerformance,
      // New advanced analytics
      timeSeriesAnalysis,
      aiInsights,
      businessMetrics
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}