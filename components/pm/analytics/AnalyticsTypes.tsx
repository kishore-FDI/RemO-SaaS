// types/AnalyticsTypes.ts

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  incomplete: number;
  archived: number;
}

export interface TasksByDueDate {
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  dueLater: number;
  noDueDate: number;
}

export interface TaskActivity {
  date: string;
  created: number;
  completed: number;
}

export interface MemberPerformance {
  userId: string;
  name: string;
  tasksAssigned: number;
  tasksCompleted: number;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'warning' | 'info';
  metric: string;
}

export interface RiskAssessment {
  level: 'Low' | 'Medium' | 'High';
  score: number;
}

export interface EstimatedCompletion {
  date: string;
  daysRemaining: number;
}

export interface BusinessMetrics {
  cycleTime: number | null;
  throughput: number;
  onTimeDelivery: number | null;
  riskAssessment: RiskAssessment;
  estimatedCompletion?: EstimatedCompletion;
}

export interface SeasonalityPattern {
  hasSeasonality: boolean;
  pattern: number[];
}

export interface TimeSeriesSeasonality {
  created: SeasonalityPattern;
  completed: SeasonalityPattern;
}

export interface TimeSeriesAnomaly {
  index: number;
  value: number;
  date: string;
}

export interface TimeSeriesAnomalies {
  created: TimeSeriesAnomaly[];
  completed: TimeSeriesAnomaly[];
}

export interface TimeSeriesForecast {
  dates: string[];
  created: number[];
  completed: number[];
}

export interface TimeSeriesAnalysis {
  forecast: TimeSeriesForecast;
  seasonality: TimeSeriesSeasonality;
  anomalies: TimeSeriesAnomalies;
  movingAverages: {
    created: number[];
    completed: number[];
  };
}

export interface AnalyticsData {
  project: Project;
  taskMetrics: TaskMetrics;
  tasksByDueDate: TasksByDueDate;
  taskActivityOverTime: TaskActivity[];
  memberPerformance: MemberPerformance[];
  aiInsights?: AIInsight[];
  businessMetrics?: BusinessMetrics;
  timeSeriesAnalysis?: TimeSeriesAnalysis;
}

export interface ProjectHealth {
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
  details: {
    completionRate: number;
    overdueRate: number;
    activityLevel: number;
  };
}

export interface ActivityTrends {
  created: number;
  completed: number;
}

export interface CumulativeActivity extends TaskActivity {
  cumulativeCreated: number;
  cumulativeCompleted: number;
  backlog: number;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string;
}