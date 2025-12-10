// Extended analytics types for comprehensive dashboard

export interface DailyActiveUsers {
  date: string;
  count: number;
}

export interface WeeklyActiveUsers {
  week_start: string;
  count: number;
}

export interface MonthlyActiveUsers {
  month_start: string;
  count: number;
}

export interface UserSegments {
  newUsers: number;
  returningUsers: number;
  totalUsers: number;
  newUsersPercentage: number;
  returningUsersPercentage: number;
}

export interface DeviceBreakdown {
  deviceCategory: string;
  os: string;
  platform: string;
  uniqueUsers: number;
  totalEvents: number;
}

export interface GeographicDistribution {
  country: string;
  uniqueUsers: number;
  totalEvents: number;
  percentage: number;
}

export interface EntryExitPages {
  entryPages: Array<{ page: string; count: number }>;
  exitPages: Array<{ page: string; count: number }>;
}

export interface RetentionCohort {
  cohort_date: string;
  total_users: number;
  day_1_retained: number;
  day_7_retained: number;
  day_30_retained: number;
  day_1_retention_rate: number;
  day_7_retention_rate: number;
  day_30_retention_rate: number;
}

export interface SessionAnalytics {
  event_date: string;
  total_sessions: number;
  unique_users: number;
  avg_sessions_per_user: number;
}

export interface EngagementMetrics {
  eventName: string;
  usersWithEvent: number;
  totalOccurrences: number;
  avgPerUser: number;
}

export interface UsagePatterns {
  hour_of_day: number;
  day_of_week: number;
  totalEvents: number;
  uniqueUsers: number;
}

export interface ErrorTracking {
  eventName: string;
  error_message: string;
  error_count: number;
  affected_users: number;
}

export interface BaseAnalyticsData {
  totalUsers: number;
  activeUsersByDay: DailyActiveUsers[];
  eventsFrequency: Array<{ eventName: string; count: number }>;
  screenViews: Array<{ screenName: string; count: number }>;
}

export interface ExtendedAnalyticsData extends BaseAnalyticsData {
  // Weekly/Monthly active users
  weeklyActiveUsers?: WeeklyActiveUsers[];
  monthlyActiveUsers?: MonthlyActiveUsers[];
  
  // User segments
  userSegments?: UserSegments;
  
  // Device & Platform
  deviceBreakdown?: DeviceBreakdown[];
  
  // Geographic distribution
  geographicDistribution?: GeographicDistribution[];
  
  // Navigation
  entryExitPages?: EntryExitPages;
  
  // Retention
  retentionCohort?: RetentionCohort[];
  
  // Sessions
  sessionAnalytics?: SessionAnalytics[];
  
  // Engagement
  engagementMetrics?: EngagementMetrics[];
  
  // Usage patterns
  usagePatterns?: UsagePatterns[];
  
  // Error tracking
  errorTracking?: ErrorTracking[];
}

export type AnalyticsType = 
  | 'overview'
  | 'user-activity'
  | 'user-segments'
  | 'retention'
  | 'geography'
  | 'devices'
  | 'sessions'
  | 'navigation'
  | 'engagement'
  | 'usage-patterns'
  | 'errors';

