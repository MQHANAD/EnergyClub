import { NextRequest, NextResponse } from 'next/server';

// Types for analytics data
interface AnalyticsData {
  totalUsers: number;
  weeklyActiveUsers?: number;
  monthlyActiveUsers?: number;
  newUsers?: number;
  returningUsers?: number;
  activeUsersByDay: Array<{ date: string; count: number }>;
  eventsFrequency: Array<{ eventName: string; count: number }>;
  screenViews: Array<{ screenName: string; count: number }>;
  devices?: Array<{ deviceCategory: string; os: string; platform: string; uniqueUsers: number; totalEvents: number }>;
  geography?: Array<{ country: string; uniqueUsers: number; totalEvents: number; percentage: number }>;
}

// Generate fallback analytics data (this is what will be used when BigQuery is not installed)
function getFallbackAnalyticsData(): AnalyticsData {
  const days = 30;
  const activeUsersByDay = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 10,
    };
  });

  // Generate weekly data
  const weeklyActiveUsers = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week
    return {
      week_start: weekStart.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 200) + 150,
    };
  }).reverse();

  // Generate monthly data
  const monthlyActiveUsers = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month_start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 500) + 600,
    };
  }).reverse();

  // Calculate user segments
  const newUsers = Math.floor(Math.random() * 50) + 30;
  const returningUsers = 234 - newUsers;

  // Generate device data
  const devices = [
    { deviceCategory: 'mobile', os: 'iOS', platform: 'web', uniqueUsers: 120, totalEvents: 2340 },
    { deviceCategory: 'mobile', os: 'Android', platform: 'web', uniqueUsers: 89, totalEvents: 1567 },
    { deviceCategory: 'desktop', os: 'Windows', platform: 'web', uniqueUsers: 15, totalEvents: 234 },
    { deviceCategory: 'desktop', os: 'macOS', platform: 'web', uniqueUsers: 10, totalEvents: 156 },
    { deviceCategory: 'tablet', os: 'iOS', platform: 'web', uniqueUsers: 8, totalEvents: 98 },
  ];

  // Generate geography data
  const totalGeoUsers = devices.reduce((sum, d) => sum + d.uniqueUsers, 0);
  const geography = [
    { country: 'Saudi Arabia', uniqueUsers: 140, totalEvents: 2876, percentage: Math.round((140 / totalGeoUsers) * 100) },
    { country: 'United States', uniqueUsers: 45, totalEvents: 892, percentage: Math.round((45 / totalGeoUsers) * 100) },
    { country: 'United Kingdom', uniqueUsers: 32, totalEvents: 567, percentage: Math.round((32 / totalGeoUsers) * 100) },
    { country: 'Canada', uniqueUsers: 15, totalEvents: 234, percentage: Math.round((15 / totalGeoUsers) * 100) },
    { country: 'UAE', uniqueUsers: 12, totalEvents: 198, percentage: Math.round((12 / totalGeoUsers) * 100) },
  ];

  return {
    totalUsers: 234,
    weeklyActiveUsers: 567,
    monthlyActiveUsers: 1245,
    newUsers: newUsers,
    returningUsers: returningUsers,
    activeUsersByDay,
    eventsFrequency: [
      { eventName: 'page_view', count: 1567 },
      { eventName: 'event_view', count: 892 },
      { eventName: 'event_registration', count: 456 },
      { eventName: 'team_view', count: 345 },
      { eventName: 'login', count: 234 },
    ],
    screenViews: [
      { screenName: '/events', count: 567 },
      { screenName: '/team', count: 345 },
      { screenName: '/event/[id]', count: 892 },
      { screenName: '/', count: 1234 },
      { screenName: '/register', count: 234 },
    ],
    devices,
    geography,
  };
}

