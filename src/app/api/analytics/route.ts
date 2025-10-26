import { NextRequest, NextResponse } from 'next/server';

// Types for analytics data
interface AnalyticsData {
  totalUsers: number;
  activeUsersByDay: Array<{ date: string; count: number }>;
  eventsFrequency: Array<{ eventName: string; count: number }>;
  screenViews: Array<{ screenName: string; count: number }>;
}

// Dynamically import BigQuery to avoid build errors when package is not installed
async function getBigQueryClient() {
  try {
    const { BigQuery } = await import('@google-cloud/bigquery');
    
    // For production, use service account from environment variable
    // For development, we'll return null to use fallback data
    const serviceAccountKey = process.env.BIGQUERY_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!serviceAccountKey || !projectId) {
      console.warn('BigQuery credentials not configured. Using fallback data.');
      return null;
    }

    const credentials = JSON.parse(serviceAccountKey);
    return new BigQuery({
      projectId,
      credentials,
    });
  } catch (error) {
    console.warn('BigQuery not available. Using fallback data.');
    return null;
  }
}

// Generate fallback analytics data (for development/testing)
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

  return {
    totalUsers: 234,
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
  };
}

// Query BigQuery for analytics data
async function queryBigQuery(days: number = 30): Promise<AnalyticsData | null> {
  const bigquery = await getBigQueryClient();
  if (!bigquery) return null;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const datasetId = `${projectId}.analytics_*`; // Firebase Analytics datasets
  
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query 1: Total Users and Active Users by Day
    const dailyActiveUsersQuery = `
      SELECT
        event_date as date,
        COUNT(DISTINCT user_pseudo_id) as count
      FROM \`${projectId}.analytics_${Buffer.from(projectId).toString('hex').slice(0, 12)}.events_*\`
      WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE(@start_date)) AND FORMAT_DATE('%Y%m%d', DATE(@end_date))
      GROUP BY event_date
      ORDER BY event_date ASC
    `;

    // Query 2: Event Frequency
    const eventFrequencyQuery = `
      SELECT
        event_name as eventName,
        COUNT(*) as count
      FROM \`${projectId}.analytics_${Buffer.from(projectId).toString('hex').slice(0, 12)}.events_*\`
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
      FROM \`${projectId}.analytics_${Buffer.from(projectId).toString('hex').slice(0, 12)}.events_*\`
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
  } catch (error) {
    console.error('Error querying BigQuery:', error);
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