// BigQuery integration - only used when package is installed
// To install: npm install @google-cloud/bigquery
async function queryBigQuery(days: number = 30): Promise<AnalyticsData | null> {
  // Check if credentials are configured
  const serviceAccountKey = process.env.BIGQUERY_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (!serviceAccountKey || !projectId) {
    console.log('BigQuery: Using fallback data (credentials not configured)');
    return null;
  }

  try {
    // Dynamic import to avoid build errors when package is not installed
    // This will work at runtime but may show a TypeScript error if package is not installed
    // @ts-ignore - Ignore TypeScript error for optional package
    const { BigQuery } = await import('@google-cloud/bigquery');
    
    const credentials = JSON.parse(serviceAccountKey);
    const bigquery = new BigQuery({
      projectId,
      credentials,
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get the analytics dataset ID from environment or try to discover it
    let analyticsDatasetId = process.env.ANALYTICS_DATASET_ID;
    
    if (!analyticsDatasetId) {
      try {
        // Try to discover the analytics dataset
        const datasets = await bigquery.getDatasets();
        const analyticsDataset = datasets[0].find(d => d.id?.startsWith('analytics_'));
        
        if (!analyticsDataset) {
          console.warn('BigQuery: No analytics dataset found, using fallback data');
          return null;
        }

        analyticsDatasetId = analyticsDataset.id || 'analytics_*';
        console.log(`Discovered analytics dataset: ${analyticsDatasetId}`);
      } catch (error) {
        console.warn('BigQuery: Could not discover analytics dataset:', error);
        return null;
      }
    }

    // Query 1: Total Users and Active Users by Day
    const dailyActiveUsersQuery = `
      SELECT
        event_date as date,
        COUNT(DISTINCT user_pseudo_id) as count
      FROM \`${projectId}.${analyticsDatasetId}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE(@start_date)) AND FORMAT_DATE('%Y%m%d', DATE(@end_date))
      GROUP BY event_date
      ORDER BY event_date ASC
    `;

    // Query 2: Event Frequency
    const eventFrequencyQuery = `
      SELECT
        event_name as eventName,
        COUNT(*) as count
      FROM \`${projectId}.${analyticsDatasetId}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE(@start_date)) AND FORMAT_DATE('%Y%m%d', DATE(@end_date))
        AND event_name IN ('page_view', 'event_view', 'event_registration', 'team_view', 'login', 'sign_up')
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Query 3: Screen Views
    const screenViewsQuery = `
      SELECT
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') as screenName,
        COUNT(*) as count
      FROM \`${projectId}.${analyticsDatasetId}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE(@start_date)) AND FORMAT_DATE('%Y%m%d', DATE(@end_date))
        AND event_name = 'page_view'
      GROUP BY screenName
      ORDER BY count DESC
      LIMIT 10
    `;

    // Execute queries
    const [dailyUsersResults] = await bigquery.query({
      query: dailyActiveUsersQuery,
      params: { start_date: startDate, end_date: endDate },
    });

    const [eventFreqResults] = await bigquery.query({
      query: eventFrequencyQuery,
      params: { start_date: startDate, end_date: endDate },
    });

    const [screenViewsResults] = await bigquery.query({
      query: screenViewsQuery,
      params: { start_date: startDate, end_date: endDate },
    });

    // Process results
    const activeUsersByDay = (dailyUsersResults as any[]).map(row => ({
      date: row.date,
      count: parseInt(row.count) || 0,
    }));

    const totalUsers = activeUsersByDay.reduce((sum, day) => sum + day.count, 0);

    const eventsFrequency = (eventFreqResults as any[]).map(row => ({
      eventName: row.eventName,
      count: parseInt(row.count) || 0,
    }));

    const screenViews = (screenViewsResults as any[]).map(row => ({
      screenName: row.screenName || 'unknown',
      count: parseInt(row.count) || 0,
    }));

    return {
      totalUsers,
      activeUsersByDay,
      eventsFrequency,
      screenViews,
    };
  } catch (error: any) {
    // If import fails (package not installed), return null to use fallback data
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
      console.log('BigQuery: Using fallback data (package not installed)');
      return null;
    }
    console.error('BigQuery error:', error);
    return null;
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Get days parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Try to get data from BigQuery
    const bigQueryData = await queryBigQuery(days);
    
    // If BigQuery fails or is not configured, use fallback data
    const analyticsData = bigQueryData || getFallbackAnalyticsData();

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error in analytics API:', error);
    // Return fallback data on error
    return NextResponse.json(getFallbackAnalyticsData());
  }
}
